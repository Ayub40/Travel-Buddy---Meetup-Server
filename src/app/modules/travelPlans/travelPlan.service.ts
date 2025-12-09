import { prisma } from "../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { fileUploader } from "../../../helpers/fileUploader";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { travelPlanFilterableFields, travelPlanSearchableFields } from "./travelPlan.constant";
import { IPaginationOptions } from "../../interfaces/pagination";
import { Prisma } from "@prisma/client";

const createTravelPlan = async (user: IAuthUser, travelPlanData: any, files?: Express.Multer.File[]) => {
    if (!user?.email) throw new Error("User not found");


    if (files && files.length > 0) {
        const uploadedImages = await Promise.all(
            files.map(f => fileUploader.uploadToCloudinary(f).then(u => u.secure_url))
        );
        travelPlanData.photos = uploadedImages;
    }

    const userInfo = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

    const travelPlan = await prisma.travelPlan.create({
        data: {
            ...travelPlanData,
            startDate: new Date(travelPlanData.startDate),
            endDate: new Date(travelPlanData.endDate),
            userId: userInfo.id,
        },
    });

    return travelPlan;
};

const getAllTravelPlans = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.TravelPlanWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: ['title', 'destination'].map(field => ({
                [field]: { contains: searchTerm, mode: 'insensitive' }
            }))
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] }
            }))
        });
    }

    const whereConditions: Prisma.TravelPlanWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const travelPlans = await prisma.travelPlan.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
            reviews: true,
            joinRequests: true
        }
    });

    const total = await prisma.travelPlan.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: travelPlans
    };
};

const getTravelPlanById = async (id: string) => {
    const travelPlan = await prisma.travelPlan.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true }
            },
            reviews: true,
            joinRequests: true
        }
    });

    if (!travelPlan) {
        throw new Error("Travel plan not found");
    }

    return travelPlan;
};

const updateTravelPlan = async (
    id: string,
    user: IAuthUser,
    travelPlanData: any,
    files?: Express.Multer.File[]
) => {
    if (!user?.email) throw new Error("User not found");

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: { email: user.email }
    });

    const existingPlan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id },
    });

    // if (existingPlan.userId !== userInfo.id) {
    //     throw new Error("You are not authorized to update this travel plan!");
    // }

    // Authorization: USER can update only their own plan
    if (existingPlan.userId !== userInfo.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        throw new Error("You are not authorized to update this travel plan!");
    }


    // -----------------------------
    // deletePhotos handling
    // -----------------------------
    if (travelPlanData.deletePhotos && Array.isArray(travelPlanData.deletePhotos)) {
        existingPlan.photos = (existingPlan.photos || []).filter(
            p => !travelPlanData.deletePhotos.includes(p)
        );
    }

    // -----------------------------
    // new file uploads
    // -----------------------------
    if (files && files.length > 0) {
        const uploadedImages = await Promise.all(
            files.map(f => fileUploader.uploadToCloudinary(f).then(u => u.secure_url))
        );
        existingPlan.photos = [...(existingPlan.photos || []), ...uploadedImages];
        // existingPlan.photos = [
        //     ...(existingPlan.photos || []),
        //     ...uploadedImages
        // ];
    }

    // -----------------------------
    // Prisma update
    // -----------------------------
    const updatedData: any = {
        photos: existingPlan.photos,
    };


    const allowedFields = ["title", "destination", "country", "budget", "description", "travelType", "visibility", "startDate", "endDate"];
    for (const field of allowedFields) {
        // if (travelPlanData[field] !== undefined) {
        //     if (field === "startDate" || field === "endDate") {
        //         const dateValue = new Date(travelPlanData[field]);
        //         if (!isNaN(dateValue.getTime())) {
        //             updatedData[field] = dateValue;
        //         }
        //     } else {
        //         updatedData[field] = travelPlanData[field];
        //     }
        // }
        if (travelPlanData[field] !== undefined && travelPlanData[field] !== "") {
            updatedData[field] = field === "startDate" || field === "endDate"
                ? new Date(travelPlanData[field])
                : travelPlanData[field];
        }
    }

    const updatedPlan = await prisma.travelPlan.update({
        where: { id },
        data: updatedData,
    });

    return updatedPlan;
};

const matchTravelPlans = async (query: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(query);

    const filters: any = {};

    // Filterable fields
    travelPlanFilterableFields.forEach(field => {
        if (query[field]) {
            filters[field] = query[field];
        }
    });

    // Keyword search
    if (query.searchTerm) {
        filters.OR = travelPlanSearchableFields.map(field => ({
            [field]: { contains: String(query.searchTerm), mode: 'insensitive' }
        }));
    }

    // Optional: filter by interests if passed from frontend
    // if (query.interests) {
    //     const interestsArray = Array.isArray(query.interests) ? query.interests : [query.interests];
    //     filters.user = { interests: { hasSome: interestsArray } };
    // }

    // Exact date match (user selected startDate)
    if (query.startDate) {
        const selectedDate = new Date(query.startDate);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(selectedDate.getDate() + 1);

        filters.startDate = {
            gte: selectedDate, // greater than or equal to selected date
            lt: nextDay         // less than next day → effectively exact date match
        };
    }

    const matchedPlans = await prisma.travelPlan.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: { select: { id: true, name: true, profileImage: true, interests: true } },
            reviews: true,
            joinRequests: true,
        },
    });

    const total = await prisma.travelPlan.count({ where: filters });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: matchedPlans,
    };
};

const deleteTravelPlan = async (id: string, user: IAuthUser) => {
    if (!user?.email) throw new Error("User not found");

    const existing = await prisma.travelPlan.findUniqueOrThrow({
        where: { id }
    });

    await prisma.travelPlan.delete({
        where: { id }
    });

    return { message: "Travel plan deleted successfully" };
};


export const travelPlanService = {
    createTravelPlan,
    getAllTravelPlans,
    getTravelPlanById,
    updateTravelPlan,
    matchTravelPlans,
    deleteTravelPlan,
};

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
    // const { searchTerm, fromDate, toDate, ...filterData } = params;

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
    }

    // -----------------------------
    // Prisma update
    // -----------------------------
    const updatedData: any = {
        photos: existingPlan.photos,
    };


    const allowedFields = ["title", "destination", "country", "budget", "description", "travelType", "visibility", "startDate", "endDate"];
    for (const field of allowedFields) {
  
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

    // Date range filter
    if (query.startDate || query.endDate) {
        filters.startDate = {};
        if (query.startDate) filters.startDate.gte = new Date(query.startDate);
        if (query.endDate) filters.startDate.lte = new Date(query.endDate);
    }


    const matchedPlans = await prisma.travelPlan.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: { select: { id: true, name: true, email: true, profileImage: true, interests: true } },
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

    const userInfo = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

    const existing = await prisma.travelPlan.findUniqueOrThrow({ where: { id } });

    // Authorization: Create User or ADMIN/SUPER_ADMIN 
    if (existing.userId !== userInfo.id && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        throw new Error("You are not authorized to delete this travel plan!");
    }

    await prisma.travelPlan.delete({ where: { id } });

    return { message: "Travel plan deleted successfully" };
};

// New Code
const getMyTravelPlans = async (user: IAuthUser, options: IPaginationOptions) => {
    if (!user?.email) throw new Error("User not found");

    const userInfo = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const whereConditions: Prisma.TravelPlanWhereInput = {
        userId: userInfo.id,
    };

    const travelPlans = await prisma.travelPlan.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
            reviews: true,
            joinRequests: true,
        },
    });

    const total = await prisma.travelPlan.count({ where: whereConditions });

    return { meta: { page, limit, total }, data: travelPlans };
};

const getMyMatchCount = async (user: IAuthUser) => {
    if (!user?.email) throw new Error("User not found");

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: { email: user.email }
    });

    const totalMatches = await prisma.tripJoinRequest.count({
        where: {
            status: "ACCEPTED",
            OR: [
                { userId: userInfo.id },
                {
                    travelPlan: {
                        userId: userInfo.id
                    }
                }
            ]
        }
    });

    return { totalMatches };
};



export const travelPlanService = {
    createTravelPlan,
    getAllTravelPlans,
    getTravelPlanById,
    updateTravelPlan,
    matchTravelPlans,
    deleteTravelPlan,
    getMyTravelPlans,
    getMyMatchCount,
    // getMatchedTravelers
};

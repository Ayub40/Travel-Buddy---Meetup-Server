import { prisma } from "../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { fileUploader } from "../../../helpers/fileUploader";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { travelPlanFilterableFields, travelPlanSearchableFields } from "./travelPlan.constant";

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

const getAllTravelPlans = async (query: any) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(query);

    const travelPlans = await prisma.travelPlan.findMany({
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true }
            },
            reviews: true,
            joinRequests: true
        }
    });

    const total = await prisma.travelPlan.count();

    return {
        meta: {
            page,
            limit,
            total
        },
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

    if (existingPlan.userId !== userInfo.id) {
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
        existingPlan.photos = [
            ...(existingPlan.photos || []),
            ...uploadedImages
        ];
    }

    // -----------------------------
    // Prisma update
    // -----------------------------
    const updatedData: any = {
        photos: existingPlan.photos,
    };


    const allowedFields = ["title", "destination", "country", "budget", "description", "travelType", "visibility", "startDate", "endDate"];
    for (const field of allowedFields) {
        if (travelPlanData[field] !== undefined) {
            if (field === "startDate" || field === "endDate") {
                updatedData[field] = new Date(travelPlanData[field]);
            } else {
                updatedData[field] = travelPlanData[field];
            }
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
    if (query.search) {
        filters.OR = travelPlanSearchableFields.map(field => ({
            [field]: { contains: String(query.search), mode: 'insensitive' }
        }));
    }

    // Optional: filter by interests if passed from frontend
    if (query.interests) {
        const interestsArray = Array.isArray(query.interests) ? query.interests : [query.interests];
        filters.user = { interests: { hasSome: interestsArray } };
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

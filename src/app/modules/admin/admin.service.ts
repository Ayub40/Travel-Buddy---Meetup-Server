import { Admin, Prisma, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { prisma } from "../../shared/prisma";
import { IPaginationOptions } from "../../interfaces/pagination";
import { adminSearchAbleFields } from "./admin.constant";
import { IAdminFilterRequest } from "./admin.interface";
import { IAuthUser } from "../../interfaces/common";

const getAllFromDB = async (params: IAdminFilterRequest, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.AdminWhereInput[] = [];

    if (params.searchTerm) {
        andConditions.push({
            OR: adminSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    };

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    };

    andConditions.push({
        isDeleted: false
    })

    //console.dir(andConditions, { depth: 'inifinity' })
    const whereConditions: Prisma.AdminWhereInput = { AND: andConditions }

    const result = await prisma.admin.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        }
    });

    const total = await prisma.admin.count({
        where: whereConditions
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
};

const getByIdFromDB = async (id: string): Promise<Admin | null> => {
    const result = await prisma.admin.findUnique({
        where: {
            id,
            isDeleted: false
        }
    })

    return result;
};

const updateIntoDB = async (id: string, data: Partial<Admin>): Promise<Admin> => {
    await prisma.admin.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.admin.update({
        where: {
            id
        },
        data
    });

    return result;
};

const deleteFromDB = async (id: string): Promise<Admin | null> => {

    await prisma.admin.findUniqueOrThrow({
        where: {
            id
        }
    });

    const result = await prisma.$transaction(async (transactionClient) => {
        const adminDeletedData = await transactionClient.admin.delete({
            where: {
                id
            }
        });

        await transactionClient.user.delete({
            where: {
                email: adminDeletedData.email
            }
        });

        return adminDeletedData;
    });

    return result;
}

const softDeleteFromDB = async (id: string): Promise<Admin | null> => {
    await prisma.admin.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.$transaction(async (transactionClient) => {
        const adminDeletedData = await transactionClient.admin.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        });

        await transactionClient.user.update({
            where: {
                email: adminDeletedData.email
            },
            data: {
                status: UserStatus.DELETED
            }
        });

        return adminDeletedData;
    });

    return result;
}

const getAppStatistics = async () => {
    const activeUsers = await prisma.user.count({
        where: {
            status: UserStatus.ACTIVE,
        },
    });

    const totalDestinations = await prisma.travelPlan.count();

    const groupsFormed = await prisma.tripJoinRequest.count({
        where: {
            status: 'ACCEPTED',
        },
    });

    const uniqueCountries = await prisma.travelPlan.groupBy({
        by: ['country'],
    });

    const activeUserImages = await prisma.user.findMany({
        // where: { status: 'ACTIVE' },
        where: {
            status: 'ACTIVE',
            profileImage: { not: null } 
        },
        take: 5,
        select: { profileImage: true }
    });

    return {
        stats: [
            {
                label: "Active Users",
                value: activeUsers,
                color: "bg-teal-50",
                text: "text-teal-600"
            },
            {
                label: "Destinations",
                value: totalDestinations,
                color: "bg-pink-50",
                text: "text-pink-600"
            },
            {
                label: "Groups Formed",
                value: groupsFormed,
                color: "bg-yellow-50",
                text: "text-yellow-600"
            },
            {
                label: "Countries",
                value: uniqueCountries.length,
                color: "bg-red-50",
                text: "text-red-600"
            }
        ],
        activeUserImages: activeUserImages.map(u => u.profileImage)
    };
};


export const AdminService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    deleteFromDB,
    softDeleteFromDB,
    getAppStatistics

}
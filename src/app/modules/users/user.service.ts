import { Admin, Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import { Request } from "express";
import config from "../../../config";
import { fileUploader } from "../../../helpers/fileUploader";
import { paginationHelper } from "../../../helpers/paginationHelper";
// import prisma from "../../../shared/prisma";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { userSearchAbleFields } from "./user.constant";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";

const createAdmin = async (req: Request): Promise<Admin> => {

    const file = req.file;

    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.admin.profilePhoto = uploadToCloudinary?.secure_url
    }

    const hashedPassword: string = await bcrypt.hash(req.body.password, Number(config.salt_round))

    const userData = {
        email: req.body.admin.email,
        password: hashedPassword,
        role: UserRole.ADMIN
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        await transactionClient.user.create({
            data: userData
        });

        const createdAdminData = await transactionClient.admin.create({
            data: req.body.admin
        });

        return createdAdminData;
    });

    return result;
};

const createUser = async (req: Request) => {
    const file = req.file;

    if (file) {
        const uploadedImage = await fileUploader.uploadToCloudinary(file);
        req.body.user.profileImage = uploadedImage?.secure_url;
    }

    const hashedPassword = await bcrypt.hash(
        req.body.password,
        Number(config.salt_round)
    );

    const userData = {
        name: req.body.user.name,
        email: req.body.user.email,
        password: hashedPassword,
        needPasswordChange: false,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,

        profileImage: req.body.user.profileImage,

        bio: req.body.user.bio,
        age: req.body.user.age ?? null,
        gender: req.body.user.gender,
        country: req.body.user.country,
        city: req.body.user.city,
        currentLocation: req.body.user.location,

        interests: req.body.user.interests || [],
        visitedCountries: req.body.user.visitedCountries || [],

        budgetRange: req.body.user.budgetRange,
        isVerified: false,
    };

    const result = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: userData
        });

        return createdUser;
    });

    return result;
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: userSearchAbleFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            }))
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        });
    }

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            profileImage: true,
            bio: true,
            age: true,
            gender: true,
            country: true,
            city: true,
            currentLocation: true,
            interests: true,
            visitedCountries: true,
            budgetRange: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            admin: true
        }
    });

    const total = await prisma.user.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: users
    };
};

const changeProfileStatus = async (id: string, status: UserRole) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });

    const updateUserStatus = await prisma.user.update({
        where: {
            id
        },
        data: status
    });

    return updateUserStatus;
};

const getMe = async (user: any) => {
    if (!user?.email) {
        throw new Error("Invalid user!");
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: { email: user.email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            needPasswordChange: true,

            profileImage: true,
            bio: true,
            age: true,
            gender: true,

            country: true,
            city: true,
            currentLocation: true,

            interests: true,
            visitedCountries: true,
            budgetRange: true,
            isVerified: true,

            createdAt: true,
            updatedAt: true,

            // Travel Plans Created by User
            travelPlans: {
                select: {
                    id: true,
                    title: true,
                    destination: true,
                    country: true,
                    startDate: true,
                    endDate: true,
                    budget: true,
                    travelType: true,
                    visibility: true,
                    photos: true,
                    createdAt: true,
                    updatedAt: true,
                }
            },

            // Reviews Given by User
            reviews: {
                select: {
                    id: true,
                    travelPlanId: true,
                    rating: true,
                    comment: true,
                    createdAt: true
                }
            },

            // Payments made by user
            payments: {
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    status: true,
                    paymentFor: true,
                    planType: true,
                    method: true,
                    createdAt: true
                }
            },

            // Join Requests made by user
            joinRequests: {
                select: {
                    id: true,
                    travelPlanId: true,
                    status: true,
                    createdAt: true,
                }
            }
        }
    });

    return userData;
};

const updateMyProfile = async (user: IAuthUser, req: Request) => {
    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
            status: UserStatus.ACTIVE
        }
    });

    const file = req.file;
    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.profilePhoto = uploadToCloudinary?.secure_url;
    }

    let profileInfo;

    if (userInfo.role === UserRole.SUPER_ADMIN) {
        profileInfo = await prisma.admin.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        })
    }
    else if (userInfo.role === UserRole.ADMIN) {
        profileInfo = await prisma.admin.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        })
    }
    else if (userInfo.role === UserRole.USER) {
        profileInfo = await prisma.user.update({
            where: {
                email: userInfo.email
            },
            data: req.body,
        });
    }

    return { ...profileInfo };
}

// New
// get a single user's public profile
const getSingleUserFromDB = async (id: string) => {
    const result = await prisma.user.findUnique({
        where: {
            id,
            status: UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            bio: true,
            interests: true,
            visitedCountries: true,
            currentLocation: true,
            profileImage: true,
            // coverPhoto: true,
            // socialLinks: true,

            travelPlans: {
                select: {
                    id: true,
                    title: true,
                    destination: true,
                    country: true,
                    startDate: true,
                    endDate: true,
                    budget: true,
                    travelType: true,
                    visibility: true,
                }
            },

            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    travelPlanId: true,
                    createdAt: true,
                    //   reviewer: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    }
                }
            },

            // payments: {
            //     select: {
            //         id: true,
            //         amount: true,
            //         status: true,
            //         planType: true,
            //     }
            // },

            // joinRequests: {
            //     select: {
            //         id: true,
            //         status: true,
            //         travelPlanId: true,
            //     }
            // },

            createdAt: true,
            updatedAt: true,
        },
    });

    return result;
};


// Admin Only

// Delete User
const softDeleteUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    // ❗ Soft Delete → status = DELETED
    const result = await prisma.user.update({
        where: { id },
        data: {
            status: "DELETED"
        }
    });

    // await prisma.user.delete({
    //     where: { id }
    // });

    return { message: "User deleted successfully" };
};

// Delete User
const hardDeleteUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    await prisma.user.delete({
        where: { id }
    });

    return { message: "User deleted successfully" };
};





// const getAllUsers = async (query: any) => {
//     const { page, limit, skip, sortBy, sortOrder } =
//         paginationHelper.calculatePagination(query);

//     const filters: any = {};

//     // search by name or email
//     if (query.search) {
//         filters.OR = [
//             { name: { contains: query.search, mode: "insensitive" } },
//             { email: { contains: query.search, mode: "insensitive" } },
//         ];
//     }

//     // optional role filter (if needed)
//     if (query.role) {
//         filters.role = query.role;
//     }

//     const users = await prisma.user.findMany({
//         where: filters,
//         skip,
//         take: limit,
//         orderBy: { [sortBy]: sortOrder },
//         select: {
//             id: true,
//             name: true,
//             email: true,
//             profileImage: true,
//             role: true,
//         },
//     });

//     const total = await prisma.user.count({
//         where: filters,
//     });

//     return {
//         meta: {
//             page,
//             limit,
//             total,
//         },
//         data: users,
//     };
// };



export const userService = {
    createAdmin,
    createUser,
    getAllFromDB,
    changeProfileStatus,
    getMe,
    updateMyProfile,
    softDeleteUser,
    hardDeleteUser,
    // getAllUsers
    getSingleUserFromDB
}
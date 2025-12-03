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


// const getAllFromDB = async (params: any, options: IPaginationOptions) => {
//     const { page, limit, skip } = paginationHelper.calculatePagination(options);
//     const { searchTerm, ...filterData } = params;

//     const andConditions: Prisma.UserWhereInput[] = [];

//     if (params.searchTerm) {
//         andConditions.push({
//             OR: userSearchAbleFields.map(field => ({
//                 [field]: {
//                     contains: params.searchTerm,
//                     mode: 'insensitive'
//                 }
//             }))
//         })
//     };

//     if (Object.keys(filterData).length > 0) {
//         andConditions.push({
//             AND: Object.keys(filterData).map(key => ({
//                 [key]: {
//                     equals: (filterData as any)[key]
//                 }
//             }))
//         })
//     };

//     const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

//     const result = await prisma.user.findMany({
//         where: whereConditions,
//         skip,
//         take: limit,
//         orderBy: options.sortBy && options.sortOrder ? {
//             [options.sortBy]: options.sortOrder
//         } : {
//             createdAt: 'desc'
//         },
//         select: {
//             id: true,
//             email: true,
//             role: true,
//             needPasswordChange: true,
//             status: true,
//             createdAt: true,
//             updatedAt: true,
//             admin: true,
//             // patient: true,
//             // doctor: true
//         }
//     });

//     const total = await prisma.user.count({
//         where: whereConditions
//     });

//     return {
//         meta: {
//             page,
//             limit,
//             total
//         },
//         data: result
//     };
// };

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

const getMyProfile = async (user: IAuthUser) => {
    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
            status: UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            needPasswordChange: true,
            role: true,
            status: true,
        },
    });

    let profileInfo;

    if (userInfo.role === UserRole.SUPER_ADMIN) {
        profileInfo = await prisma.admin.findUnique({
            where: {
                email: userInfo.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                contactNumber: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    } else if (userInfo.role === UserRole.ADMIN) {
        profileInfo = await prisma.admin.findUnique({
            where: {
                email: userInfo.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                contactNumber: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    } else if (userInfo.role === UserRole.USER) {
        profileInfo = await prisma.admin.findUnique({
            where: {
                email: userInfo.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
                contactNumber: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    return { ...userInfo, ...profileInfo };
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


    return { ...profileInfo };
}


export const userService = {
    createAdmin,
    createUser,
    getAllFromDB,
    changeProfileStatus,
    getMyProfile,
    updateMyProfile
}
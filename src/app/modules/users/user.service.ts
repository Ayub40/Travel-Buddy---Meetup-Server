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
import { Secret } from "jsonwebtoken";
import { jwtHelpers } from "../../../helpers/jwtHelpers";

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

    // SearchTerm (only string fields)
    if (searchTerm) {
        andConditions.push({
            OR: userSearchAbleFields.map(field => ({
                [field]: { contains: searchTerm, mode: 'insensitive' }
            }))
        });
    }

    // Filters
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => {
                const value = (filterData as any)[key];

                // Array fields
                if (['interests', 'visitedCountries'].includes(key)) {
                    return { [key]: { has: value } }; // 'has' is for single value
                }

                // String, enum, number, boolean fields
                return { [key]: { equals: value } };
            })
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

const changeProfileStatus = async (id: string, payload: { role: UserRole }) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new Error("User not found!");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            role: payload.role
        }
    });

    return updatedUser;
};

const getMe = async (user: any) => {
    const email =
        user?.email ||
        user?.payload?.email ||
        user?.user?.email;

    // if (!user?.email) {
    if (!email) {
        throw new Error("Invalid user!");
    }

    const userData = await prisma.user.findUniqueOrThrow({
        // where: { email: user.email },
        // where: {
        //     email: user.email || user?.payload?.email
        // },
        where: { email },
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

    console.log("Uploaded file:", file); // 🔹 Debug

    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        //  req.body.profileImage = uploaded?.secure_url; // USER
        console.log("Cloudinary result:", uploadToCloudinary); // 🔹 Debug

        if (userInfo.role === UserRole.USER) {
            // Ensure it's a string
            req.body.profileImage = typeof uploadToCloudinary === "string"
                ? uploadToCloudinary
                : uploadToCloudinary?.secure_url;
        } else {
            // Admin/SuperAdmin
            req.body.profilePhoto = typeof uploadToCloudinary === "string"
                ? uploadToCloudinary
                : uploadToCloudinary?.secure_url;
        }
    }

    console.log("Request body before update:", req.body); // 🔹 Debug

    let profileInfo;

    // Minor fix: parse 'data' field if it exists
    let updateData: any = { ...req.body };

    if (updateData.data && typeof updateData.data === "string") {
        try {
            const parsedData = JSON.parse(updateData.data);
            updateData = { ...updateData, ...parsedData };
            delete updateData.data;
        } catch (err) {
            console.log("JSON parse error:", err);
        }
    }

    // Ensure profileImage is a string
    if (updateData.profileImage && typeof updateData.profileImage !== "string") {
        updateData.profileImage = updateData.profileImage.secure_url || "";
    }

    // ===== NEW: Convert array fields from string to array if needed =====
    const arrayFields = ["interests", "visitedCountries"];
    arrayFields.forEach((field) => {
        if (updateData[field] && typeof updateData[field] === "string") {
            try {
                updateData[field] = JSON.parse(updateData[field]);
            } catch (err) {
                // fallback: split by comma
                updateData[field] = updateData[field].split(",").map((item: string) => item.trim());
            }
        }
    });

    // ===== UPDATE Prisma =====
    if (userInfo.role === UserRole.SUPER_ADMIN || userInfo.role === UserRole.ADMIN) {
        profileInfo = await prisma.admin.update({
            where: { email: userInfo.email },
            // data: req.body
            data: updateData,
        });
    } else if (userInfo.role === UserRole.USER) {
        // Ensure profileImage is a string
        // const updateData = { ...req.body };
        // if (updateData.profileImage && typeof updateData.profileImage !== "string") {
        //     updateData.profileImage = updateData.profileImage.secure_url || "";
        // }

        const validData = {
            name: updateData.name,
            profileImage: updateData.profileImage,
            bio: updateData.bio,
            currentLocation: updateData.location || updateData.currentLocation,
            interests: updateData.interests,
            visitedCountries: updateData.visitedCountries
        };


        profileInfo = await prisma.user.update({
            where: { email: userInfo.email },
            // data: updateData
            data: validData
        });
    }

    return { ...profileInfo };
};

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

export const getDashboardStats = async (userEmail: string) => {
    // Search User
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: userEmail },
        select: { id: true, name: true, profileImage: true }
    });
    // console.log("🔥 All Users Image Check:", user);
    const userId = user.id;

    // Main Stats
    const totalTravelPlans = await prisma.travelPlan.count({ where: { userId } });
    const totalJoinRequests = await prisma.tripJoinRequest.count({ where: { userId } });
    const totalReviews = await prisma.review.count({ where: { userId } });
    const totalPayments = await prisma.payment.count({ where: { userId } });

    //  User's Travel Plans
    const userTravelPlans = await prisma.travelPlan.findMany({
        where: { userId, visibility: true },
        select: { id: true, destination: true, startDate: true, endDate: true }
    });


    // 3️⃣ ✅ REAL MATCH COUNT (only ACCEPTED)
    // When:
    // - Someone sent request to my travel plan
    // - I accepted it

    // 4️⃣ ✅ My outgoing join requests (Sabuj → Others)
    const myJoinRequests = await prisma.tripJoinRequest.findMany({
        // where: { userId },
        where: {
            travelPlan: {
                userId: userId
            },
            status: "PENDING"
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    profileImage: true,
                    email: true
                }
            },
            travelPlan: {
                select: {
                    title: true,
                    country: true,
                    destination: true,
                    budget: true,
                    description: true,
                    travelType: true,
                    startDate: true,
                    endDate: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // 5️⃣ ✅ Incoming accepted matches (Others → My trips)
    // const matchedCount = await prisma.tripJoinRequest.count({
    const matchedCount = await prisma.tripJoinRequest.findMany({
        where: {
            status: "ACCEPTED",
            travelPlan: {
                userId
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    profileImage: true,
                }
            },
            travelPlan: {
                select: {
                    id: true,
                    title: true,
                    destination: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    //  Upcoming Trips (future trips filter)
    const upcomingTrips = await prisma.travelPlan.findMany({
        where: { userId, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        select: {
            id: true,
            title: true,
            country: true,
            destination: true,
            budget: true,
            description: true,
            travelType: true,
            startDate: true,
            endDate: true,
            joinRequests: {
                select: {
                    id: true,
                    status: true
                }
            }
        }
    });

    // myJoinRequests --> incomingJoinRequests
    // matchedCount   --> acceptedMatches 

    return {
        userName: user.name,
        totalTravelPlans,
        // totalJoinRequests,
        totalJoinRequests: myJoinRequests.length,
        joinRequests: myJoinRequests,
        matchedCount: matchedCount.length,
        matches: matchedCount,
        totalReviews,
        totalPayments,
        upcomingTrips,
    };
};

export const sendJoinRequest = async (userEmail: string, travelPlanId: string) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail }, select: { id: true, email: true } });
    const userId = user.id;

    const travelPlan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id: travelPlanId },
        // select: { id: true, userId: true, }
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    if (travelPlan.userId === userId) {
        throw new Error("You cannot send a join request to your own travel plan.");
    }

    const existingRequest = await prisma.tripJoinRequest.findFirst({
        where: { userId, travelPlanId }
    });
    if (existingRequest) {
        throw new Error("Join request already sent.");
    }

    const joinRequest = await prisma.tripJoinRequest.create({
        data: { userId, travelPlanId, status: "PENDING" }
    });

    return joinRequest;
};

export const updateJoinRequestStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const updated = await prisma.tripJoinRequest.update({
        where: { id: requestId },
        data: { status }
    });
    return updated;
};

const updateUserByAdmin = async (id: string, data: any): Promise<IAuthUser> => {

    const existingUser = await prisma.user.findUniqueOrThrow({ where: { id } });


    const allowedFields = [
        "name", "email", "contactNumber", "role", "status"
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
        if (data[key] !== undefined) {
            updateData[key] = data[key];
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
    });

    return updatedUser;
};

const getUserById = async (id: string): Promise<IAuthUser | null> => {
    const result = await prisma.user.findUnique({ where: { id } });
    return result;
};


export const updateAdminServiceByEmail = async (email: string, payload: any) => {
  // Ensure admin exists and is not soft-deleted
  const admin = await prisma.admin.findFirst({
    where: { email, isDeleted: false },
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Update admin
  const updated = await prisma.admin.update({
    where: { id: admin.id }, // Prisma update needs id
    data: {
      name: payload.name,
      contactNumber: payload.contactNumber,
      profilePhoto: payload.profilePhoto,
    },
  });

  return updated;
};




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
    getSingleUserFromDB,
    getDashboardStats,
    sendJoinRequest,
    updateJoinRequestStatus,
    // getMyJoinRequests
    updateUserByAdmin,
    getUserById,
    updateAdminServiceByEmail
}
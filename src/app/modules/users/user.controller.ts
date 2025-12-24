import { Request, Response } from "express";
import { updateAdminServiceByEmail, userService } from "./user.service";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
// import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.constant";

import { IAuthUser } from "../../interfaces/common";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import ApiError from "../../errors/ApiError";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.createAdmin(req);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin Created successfuly!",
        data: result
    })
});

const createUser = catchAsync(async (req, res) => {
    const result = await userService.createUser(req);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User Created successfuly!",
        data: result
    });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, userFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder'])

    const result = await userService.getAllFromDB(filters, options)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users data fetched!",
        meta: result.meta,
        data: result.data
    })
});

const changeProfileStatus = catchAsync(async (req: Request, res: Response) => {

    const { id } = req.params;
    const result = await userService.changeProfileStatus(id, req.body)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users profile status changed!",
        data: result
    })
});

// const getMe = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

//     // const user = req.user;


//     // const result = await userService.getMyProfile(user as IAuthUser);
//     // const result = await userService.getMe(user as IAuthUser);

//     if (!req.user?.email) throw new ApiError(401, "Unauthorized");
//     const result = await userService.getMe(req.user);
//     console.log("REQ.USER =>", req.user);

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "My profile data fetched!",
//         data: result
//     })
// });

const getMyProfile = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

    const user = req.user;

    const result = await userService.getMyProfile(user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My profile data fetched!",
        data: result
    })
});

const updateMyProfile = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

    const user = req.user;

    const result = await userService.updateMyProfile(user as IAuthUser, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My profile updated!",
        data: result
    })
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.softDeleteUser(req.params.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});

const hardDeleteUser = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.hardDeleteUser(req.params.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await userService.getSingleUserFromDB(id);

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User profile retrieved successfully!",
        data: result,
    });
});

// user.controller.ts
const getDashboardData = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user as IAuthUser;

    if (!user?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userService.getDashboardStats(user.email);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Dashboard data fetched successfully",
        data: result
    });
});

const handleSendJoinRequest = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user as IAuthUser;
    const { travelPlanId } = req.params;

    if (!user?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await userService.sendJoinRequest(user.email, travelPlanId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Join request sent successfully",
        data: result
    });
});

const handleJoinRequest = catchAsync(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new ApiError(400, "Invalid status value");

    const result = await userService.updateJoinRequestStatus(requestId, status as 'ACCEPTED' | 'REJECTED');

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `Join Request ${status.toLowerCase()} successfully!`,
        data: result
    });
});

const updateUserByAdmin = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "User ID is required");

    const result = await userService.updateUserByAdmin(id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User updated successfully!",
        data: result
    });
});

const getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await userService.getUserById(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User fetched successfully!",
        data: result
    });
});


export const updateAdminByEmail = async (req: Request, res: Response) => {
    try {
        const email = req.body.email; // frontend থেকে email পাঠানো হবে
        const payload = req.body; // { name, contactNumber, profilePhoto }

        const updatedAdmin = await updateAdminServiceByEmail(email, payload);

        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin,
        });
    } catch (error: unknown) {
        let message = "Something went wrong";
        if (error instanceof Error) {
            message = error.message;
        }

        return res.status(400).json({
            success: false,
            message,
        });
    }
};




export const userController = {
    createAdmin,
    createUser,
    // getMe,
    getMyProfile,
    getAllFromDB,
    changeProfileStatus,
    updateMyProfile,
    softDeleteUser,
    hardDeleteUser,
    getSingleUser,
    getDashboardData,
    handleSendJoinRequest,
    handleJoinRequest,
    updateUserByAdmin,
    getUserById
}
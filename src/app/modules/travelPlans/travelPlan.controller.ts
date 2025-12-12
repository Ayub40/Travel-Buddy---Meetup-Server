import { Request, Response } from "express";
import { travelPlanService } from "./travelPlan.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { travelPlanFilterableFields, travelPlanSearchableFields } from "./travelPlan.constant";
import pick from "../../shared/pick";
import ApiError from "../../errors/ApiError";

const createTravelPlan = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const travelPlanData = req.body.travelPlan;

    const result = await travelPlanService.createTravelPlan(req.user as IAuthUser, travelPlanData, files);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Travel plan created successfully!",
        data: result,
    });
});

const getAllTravelPlans = catchAsync(async (req: Request, res: Response) => {

    // const filters = pick(req.query, travelPlanSearchableFields);
    const filters = pick(req.query, travelPlanFilterableFields);
    const options: IPaginationOptions = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    // const result = await travelPlanService.getAllTravelPlans(filters, options);

    // Pass searchTerm separately
    const { searchTerm } = req.query;

    const result = await travelPlanService.getAllTravelPlans(
        { ...filters, ...(searchTerm ? { searchTerm } : {}) },
        options
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plans fetched successfully!",
        // data: result,
        meta: result.meta,
        data: result.data
    });
});

export const getTravelPlanById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await travelPlanService.getTravelPlanById(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plan retrieved successfully",
        data: result,
    });
});

export const updateTravelPlan = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    let travelPlanData = req.body;
    if (req.body.travelPlan && typeof req.body.travelPlan === 'string') {
        travelPlanData = JSON.parse(req.body.travelPlan);
    }

    const result = await travelPlanService.updateTravelPlan(
        id,
        user as IAuthUser,
        travelPlanData,
        req.files as Express.Multer.File[]
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plan updated successfully",
        data: result,
    });
});

const matchTravelPlans = catchAsync(async (req: Request, res: Response) => {
    const result = await travelPlanService.matchTravelPlans(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plans matched successfully",
        data: result,
    });
});

export const deleteTravelPlan = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await travelPlanService.deleteTravelPlan(id, user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plan deleted successfully",
        data: result,
    });
});

// New Code
const getMyTravelPlans = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

    const options: IPaginationOptions = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await travelPlanService.getMyTravelPlans(req.user as IAuthUser, options);
    
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your travel plans fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getMyMatchCount = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await travelPlanService.getMyMatchCount(req.user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Matched count fetched successfully",
        data: result
    });
});

// const getMyMatchedTravelers = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
//     const user = req.user!;
//     if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");

//     const result = await travelPlanService.getMatchedTravelers(user.email); 

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Matched travelers fetched successfully",
//         data: result,
//     });
// });



export const travelPlanController = {
    createTravelPlan,
    getAllTravelPlans,
    getTravelPlanById,
    updateTravelPlan,
    matchTravelPlans,
    deleteTravelPlan,
    getMyTravelPlans,
    getMyMatchCount,
    // getMyMatchedTravelers
};

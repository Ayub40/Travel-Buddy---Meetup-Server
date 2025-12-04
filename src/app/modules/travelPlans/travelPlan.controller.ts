import { Request, Response } from "express";
import { travelPlanService } from "./travelPlan.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";

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
    const result = await travelPlanService.getAllTravelPlans(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Travel plans fetched successfully!",
        data: result,
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

export const travelPlanController = {
    createTravelPlan,
    getAllTravelPlans,
    getTravelPlanById,
    updateTravelPlan,
    matchTravelPlans,
    deleteTravelPlan,
};

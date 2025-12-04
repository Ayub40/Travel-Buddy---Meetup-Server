import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { reviewService } from "./review.service";
import { IAuthUser } from "../../interfaces/common";

// Create review
const createReview = catchAsync(
    async (req: Request & { user?: IAuthUser }, res: Response) => {
        const { travelPlanId } = req.params;
        if (!req.user?.email) throw new Error("User not found");

        const result = await reviewService.createReview(
            travelPlanId,
            req.user.email,
            req.body
        );

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Review created successfully",
            data: result,
        });
    }
);


export const reviewController = {
    createReview,
};

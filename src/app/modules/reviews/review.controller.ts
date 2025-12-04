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

// Update review
const updateReview = catchAsync(
    async (req: Request & { user?: IAuthUser }, res: Response) => {
        const { reviewId } = req.params;
        if (!req.user?.email) throw new Error("User not found");

        const result = await reviewService.updateReview(
            reviewId,
            req.user.email,
            req.body
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Review updated successfully",
            data: result,
        });
    }
);


// Delete review
const deleteReview = catchAsync(
    async (req: Request & { user?: IAuthUser }, res: Response) => {
        const { reviewId } = req.params;
        if (!req.user?.email) throw new Error("User not found");

        const result = await reviewService.deleteReview(reviewId, req.user.email);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Review deleted successfully",
            data: result,
        });
    }
);

// Get reviews by plan with average rating
const getReviewsByPlan = catchAsync(async (req: Request, res: Response) => {
    const { travelPlanId } = req.params;

    const result = await reviewService.getReviewsByPlan(travelPlanId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Reviews fetched successfully",
        data: result.reviews,
        meta: {
            averageRating: result.averageRating,
            totalReviews: result.reviews.length,
        },
    });
});


// Get reviews by user with average rating
const getReviewsByUser = catchAsync(
    async (req: Request & { user?: IAuthUser }, res: Response) => {
        if (!req.user?.email) throw new Error("User not found");

        const result = await reviewService.getReviewsByUser(req.user.email);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "User reviews fetched successfully",
            data: result.reviews,
            meta: {
                averageRating: result.averageRating,
                totalReviews: result.reviews.length,
            },
        });
    }
);


export const reviewController = {
    createReview,
    updateReview,
    deleteReview,
    getReviewsByPlan,
    getReviewsByUser,
};

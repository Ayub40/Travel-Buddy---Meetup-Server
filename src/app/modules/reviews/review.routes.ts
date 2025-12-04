import { Router } from "express";
import { reviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { createReviewZodSchema, updateReviewZodSchema } from "./review.validation";
// import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// Create review
router.post(
    "/:travelPlanId",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(createReviewZodSchema),
    reviewController.createReview
);

export const ReviewRoutes = router;

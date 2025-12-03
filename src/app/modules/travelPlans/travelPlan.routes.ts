import express, { Request, Response, NextFunction } from "express";
import { travelPlanController } from "./travelPlan.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { travelPlanValidation } from "./travelPlan.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
    '/',
    auth(UserRole.USER),
    fileUploader.upload.array('photos', 5),
    async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        // check if travelPlan is string
        if (typeof req.body.travelPlan === 'string') {
            req.body.travelPlan = JSON.parse(req.body.travelPlan);
        }
        return travelPlanController.createTravelPlan(req, res, next);
    }
);

router.get("/", travelPlanController.getAllTravelPlans);

// GET BY ID
router.get("/:id", travelPlanController.getTravelPlanById);

// UPDATE (form-data or JSON)
router.patch(
    "/:id",
    auth(),
    fileUploader.upload.array("photos"),
    travelPlanController.updateTravelPlan
);

// DELETE
router.delete(
    "/:id",
    auth(),
    travelPlanController.deleteTravelPlan
);

export const TravelPlanRoutes = router;

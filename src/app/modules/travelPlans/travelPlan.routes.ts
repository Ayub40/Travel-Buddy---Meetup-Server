import express, { Request, Response, NextFunction } from "express";
import { travelPlanController } from "./travelPlan.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { travelPlanValidation } from "./travelPlan.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.get("/", travelPlanController.getAllTravelPlans);


router.get("/match", travelPlanController.matchTravelPlans);

// New Code// My travel plans (only for authenticated users)
router.get(
    "/my-travel-plan",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    travelPlanController.getMyTravelPlans
);

router.get(
    "/my-match-count",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    travelPlanController.getMyMatchCount
);

// router.get(
//     "/my-matches",
//     auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
//     travelPlanController.getMyMatchedTravelers
// );



// GET BY ID
router.get("/:id", travelPlanController.getTravelPlanById);

router.post(
    '/',
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    fileUploader.upload.array('photos', 5),
    async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        // check if travelPlan is string
        if (typeof req.body.travelPlan === 'string') {
            req.body.travelPlan = JSON.parse(req.body.travelPlan);
        }
        return travelPlanController.createTravelPlan(req, res, next);
    }
);

// // UPDATE (form-data or JSON)
router.patch(
    "/update-travelPlan/:id",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
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


// router.post(
//     '/',
//     auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
//     fileUploader.upload.array('photos', 5),
//     async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
//         // check if travelPlan is string
//         if (typeof req.body.travelPlan === 'string') {
//             req.body.travelPlan = JSON.parse(req.body.travelPlan);
//         }
//         return travelPlanController.createTravelPlan(req, res, next);
//     }
// );




// router.post(
//     "/",
//     auth(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.ADMIN),
//     fileUploader.upload.array('photos', 5),
//     (req: Request, res: Response, next: NextFunction) => {
//         req.body = travelPlanValidation.createTravelPlan.parse(JSON.parse(req.body.data))
//         return travelPlanController.createTravelPlan(req, res, next)
//     }
// );



// router.post(
//     "/create-admin",
//     auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
//     fileUploader.upload.single('file'),
//     (req: Request, res: Response, next: NextFunction) => {
//         req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data))
//         return userController.createAdmin(req, res, next)
//     }
// );
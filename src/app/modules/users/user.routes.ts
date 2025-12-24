import { UserRole } from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
// import { fileUploader } from '../../helper/fileUploader';
import { fileUploader } from '../../../helpers/fileUploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { updateAdminByEmail, userController } from './user.controller';
import { userValidation } from './user.validation';

const router = express.Router();

router.get(
    '/',
    // auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    userController.getAllFromDB
);

router.get(
    "/dashboard",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    userController.getDashboardData
);

router.get(
    '/me',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER),
    userController.getMyProfile
)

router.get("/:id", userController.getSingleUser);



router.post(
    "/create-admin",
    // auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data))
        return userController.createAdmin(req, res, next)
    }
);

router.post(
    "/create-user",
    fileUploader.upload.single("file"),
    (req, res, next) => {
        req.body = userValidation.createUsers.parse(JSON.parse(req.body.data));
        return userController.createUser(req, res, next);
    }
);

router.post(
    "/join-request/:travelPlanId",
    // auth(UserRole.USER),
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    userController.handleSendJoinRequest
);

router.patch(
    '/:id/status',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    validateRequest(userValidation.updateStatus),
    userController.changeProfileStatus
);

// router.patch("/:id", updateAdmin);
router.patch(
    "/update-admin-by-email",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    fileUploader.upload.single('file'),
    updateAdminByEmail
);


router.patch(
    "/update-my-profile",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        // req.body = JSON.parse(req.body.data)
        return userController.updateMyProfile(req, res, next)
    }
);

router.patch(
    "/update-user-profile/:id",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    fileUploader.upload.single('file'),
    validateRequest(userValidation.updateByAdmin),
    (req, res, next) => {
        return userController.updateUserByAdmin(req, res, next);
    }
);

router.patch(
    "/join-request/:requestId",
    auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(userValidation.joinRequestValidation),
    userController.handleJoinRequest
);

router.delete("/soft/:id", auth(UserRole.ADMIN), userController.softDeleteUser);

router.delete("/hard/:id", auth(UserRole.ADMIN), userController.hardDeleteUser);

export const userRoutes = router;

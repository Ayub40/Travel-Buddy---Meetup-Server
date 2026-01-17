import express, { NextFunction, Request, Response } from 'express';
import { AdminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { adminValidationSchemas } from './admin.validations';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';
// import { readOnly } from '../../middlewares/readOnly';

const router = express.Router();


router.get(
    '/',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
 // readOnly(),
    AdminController.getAllFromDB
);



router.get(
    '/statistics',
    AdminController.getStatistics
);

router.get(
    "/admin-stats",
    // auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    AdminController.getAdminDashboardData
);

router.get(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
 // readOnly(),
    AdminController.getByIdFromDB
);

router.patch(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
 // readOnly(),
    validateRequest(adminValidationSchemas.update),
    AdminController.updateIntoDB
);

router.delete(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
 // readOnly(),
    AdminController.deleteFromDB
);

router.delete(
    '/soft/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
 // readOnly(),
    AdminController.softDeleteFromDB
);

export const AdminRoutes = router;
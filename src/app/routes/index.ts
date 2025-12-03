import express from 'express';
import { userRoutes } from '../modules/users/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { TravelPlanRoutes } from '../modules/travelPlans/travelPlan.routes';

// import { apiLimiter } from '../middlewares/rateLimiter';


const router = express.Router();

// router.use(apiLimiter)

const moduleRoutes = [
    {
        path: '/user',
        route: userRoutes
    },
    {
        path: '/auth',
        route: AuthRoutes
    },
    {
        path: '/travel-plans',
        route: TravelPlanRoutes
    }

];

// console.log("User routes loaded");


moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;
import express from 'express';
// import { PaymentController } from './payment.controller';
// import { UserRole } from '@prisma/client';
// import auth from '../../middlewares/auth';

const router = express.Router();

// Webhook route is registered in app.ts before other middleware
// This file is kept for potential future payment-related routes

// router.get("/me", auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),, PaymentController.getMyPayments);

export const PaymentRoutes = router;





// import express from 'express';
// import { PaymentController } from './payment.controller';

// const router = express.Router();

// router.post('/webhook', PaymentController.handleStripeWebhookEvent);

// export const PaymentRoutes = router;

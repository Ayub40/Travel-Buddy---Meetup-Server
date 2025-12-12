import { Request, Response } from "express";
import config from "../../../config";
import { PaymentService } from "./payment.service";
import catchAsync from "../../shared/catchAsync";
import { stripe } from "../../../helpers/stripe";
import sendResponse from "../../shared/sendResponse";
import { prisma } from "../../shared/prisma";

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripeWebhookSecret as string;

    if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return res.status(500).send("Webhook secret not configured");
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const result = await PaymentService.handleStripeWebhookEvent(event);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Webhook processed successfully',
        data: result,
    });
});


// const getMyPayments = catchAsync(async (req: Request & { user?: any }, res: Response) => {
//     const userId = req.user?.id;
//     if (!userId) throw new Error("Not logged in");

//     const payments = await prisma.payment.findMany({
//         where: { userId },
//         orderBy: { createdAt: "desc" },
//     });

//     sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "User payments fetched",
//         data: payments,
//     });
// });

export const PaymentController = {
    handleStripeWebhookEvent,
    // getMyPayments
};

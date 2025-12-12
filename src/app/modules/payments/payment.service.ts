import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { prisma } from '../../shared/prisma';

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    const existingPayment = await prisma.payment.findFirst({
        where: {
            stripeEventId: event.id
        }
    });

    if (existingPayment) {
        console.log(`Event ${event.id} already processed. Skipping.`);
        return { message: "Event already processed" };
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;

            const paymentId = session.metadata?.paymentId;
            const userId = session.metadata?.userId;
            const paymentFor = session.metadata?.paymentFor;

            if (!paymentId || !userId || !paymentFor) {
                console.error("Missing metadata in webhook event");
                return { message: "Missing metadata" };
            }

            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: PaymentStatus.SUCCESS,
                        paymentGatewayData: session,
                        stripeEventId: event.id
                    }
                });

                if (paymentFor === "subscription") {
                    await tx.user.update({
                        where: { id: userId },
                        data: { isVerified: true }
                    });
                }

                if (paymentFor === "verified-badge") {
                    await tx.user.update({
                        where: { id: userId },
                        data: { isVerified: true }
                    });
                }
            });

            console.log(`Payment completed successfully for ${userId}`);
            break;
        }

        case "payment_intent.payment_failed": {
            console.log("Payment failed");
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return { message: "Webhook processed successfully" };
};

export const PaymentService = {
    handleStripeWebhookEvent
};

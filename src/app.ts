import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import config from './config';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import { PaymentController } from './app/modules/payments/payment.controller';
// import { uptime } from 'process';
// import { timeStamp } from 'console';

const app: Application = express();

app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    PaymentController.handleStripeWebhookEvent
);

app.use(cors({
    origin: ['http://localhost:3000', 'https://travel-buddy-meetup-4028.vercel.app'],
    credentials: true
}));

//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router)

app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "🧳 Travel Buddy & Meetup Server is running..",
        // environment: config.node_env,
        environment: config.env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString()
    })
});


app.use(globalErrorHandler);

app.use(notFound);

export default app;
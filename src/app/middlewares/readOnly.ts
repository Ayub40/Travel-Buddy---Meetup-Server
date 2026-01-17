// src/app/middlewares/readOnly.ts
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

export const readOnly = () => {
    return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        try {

            const isMutation = ["PATCH", "POST", "DELETE", "PUT"].includes(req.method);


            if (req.user && req.user.role === "ADMIN" && isMutation) {
                console.log("🚫 Admin attempt blocked!");
                throw new ApiError(
                    httpStatus.FORBIDDEN,
                    "Demo Mode: Admin can only view data. Only Super Admin can make changes!"
                );
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};
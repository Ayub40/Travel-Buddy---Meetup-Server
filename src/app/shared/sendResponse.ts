import { Response } from "express";

interface ISendResponse<T, M = any> {
    statusCode: number;
    success: boolean;
    message: string;
    meta?: M;
    data: T | null | undefined;
}

const sendResponse = <T, M = any>(res: Response, jsonData: ISendResponse<T, M>) => {
    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        message: jsonData.message,
        meta: jsonData.meta || null,
        data: jsonData.data || null,
    });
};

export default sendResponse;







// import { Response } from "express"

// const sendResponse = <T>(res: Response, jsonData: {
//     statusCode: number,
//     success: boolean,
//     message: string,
//     meta?: {
//         page: number,
//         limit: number,
//         total: number
//     },
//     data: T | null | undefined
// }) => {
//     res.status(jsonData.statusCode).json({
//         success: jsonData.success,
//         message: jsonData.message,
//         meta: jsonData.meta || null || undefined,
//         data: jsonData.data || null || undefined
//     })
// }

// export default sendResponse;
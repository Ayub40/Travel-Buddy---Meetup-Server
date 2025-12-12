import { prisma } from "../../shared/prisma";

// Create Review
const createReview = async (
    travelPlanId: string,
    userEmail: string,
    payload: { rating: number; comment?: string }
) => {
    if (payload.rating < 1 || payload.rating > 5) {
        throw new Error("Rating must be between 1–5");
    }

    // Check if travel plan exists
    const travelPlan = await prisma.travelPlan.findUniqueOrThrow({
        where: { id: travelPlanId },
    });

    // Check if trip has ended
    const now = new Date();
    if (travelPlan.endDate > now) {
        throw new Error("You can review only after the trip is completed");
    }

    // Find user by email
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: userEmail },
    });

    // Prevent duplicate review
    const existing = await prisma.review.findFirst({
        where: { travelPlanId, userId: user.id },
    });
    if (existing) throw new Error("You already reviewed this plan");

    return prisma.review.create({
        data: {
            travelPlanId,
            userId: user.id,
            rating: payload.rating,
            comment: payload.comment,
        },
    });
};

// Update Review
const updateReview = async (
    reviewId: string,
    userEmail: string,
    payload: { rating?: number; comment?: string }
) => {
    const review = await prisma.review.findUniqueOrThrow({
        where: { id: reviewId },
    });

    const user = await prisma.user.findUniqueOrThrow({
        where: { email: userEmail },
    });

    if (review.userId !== user.id) {
        throw new Error("You are not allowed to edit this review");
    }

    return prisma.review.update({
        where: { id: reviewId },
        data: payload,
    });
};

// Delete Review
const deleteReview = async (reviewId: string, userEmail: string) => {
    const review = await prisma.review.findUniqueOrThrow({
        where: { id: reviewId },
    });

    const user = await prisma.user.findUniqueOrThrow({
        where: { email: userEmail },
    });

    if (review.userId !== user.id) {
        throw new Error("You are not allowed to delete this review");
    }

    return prisma.review.delete({
        where: { id: reviewId },
    });
};

// Get Reviews by Plan with average rating
// const getReviewsByPlan = async (travelPlanId: string) => {
//     const reviews = await prisma.review.findMany({
//         where: { travelPlanId },
//         include: {
//             user: {
//                 select: {
//                     email: true,
//                     name: true,
//                     profileImage: true,
//                 },
//             },
//         },
//         orderBy: { createdAt: "desc" },
//     });

//     const avgRating =
//         reviews.length > 0
//             ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
//             : null;

//     return { reviews, averageRating: avgRating };
// };

const getReviewsByPlan = async (travelPlanId: string, userEmail?: string) => {
    const reviews = await prisma.review.findMany({
        where: { travelPlanId },
        include: {
            user: {
                select: {
                    email: true,
                    name: true,
                    profileImage: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const avgRating =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

    // map isOwn
    const mappedReviews = reviews.map((r) => ({
        ...r,
        isOwn: userEmail ? r.user.email === userEmail : false,
    }));

    return { reviews: mappedReviews, averageRating: avgRating };
};

// Get Reviews by User with average rating
const getReviewsByUser = async (userEmail: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: userEmail },
    });

    const reviews = await prisma.review.findMany({
        where: { userId: user.id },
        include: {
            travelPlan: {
                select: {
                    id: true,
                    title: true,
                    destination: true,
                    startDate: true,
                    endDate: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const avgRating =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

    return { reviews, averageRating: avgRating };
};



export const reviewService = {
    createReview,
    updateReview,
    deleteReview,
    getReviewsByPlan,
    getReviewsByUser,
};

import { z } from "zod";
import { BudgetRange, Gender, UserStatus } from "@prisma/client";

const createAdmin = z.object({
    password: z.string({
        error: "Password is required",
    }),
    admin: z.object({
        name: z.string({
            error: "Name is required!",
        }),
        email: z.string({
            error: "Email is required!",
        }),
        contactNumber: z.string({
            error: "Contact Number is required!",
        }),
    }),
});


const createUsers = z.object({
    // createTraveler = z.object({
    password: z.string({
        error: "Password is required",
    }),
    user: z.object({
        name: z.string({
            error: "Name is required!",
        }),

        email: z.string({
            error: "Invalid email format!",
        }),

        bio: z.string({
            error: "Bio is required!",
        }).optional(),

        age: z.number({
            error: "Age must be a number",
        }).optional(),

        gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),

        country: z.string({
            error: "Country is required!",
        }).optional(),

        city: z.string({
            error: "City is required!",
        }).optional(),

        location: z.string({
            error: "Location is required!",
        }).optional(),

        interests: z.array(z.string({
            error: "Interests must be needed",
        })).optional(),

        visitedCountries: z.array(z.string({
            error: "Visited Countries must be needed",
        })).optional(),

        budgetRange: z.enum([BudgetRange.LOW, BudgetRange.MEDIUM, BudgetRange.HIGH]).optional(),
    })
})

const updateStatus = z.object({
    body: z.object({
        status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED]),
    }),
});

const joinRequestValidation = z.object({
    body: z.object({
        status: z.enum(["ACCEPTED", "REJECTED"]),
    }),
});

const updateByAdmin = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        contactNumber: z.string().optional(),
        role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "DELETED"]).optional()
    })
});


export const userValidation = {
    createAdmin,
    createUsers,
    // createTraveler,
    updateStatus,
    joinRequestValidation,
    updateByAdmin
};

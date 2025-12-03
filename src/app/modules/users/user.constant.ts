import { Prisma } from "@prisma/client";

export const userFilterableFields: string[] = [
    'name',
    'email',
    'role',
    'status',
];

export const userSearchAbleFields: string[] = [
    'name',
    'email',
    'country',
    'city',
];

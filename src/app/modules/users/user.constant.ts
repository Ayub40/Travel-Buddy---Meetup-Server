import { Prisma } from "@prisma/client";

export const userFilterableFields: string[] = [
    'name',
    'email',
    'country',
    'city',
    'role',
    'status',
    'gender',
    'budgetRange',
    'interests',
    'visitedCountries',
    'budgetRange',
    'gender',
    'age',
    'currentLocation',
    'isVerified'
];

// Only fields that are safe for Prisma 'contains' search
export const userSearchAbleFields: string[] = [
    'name',
    'email',
    'country',
    'city',
    'currentLocation',
    'bio'
];

// export const userSearchAbleFields: string[] = [
//     'name',
//     'email',
//     'country',
//     'city',
//     'role',
//     'status',
//     'gender',
//     'budgetRange',
//     'interests',
//     'visitedCountries',
//     'budgetRange',
//     'gender',
//     'age',
//     'currentLocation',
//     'isVerified'
// ];

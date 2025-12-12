# 🚀 Travel Buddy – Backend API (Express + Prisma + PostgreSQL)

A role-based travel collaboration backend system where users can create travel plans, send join requests, write reviews, and manage their travel activities.
Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## 📌 Features Overview

### 🔐 Authentication & Authorization

- User Registration (Client-side)
- Login with JWT
- Access & Refresh Token system
- Role-based Access (ADMIN & USER)
- Protected Routes

### 👤 User Module

- Get my profile (/auth/me)
- Soft delete user
- Admin can manage all users

### 🧳 Travel Plan Module

- Create travel plan
- Update plan details
- Get all travel plans with advanced filters:
  - Search by destination
  - Filter by date range
  - Filter by travelType (SOLO, FRIENDS, FAMILY, etc.)
  - Pagination & Sorting
- Individual travel plan details

### 🤝 Travel Request Module

- Send join request to a travel plan
- Accept / Reject request (Only plan owner)
- Sender can view sent requests
- Receiver can view received requests
- Toggle request status (ACCEPTED / REJECTED)

### ⭐ Review Module

- Add review to travel plans
- Get reviews for a plan

## 🛠 Technology Stack

| Technology | Usage |
|-----------|--------|
| Node.js | Runtime |
| Express.js | Server Framework |
| TypeScript | Type Safety |
| Prisma ORM | Database ORM |
| PostgreSQL | Main Database |
| JWT | Authentication |
| Zod | Request Validation |

## 📂 Project Structure

```
src/
 ├── app/
 │   ├── modules/
 │   │    ├── Auth/
 │   │    ├── User/
 │   │    ├── TravelPlan/
 │   │    ├── TravelRequest/
 │   │    ├── Review/
 │   │
 │   ├── middlewares/
 │   ├── utils/
 │   ├── config/
 │   ├── routes/
 │
 ├── prisma/
 │    ├── schema.prisma
 ├── server.ts
```

## ⚙️ Environment Variables

Create a .env file:

```
PORT=5000
NODE_ENV=production

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public&sslmode=require"

JWT_SECRET="your-secret"
JWT_EXPIRES_IN="1d"

JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
```

## ▶️ Running the Project Locally

1️⃣ Install dependencies
```
npm install
```

2️⃣ Generate Prisma Client
```
npx prisma generate
```

3️⃣ Run database migrations
```
npx prisma migrate deploy
```

4️⃣ Start development server
```
npm run dev
```

## 📡 API Endpoints Summary

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /auth/login | Public |
| POST | /auth/refresh-token | Public |
| GET | /auth/me | Logged-in User |

### User
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /users | Admin |
| DELETE | /users/:id | Admin |

### Travel Plans
| Method | Endpoint |
|--------|----------|
| POST | /travel-plans |
| GET | /travel-plans |
| GET | /travel-plans/:id |
| PATCH | /travel-plans/:id |

### Travel Request
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /travel-request/:planId | Send join request |
| GET | /travel-request/sent | Requests I sent |
| GET | /travel-request/received | Requests I received |
| PATCH | /travel-request/:id | Accept/Reject |

### Reviews
| Method | Endpoint |
|--------|----------|
| POST | /reviews/:planId |
| GET | /reviews/:planId |

## 🐛 Common Issues

### ❗ Folder name mismatching on GitHub

Fix:
```
git mv User user_tmp
git mv user_tmp User
git commit -m "Fix folder case"
git push
```

## 🚀 Deployment (Render)

Fix Prisma P1001 Error:

Use a remote DB connection string:


❌ Don’t use:
```
localhost:5432
```
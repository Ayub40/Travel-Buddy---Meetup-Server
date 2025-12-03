-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "contactNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;

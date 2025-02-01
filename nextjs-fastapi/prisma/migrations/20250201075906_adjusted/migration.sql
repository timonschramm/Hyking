-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isAI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;

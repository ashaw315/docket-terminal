-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "position" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "position" SET DEFAULT 'a0',
ALTER COLUMN "position" SET DATA TYPE TEXT;

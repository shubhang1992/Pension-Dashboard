-- AlterTable
ALTER TABLE "StateWiseSnapshot" ADD COLUMN     "ageBreakdown" JSONB,
ADD COLUMN     "genderFemale" INTEGER,
ADD COLUMN     "genderMale" INTEGER,
ADD COLUMN     "genderTransgender" INTEGER;

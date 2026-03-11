/*
  Warnings:

  - You are about to drop the column `diagnosisResultId` on the `DiagnosisAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `nutrient` on the `DiagnosisQuestion` table. All the data in the column will be lost.
  - You are about to drop the `DiagnosisResult` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nutrientId` to the `DiagnosisQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiagnosisAnswer" DROP CONSTRAINT "DiagnosisAnswer_diagnosisResultId_fkey";

-- AlterTable
ALTER TABLE "Diagnosis" ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DiagnosisAnswer" DROP COLUMN "diagnosisResultId";

-- AlterTable
ALTER TABLE "DiagnosisQuestion" DROP COLUMN "nutrient",
ADD COLUMN     "nutrientId" TEXT NOT NULL;

-- DropTable
DROP TABLE "DiagnosisResult";

-- CreateTable
CREATE TABLE "DiagnosisNutrientScore" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "DiagnosisNutrientScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiagnosisNutrientScore_diagnosisId_idx" ON "DiagnosisNutrientScore"("diagnosisId");

-- CreateIndex
CREATE INDEX "DiagnosisNutrientScore_nutrientId_idx" ON "DiagnosisNutrientScore"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisNutrientScore_diagnosisId_nutrientId_key" ON "DiagnosisNutrientScore"("diagnosisId", "nutrientId");

-- CreateIndex
CREATE INDEX "Diagnosis_userId_idx" ON "Diagnosis"("userId");

-- AddForeignKey
ALTER TABLE "DiagnosisQuestion" ADD CONSTRAINT "DiagnosisQuestion_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNutrientScore" ADD CONSTRAINT "DiagnosisNutrientScore_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNutrientScore" ADD CONSTRAINT "DiagnosisNutrientScore_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

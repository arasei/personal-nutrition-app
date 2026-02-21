/*
  Warnings:

  - The primary key for the `DiagnosisAnswer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `answerValue` on the `DiagnosisAnswer` table. All the data in the column will be lost.
  - Added the required column `diagnosisResultId` to the `DiagnosisAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `DiagnosisAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nutrient` to the `DiagnosisQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CauseType" AS ENUM ('LOW_INTAKE', 'IRREGULAR_MEAL', 'HIGH_STRESS', 'UNBALANCED_DIET');

-- AlterTable
ALTER TABLE "DiagnosisAnswer" DROP CONSTRAINT "DiagnosisAnswer_pkey",
DROP COLUMN "answerValue",
ADD COLUMN     "diagnosisResultId" TEXT NOT NULL,
ADD COLUMN     "value" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DiagnosisAnswer_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DiagnosisAnswer_id_seq";

-- AlterTable
ALTER TABLE "DiagnosisQuestion" ADD COLUMN     "nutrient" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DiagnosisResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "dailyStandard" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutrientMessage" (
    "id" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "causeType" "CauseType" NOT NULL,
    "shortMessage" TEXT NOT NULL,
    "empathyText" TEXT NOT NULL,
    "reasonText" TEXT NOT NULL,
    "actionText" TEXT NOT NULL,

    CONSTRAINT "NutrientMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeNutrient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "impactScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RecipeNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientNutrient" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "approxAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IngredientNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "amount" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_name_key" ON "Nutrient"("name");

-- CreateIndex
CREATE INDEX "NutrientMessage_nutrientId_idx" ON "NutrientMessage"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "NutrientMessage_nutrientId_causeType_key" ON "NutrientMessage"("nutrientId", "causeType");

-- CreateIndex
CREATE INDEX "RecipeNutrient_nutrientId_idx" ON "RecipeNutrient"("nutrientId");

-- CreateIndex
CREATE INDEX "RecipeNutrient_recipeId_idx" ON "RecipeNutrient"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeNutrient_recipeId_nutrientId_key" ON "RecipeNutrient"("recipeId", "nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "IngredientNutrient_nutrientId_idx" ON "IngredientNutrient"("nutrientId");

-- CreateIndex
CREATE INDEX "IngredientNutrient_ingredientId_idx" ON "IngredientNutrient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientNutrient_ingredientId_nutrientId_key" ON "IngredientNutrient"("ingredientId", "nutrientId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_key" ON "RecipeIngredient"("recipeId", "ingredientId");

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_diagnosisResultId_fkey" FOREIGN KEY ("diagnosisResultId") REFERENCES "DiagnosisResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientMessage" ADD CONSTRAINT "NutrientMessage_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeNutrient" ADD CONSTRAINT "RecipeNutrient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeNutrient" ADD CONSTRAINT "RecipeNutrient_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientNutrient" ADD CONSTRAINT "IngredientNutrient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientNutrient" ADD CONSTRAINT "IngredientNutrient_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

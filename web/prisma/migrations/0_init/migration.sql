-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CauseType" AS ENUM ('LOW_INTAKE', 'IRREGULAR_MEAL', 'HIGH_STRESS', 'UNBALANCED_DIET');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('FOOD', 'ACTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "nickname" TEXT,
    "gender" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStep" INTEGER,
    "profileId" TEXT,
    "startedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisAnswer" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisAnswer_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "DiagnosisNutrientScore" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "DiagnosisNutrientScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "RecipeNutrient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,

    CONSTRAINT "RecipeNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientNutrient" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "approxAmount" DOUBLE PRECISION,

    CONSTRAINT "IngredientNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutrientRecommendation" (
    "id" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutrientRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_authUserId_key" ON "Profile"("authUserId");

-- CreateIndex
CREATE INDEX "Diagnosis_profileId_idx" ON "Diagnosis"("profileId");

-- CreateIndex
CREATE INDEX "Diagnosis_userId_idx" ON "Diagnosis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisQuestion_order_key" ON "DiagnosisQuestion"("order");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_diagnosisId_idx" ON "DiagnosisAnswer"("diagnosisId");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_questionId_idx" ON "DiagnosisAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisAnswer_diagnosisId_questionId_key" ON "DiagnosisAnswer"("diagnosisId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_name_key" ON "Nutrient"("name");

-- CreateIndex
CREATE INDEX "NutrientMessage_nutrientId_idx" ON "NutrientMessage"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "NutrientMessage_nutrientId_causeType_key" ON "NutrientMessage"("nutrientId", "causeType");

-- CreateIndex
CREATE INDEX "DiagnosisNutrientScore_diagnosisId_idx" ON "DiagnosisNutrientScore"("diagnosisId");

-- CreateIndex
CREATE INDEX "DiagnosisNutrientScore_nutrientId_idx" ON "DiagnosisNutrientScore"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisNutrientScore_diagnosisId_nutrientId_key" ON "DiagnosisNutrientScore"("diagnosisId", "nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "RecipeNutrient_nutrientId_idx" ON "RecipeNutrient"("nutrientId");

-- CreateIndex
CREATE INDEX "RecipeNutrient_recipeId_idx" ON "RecipeNutrient"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeNutrient_recipeId_nutrientId_key" ON "RecipeNutrient"("recipeId", "nutrientId");

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

-- CreateIndex
CREATE INDEX "NutrientRecommendation_nutrientId_type_sortOrder_idx" ON "NutrientRecommendation"("nutrientId", "type", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NutrientRecommendation_nutrientId_type_title_key" ON "NutrientRecommendation"("nutrientId", "type", "title");

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisQuestion" ADD CONSTRAINT "DiagnosisQuestion_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DiagnosisQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientMessage" ADD CONSTRAINT "NutrientMessage_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNutrientScore" ADD CONSTRAINT "DiagnosisNutrientScore_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNutrientScore" ADD CONSTRAINT "DiagnosisNutrientScore_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "NutrientRecommendation" ADD CONSTRAINT "NutrientRecommendation_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

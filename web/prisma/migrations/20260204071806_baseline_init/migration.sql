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
    "status" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisAnswer" (
    "id" TEXT NOT NULL,
    "answerValue" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosisId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_authUserId_key" ON "Profile"("authUserId");

-- CreateIndex
CREATE INDEX "Diagnosis_profileId_idx" ON "Diagnosis"("profileId");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_diagnosisId_idx" ON "DiagnosisAnswer"("diagnosisId");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_questionId_idx" ON "DiagnosisAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisAnswer_diagnosisId_questionId_key" ON "DiagnosisAnswer"("diagnosisId", "questionId");

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DiagnosisQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

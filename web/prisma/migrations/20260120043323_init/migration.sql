-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "nickname" TEXT,
    "gender" TEXT,
    "birth_date" TIMESTAMP(3),
    "height" INTEGER,
    "weight" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_step" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
    "diagnosis_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_value" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_authUserId_key" ON "Profile"("authUserId");

-- CreateIndex
CREATE INDEX "Diagnosis_profile_id_idx" ON "Diagnosis"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisQuestion_order_key" ON "DiagnosisQuestion"("order");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_diagnosis_id_idx" ON "DiagnosisAnswer"("diagnosis_id");

-- CreateIndex
CREATE INDEX "DiagnosisAnswer_question_id_idx" ON "DiagnosisAnswer"("question_id");

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAnswer" ADD CONSTRAINT "DiagnosisAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "DiagnosisQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

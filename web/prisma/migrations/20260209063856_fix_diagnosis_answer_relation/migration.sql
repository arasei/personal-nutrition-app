/*
  Warnings:

  - The primary key for the `DiagnosisAnswer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiagnosisAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `Diagnosis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DiagnosisAnswer" DROP CONSTRAINT "DiagnosisAnswer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "DiagnosisAnswer_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

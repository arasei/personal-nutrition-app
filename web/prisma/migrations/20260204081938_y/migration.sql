/*
  Warnings:

  - A unique constraint covering the columns `[order]` on the table `DiagnosisQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisQuestion_order_key" ON "DiagnosisQuestion"("order");

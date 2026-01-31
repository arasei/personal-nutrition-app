{/* profile_idに付いてるNOT NULL制約を外してNULLを許可する(=optionalにする) */}
ALTER TABLE "Diagnosis"
ALTER COLUMN "profile_id" DROP NOT NULL;
-- CreateTable
CREATE TABLE "StateWiseSnapshot" (
    "id" SERIAL NOT NULL,
    "stateName" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "subscribers" INTEGER,
    "aumCrore" DOUBLE PRECISION,
    "contributionCrore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateWiseSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StateWiseSnapshot_stateName_asOfDate_key" ON "StateWiseSnapshot"("stateName", "asOfDate");

-- AlterTable
ALTER TABLE "StateWiseSnapshot" ADD COLUMN     "contributionHistory" JSONB;

-- CreateTable
CREATE TABLE "SchemeHolding" (
    "id" SERIAL NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "fundManagerName" TEXT NOT NULL,
    "schemeName" TEXT NOT NULL,
    "isin" TEXT,
    "securityName" TEXT NOT NULL,
    "sector" TEXT,
    "assetClass" TEXT,
    "weightPct" DOUBLE PRECISION,
    "marketValueCrore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemeHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchemeHolding_fundManagerName_asOfDate_idx" ON "SchemeHolding"("fundManagerName", "asOfDate");

-- CreateIndex
CREATE INDEX "SchemeHolding_schemeName_asOfDate_idx" ON "SchemeHolding"("schemeName", "asOfDate");

-- CreateIndex
CREATE INDEX "SchemeHolding_securityName_idx" ON "SchemeHolding"("securityName");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeHolding_asOfDate_fundManagerName_schemeName_securityN_key" ON "SchemeHolding"("asOfDate", "fundManagerName", "schemeName", "securityName");

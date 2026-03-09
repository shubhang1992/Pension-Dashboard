-- CreateTable
CREATE TABLE "SchemeAumHistory" (
    "id" SERIAL NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "fundManagerName" TEXT NOT NULL,
    "schemeName" TEXT NOT NULL,
    "aumCrore" DOUBLE PRECISION,
    "subscribers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemeAumHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemeAumHistory_asOfDate_fundManagerName_schemeName_key" ON "SchemeAumHistory"("asOfDate", "fundManagerName", "schemeName");

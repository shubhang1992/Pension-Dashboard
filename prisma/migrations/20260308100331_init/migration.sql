-- CreateTable
CREATE TABLE "PensionFundManager" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "aum" DOUBLE PRECISION NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PensionFundManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PensionScheme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "riskLevel" TEXT,
    "aum" DOUBLE PRECISION,
    "managerId" INTEGER NOT NULL,
    "launchedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PensionScheme_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PensionScheme" ADD CONSTRAINT "PensionScheme_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "PensionFundManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

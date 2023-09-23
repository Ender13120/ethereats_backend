-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "customer" TEXT NOT NULL,
    "deliverer" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "encryptedParams" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL,
    "isCompleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

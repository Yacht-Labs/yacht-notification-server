-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "response" JSONB,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

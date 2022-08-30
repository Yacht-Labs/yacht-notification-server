import {
  sendHealthNotifications,
  getHealthScoreByAddress,
} from "./eulerNotifications";
import { prismaMock } from "../../singleton";
import { EulerHealthNotification } from "@prisma/client";

test("should create new user ", async () => {
  const healthNotification1: EulerHealthNotification = {
    id: "1",
    thresholdValue: 0.5,
    isActive: true,
    accountId: "100",
    deviceId: "100",
    seen: false,
    account: {
      address: "111111",
      deviceId: "100",
      name: "myTestAccount",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as EulerHealthNotification;

  const mock = prismaMock.eulerHealthNotification.findMany.mockResolvedValue(
    healthNotification1 as unknown as EulerHealthNotification[]
  );

  // TEST CASES
  // 1.
  // Find a notification
  // Get a healthScore that would trigger the threshold
  // Check that the notification was sent
  // Check that the notification was updated
  // 2.
  // Do the above for two notifications, both of which need notifications
  // 3.
  // How about one that needs to be notified and one that doesn't
  // 4. Don't send for a notification that has been "seen"
  // 5. Reset
});

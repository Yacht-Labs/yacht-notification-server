import { sendHealthNotifications } from "../sendHealthNotifications";
import { prismaMock } from "../../../../../test/singleton";
import { EulerHealthNotification } from "@prisma/client";
import { EulerService } from "../../../../services/EulerService";

const mockSendNotification = jest.fn();
jest.mock("../../../../notifications/apn", () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => {
      return {
        sendNotification: mockSendNotification,
      };
    }),
  };
});

const ACCOUNT_ID = "100";
const DEVICE_ID = "100";
const ADDRESS = "100";

function mockFindHealthNotifications(
  healthNotification: EulerHealthNotification,
  ...args: EulerHealthNotification[]
) {
  return prismaMock.eulerHealthNotification.findMany.mockResolvedValueOnce([
    healthNotification,
    ...args,
  ]);
}
function mockUpdateNotification(
  healthNotification: EulerHealthNotification,
  seen: boolean
) {
  return prismaMock.eulerHealthNotification.update.mockResolvedValueOnce({
    ...healthNotification,
    seen,
  });
}

describe("Euler Notifications", () => {
  describe("Health Notifications", () => {
    const baseHealthNotification = {
      id: "1",
      thresholdValue: 2.5,
      isActive: true,
      accountId: ACCOUNT_ID,
      deviceId: DEVICE_ID,
      seen: false,
      subAccountId: "main",
      account: {
        address: ADDRESS,
        deviceId: DEVICE_ID,
        name: "healthNotification1",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EulerHealthNotification;

    beforeEach(() => {
      EulerService.getHealthScoreByAddress = jest.fn().mockResolvedValue(2);
    });

    test("Should send a notification when healthscore < threshold", async () => {
      mockFindHealthNotifications(baseHealthNotification);
      const updateMock = mockUpdateNotification(baseHealthNotification, true);
      await sendHealthNotifications();
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledTimes(1);
    });

    test("Should not send a notification when healthscore > threshold", async () => {
      mockFindHealthNotifications({
        ...baseHealthNotification,
        thresholdValue: 1,
      });
      const updateMock = mockUpdateNotification(baseHealthNotification, false);
      await sendHealthNotifications();
      expect(mockSendNotification).toHaveBeenCalledTimes(0);
      expect(updateMock).toHaveBeenCalledTimes(0);
    });

    test("Should not send a notification when healthscore < threshold but has been seen", async () => {
      mockFindHealthNotifications({
        ...baseHealthNotification,
        seen: true,
      });
      const updateMock = mockUpdateNotification(baseHealthNotification, true);
      await sendHealthNotifications();
      expect(mockSendNotification).toHaveBeenCalledTimes(0);
      expect(updateMock).toHaveBeenCalledTimes(0);
    });

    test("Should not update a notification's seen key if it's not above 10%", async () => {
      mockFindHealthNotifications({
        ...baseHealthNotification,
        thresholdValue: 2.1,
        seen: true,
      });
      const updateMock = mockUpdateNotification(baseHealthNotification, true);
      await sendHealthNotifications();
      expect(mockSendNotification).toHaveBeenCalledTimes(0);
      expect(updateMock).toHaveBeenCalledTimes(0);
    });

    test("Should update a notification's seen key if it's above 10%", async () => {
      EulerService.getHealthScoreByAddress = jest.fn().mockResolvedValue(2.2);
      mockFindHealthNotifications({
        ...baseHealthNotification,
        thresholdValue: 2,
        seen: true,
      });
      const updateMock = mockUpdateNotification(baseHealthNotification, true);
      await sendHealthNotifications();
      expect(mockSendNotification).toHaveBeenCalledTimes(0);
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  });
});

import { prismaMock } from "../../../../../test/singleton";
import { Prisma } from "@prisma/client";
import { EulerNotificationService } from "../../../../notifications/euler/EulerNotificationService";
import {
  EulerHealthNotificationWithAccount,
  NotificationType,
} from "../../../../types";
import { AppleNotificationSender } from "../../../../notifications/AppleNotificationSender";
import { EulerService } from "../../../../services/EulerService";

const mockSendNotification = jest.fn().mockResolvedValue(true);
jest.mock("../../../../notifications/AppleNotificationSender", () => {
  return {
    AppleNotificationSender: jest.fn().mockImplementation(() => {
      return {
        sendNotification: (...args: any[]) => mockSendNotification(...args),
      };
    }),
  };
});

// mock EulerService
const mockGetHealthScore = jest.fn();
const mockGetSubAccountAddressFromAccount = jest.fn();

// jest.mock("../../../../services/EulerService", () => {
//   return {
//     EulerService: jest.fn().mockImplementation(() => {
//       return {
//         getHealthScore: (...args: any[]) => mockGetHealthScore(...args),
//         getSubAccountAddressFromAccount: () =>
//           mockGetSubAccountAddressFromAccount(),
//       };
//     }),
//   };
// });

// jest.mock("../../../../services/EulerService", () => {
//   return {
//     EulerService: {
//       getHealthScore: (...args: any[]) => mockGetHealthScore(...args),
//       getSubAccountAddressFromAccount: () =>
//         mockGetSubAccountAddressFromAccount(),
//     },
//   };
// });

describe("Euler Health Notifications", () => {
  const eulerNotificationService = new EulerNotificationService(
    new AppleNotificationSender()
  );
  const mockHealthNotification = {
    id: "1",
    thresholdValue: 2.5756,
    isActive: true,
    account: {
      name: "test",
    },
    accountId: "100",
    deviceId: "100",
    seen: false,
    subAccountId: "100",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Prisma.EulerHealthNotificationGetPayload<
    typeof EulerHealthNotificationWithAccount
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.eulerHealthNotification.update.mockResolvedValue(
      mockHealthNotification
    );
    prismaMock.eulerHealthNotification.findMany.mockResolvedValueOnce([
      mockHealthNotification,
    ]);
  });

  it("should correctly generate a health notification message", async () => {
    let mockHealthScore = 2.0;
    const message = eulerNotificationService.generateHealthNotification(
      mockHealthScore,
      mockHealthNotification
    );
    expect(message).toBe(
      `Euler health score for ${mockHealthNotification.account.name}, subAccountId ${mockHealthNotification.subAccountId} has dropped below 2.5!`
    );

    mockHealthScore = 3.0;
    const message2 = eulerNotificationService.generateHealthNotification(
      mockHealthScore,
      mockHealthNotification
    );
    expect(message2).toBe(undefined);
  });

  it("Should send a health notification if healthscore < threshold", async () => {
    let mockHealthScore = 2.0;
    mockGetHealthScore.mockResolvedValue(mockHealthScore);
    mockGetSubAccountAddressFromAccount.mockReturnValue(
      "0x38c3A84293F9079DEC28573cD3f1E8a995b0B500"
    );
    EulerService.getHealthScoreByAddress = mockGetHealthScore;
    EulerService.getSubAccountAddressFromAccount =
      mockGetSubAccountAddressFromAccount;

    await eulerNotificationService.sendHealthNotifications();

    expect(mockSendNotification).toHaveBeenCalledTimes(1);
    expect(mockSendNotification).toHaveBeenCalledWith(
      `Euler health score for ${mockHealthNotification.account.name}, subAccountId ${mockHealthNotification.subAccountId} has dropped below 2.5!`,
      mockHealthNotification.deviceId,
      mockHealthNotification.id,
      NotificationType.EulerHealthScore
    );
    expect(prismaMock.eulerHealthNotification.update).toHaveBeenCalledTimes(1);
  });
});

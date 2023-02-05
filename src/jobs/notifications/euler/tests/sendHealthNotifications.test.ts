import {
  BusinessLogicError,
  DatabaseError,
  NotificationError,
  ProviderError,
} from "./../../../../types/errors";
import { prismaMock } from "../../../../../test/singleton";
import { prisma, Prisma } from "@prisma/client";
import { EulerNotificationService } from "../../../../notifications/euler/EulerNotificationService";
import {
  EulerHealthNotificationWithAccount,
  NotificationType,
} from "../../../../types";
import { AppleNotificationSender } from "../../../../notifications/AppleNotificationSender";
import { EulerService } from "../../../../services/EulerService";
import logger from "../../../../utils/Logging/logger";

// mock Apple Notification Sender
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
    prismaMock.eulerHealthNotification.findMany.mockResolvedValue([
      mockHealthNotification,
    ]);
  });

  it("Should correctly generate a health notification message", async () => {
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

  it("Should not send a health notification if healthscore >= threshold", async () => {
    let mockHealthScore = 3.0;
    mockGetHealthScore.mockResolvedValue(mockHealthScore);
    mockGetSubAccountAddressFromAccount.mockReturnValue(
      "0x38c3A84293F9079DEC28573cD3f1E8a995b0B500"
    );
    EulerService.getHealthScoreByAddress = mockGetHealthScore;
    EulerService.getSubAccountAddressFromAccount =
      mockGetSubAccountAddressFromAccount;

    await eulerNotificationService.sendHealthNotifications();

    expect(mockSendNotification).toHaveBeenCalledTimes(0);
    expect(prismaMock.eulerHealthNotification.update).toHaveBeenCalledTimes(0);

    // check equality on threshold and notification healthscore
    mockHealthScore = mockHealthNotification.thresholdValue;
    mockGetHealthScore.mockResolvedValue(mockHealthScore);
    mockGetSubAccountAddressFromAccount.mockReturnValue(
      "0x38c3A84293F9079DEC28573cD3f1E8a995b0B500"
    );
    EulerService.getHealthScoreByAddress = mockGetHealthScore;
    EulerService.getSubAccountAddressFromAccount =
      mockGetSubAccountAddressFromAccount;

    await eulerNotificationService.sendHealthNotifications();

    expect(mockSendNotification).toHaveBeenCalledTimes(0);
    expect(prismaMock.eulerHealthNotification.update).toHaveBeenCalledTimes(0);
  });

  it("Should log errors from database", async () => {
    prismaMock.eulerHealthNotification.findMany.mockRejectedValue(
      new Error("test database error")
    );
    EulerService.getHealthScoreByAddress = mockGetHealthScore;
    EulerService.getSubAccountAddressFromAccount =
      mockGetSubAccountAddressFromAccount;
    const mockLoggerError = jest.spyOn(logger, "error");
    await eulerNotificationService.sendHealthNotifications();

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      new DatabaseError(new Error("test database error"))
    );
  });

  it("Should log errors from EulerService", async () => {
    jest
      .spyOn(EulerService, "getHealthScoreByAddress")
      .mockRejectedValueOnce(new ProviderError("test provider error"));
    const mockLoggerError = jest.spyOn(logger, "error");
    await eulerNotificationService.sendHealthNotifications();

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      new ProviderError("test provider error")
    );

    jest
      .spyOn(EulerService, "getSubAccountAddressFromAccount")
      .mockImplementationOnce(() => {
        throw new BusinessLogicError("test error");
      });
    await eulerNotificationService.sendHealthNotifications();

    expect(mockLoggerError).toHaveBeenCalledTimes(2);
    expect(mockLoggerError).toHaveBeenLastCalledWith(
      new BusinessLogicError("test error")
    );

    mockSendNotification.mockImplementationOnce(() => {
      throw new NotificationError("test notification error");
    });
    eulerNotificationService.generateHealthNotification = jest
      .fn()
      .mockReturnValue("test message");
    await eulerNotificationService.sendHealthNotifications();

    expect(mockLoggerError).toHaveBeenCalledTimes(3);
    expect(mockLoggerError).toHaveBeenLastCalledWith(
      new NotificationError("test notification error")
    );
  });
});

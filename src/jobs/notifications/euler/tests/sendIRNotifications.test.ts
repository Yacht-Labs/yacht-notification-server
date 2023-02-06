import { AppleNotificationSender } from "./../../../../notifications/AppleNotificationSender";
import {
  EulerNotificationService,
  IRNotificationType,
} from "../../../../notifications/euler/EulerNotificationService";
import { prismaMock } from "../../../../../test/singleton";
import { NotificationType } from "../../../../types";
import logger from "../../../../utils/Logging/logger";
import { DatabaseError, NotificationError } from "../../../../types/errors";

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

describe("Euler Interest Rate Notifications", () => {
  const eulerNotificationService = new EulerNotificationService(
    new AppleNotificationSender()
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should properly generate a notification upperThreshold message", () => {
    const notification = {
      notificationAPY: 1,
      realAPY: 1.1,
      lowerThreshold: 0,
      upperThreshold: 10,
      symbol: "symbol",
      type: IRNotificationType.BORROW,
    };

    // equal to the threshold
    const borrowUpperMessage =
      eulerNotificationService.buildIRNotification(notification);
    expect(borrowUpperMessage).toEqual(
      `The Euler ${IRNotificationType.BORROW}APY on ${notification.symbol} is now ${notification.realAPY}%`
    );

    // no borrow message threshold
    const borrowUpperNoMessage = eulerNotificationService.buildIRNotification({
      ...notification,
      upperThreshold: 0,
    });
    expect(borrowUpperNoMessage).toEqual("");

    // lower than the threshold
    const borrowUpperNoMessage2 = eulerNotificationService.buildIRNotification({
      ...notification,
      upperThreshold: 9,
    });
    expect(borrowUpperNoMessage2).toEqual("");

    // above the threshold
    const borrowUpperNoMessage3 = eulerNotificationService.buildIRNotification({
      ...notification,
      upperThreshold: 11,
    });
    expect(borrowUpperNoMessage3).toEqual(
      `The Euler ${IRNotificationType.BORROW}APY on ${notification.symbol} is now ${notification.realAPY}%`
    );
  });

  it("Should properly generate a notification lowerThreshold message", () => {
    const notification = {
      notificationAPY: 1,
      realAPY: 0.9,
      lowerThreshold: 10,
      upperThreshold: 0,
      symbol: "symbol",
      type: IRNotificationType.BORROW,
    };

    // equal to the threshold
    const borrowLowerMessage =
      eulerNotificationService.buildIRNotification(notification);
    expect(borrowLowerMessage).toEqual(
      `The Euler ${IRNotificationType.BORROW}APY on ${notification.symbol} is now ${notification.realAPY}%`
    );

    // no borrow message threshold
    const borrowLowerNoMessage = eulerNotificationService.buildIRNotification({
      ...notification,
      lowerThreshold: 0,
    });
    expect(borrowLowerNoMessage).toEqual("");

    // lower than the threshold
    const borrowLowerNoMessage2 = eulerNotificationService.buildIRNotification({
      ...notification,
      lowerThreshold: 9,
    });
    expect(borrowLowerNoMessage2).toEqual("");

    // above the threshold
    const borrowLowerNoMessage3 = eulerNotificationService.buildIRNotification({
      ...notification,
      lowerThreshold: 11,
    });
    expect(borrowLowerNoMessage3).toEqual(
      `The Euler ${IRNotificationType.BORROW}APY on ${notification.symbol} is now ${notification.realAPY}%`
    );
  });

  it("Should send a supply notification when applicable", async () => {
    const mockSendSupplyNotification = {
      id: "1",
      deviceId: "deviceId",
      tokenAddress: "tokenAddress",
      supplyAPY: 1,
      borrowAPY: 0,
      supplyLowerThreshold: 0,
      supplyUpperThreshold: 10,
      borrowLowerThreshold: 0,
      borrowUpperThreshold: 0,
      token: {
        symbol: "symbol",
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const messageToSend = "messageToSend";
    const tokenSupplyApy = 1.1;
    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      mockSendSupplyNotification,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockResolvedValue({
      token: {
        symbol: "symbol",
      },
      supplyAPY: tokenSupplyApy,
      borrowAPY: 0,
    } as any);

    // first call is borrow, second supply
    jest
      .spyOn(eulerNotificationService, "buildIRNotification")
      .mockReturnValueOnce("")
      .mockReturnValueOnce(messageToSend);
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(1);
    expect(mockSendNotification).toBeCalledWith(
      messageToSend,
      mockSendSupplyNotification.deviceId,
      mockSendSupplyNotification.id,
      NotificationType.EulerIR
    );
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(1);
    expect(prismaMock.eulerIRNotification.update).toBeCalledWith(
      expect.objectContaining({
        data: {
          borrowAPY: mockSendSupplyNotification.borrowAPY,
          supplyAPY: tokenSupplyApy,
        },
      })
    );
  });

  it("Should send a borrow notification when applicable", async () => {
    const mockSendBorrowNotification = {
      id: "1",
      deviceId: "deviceId",
      tokenAddress: "tokenAddress",
      supplyAPY: 0,
      borrowAPY: 1,
      supplyLowerThreshold: 0,
      supplyUpperThreshold: 0,
      borrowLowerThreshold: 0,
      borrowUpperThreshold: 10,
      token: {
        symbol: "symbol",
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const messageToSend = "messageToSend";
    const tokenBorrowApy = 1.1;
    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      mockSendBorrowNotification,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockResolvedValue({
      token: {
        symbol: "symbol",
      },
      supplyAPY: 0,
      borrowAPY: tokenBorrowApy,
    } as any);

    // first call is borrow, second supply
    jest
      .spyOn(eulerNotificationService, "buildIRNotification")
      .mockReturnValueOnce(messageToSend)
      .mockReturnValueOnce("");
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(1);
    expect(mockSendNotification).toBeCalledWith(
      messageToSend,
      mockSendBorrowNotification.deviceId,
      mockSendBorrowNotification.id,
      NotificationType.EulerIR
    );
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(1);
    expect(prismaMock.eulerIRNotification.update).toBeCalledWith(
      expect.objectContaining({
        data: {
          borrowAPY: tokenBorrowApy,
          supplyAPY: mockSendBorrowNotification.supplyAPY,
        },
      })
    );
  });

  it("Should not send a supply notification when not applicable", async () => {
    const mockDontSendBorrowNotification = {
      id: "1",
      deviceId: "deviceId",
      tokenAddress: "tokenAddress",
      supplyAPY: 0,
      borrowAPY: 1,
      supplyLowerThreshold: 0,
      supplyUpperThreshold: 0,
      borrowLowerThreshold: 0,
      borrowUpperThreshold: 11,
      token: {
        symbol: "symbol",
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      mockDontSendBorrowNotification,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockResolvedValue({
      token: {
        symbol: "symbol",
      },
      supplyAPY: 0,
      borrowAPY: 1.1,
    } as any);

    // first call is borrow, second supply
    jest
      .spyOn(eulerNotificationService, "buildIRNotification")
      .mockReturnValueOnce("")
      .mockReturnValueOnce("");
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(0);
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(0);
  });

  it("Should not send a borrow notification when not applicable", async () => {
    const mockDontSendSupplyNotification = {
      id: "1",
      deviceId: "deviceId",
      tokenAddress: "tokenAddress",
      supplyAPY: 1,
      borrowAPY: 0,
      supplyLowerThreshold: 0,
      supplyUpperThreshold: 0,
      borrowLowerThreshold: 0,
      borrowUpperThreshold: 11,
      token: {
        symbol: "symbol",
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      mockDontSendSupplyNotification,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockResolvedValue({
      token: {
        symbol: "symbol",
      },
      supplyAPY: 1.1,
      borrowAPY: 0,
    } as any);

    // first call is borrow, second supply
    jest
      .spyOn(eulerNotificationService, "buildIRNotification")
      .mockReturnValueOnce("")
      .mockReturnValueOnce("");
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(0);
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(0);
  });

  it("Should properly handle database errors", async () => {
    const databaseError = new Error("database error");
    prismaMock.eulerIRNotification.findMany.mockRejectedValueOnce(
      databaseError
    );
    const loggerSpy = jest.spyOn(logger, "error");
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(0);
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(0);
    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith(new DatabaseError(databaseError));

    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      {
        id: "1",
        deviceId: "deviceId",
        tokenAddress: "tokenAddress",
        supplyAPY: 0,
        borrowAPY: 1,
        supplyLowerThreshold: 0,
        supplyUpperThreshold: 0,
        borrowLowerThreshold: 0,
        borrowUpperThreshold: 10,
        token: {
          symbol: "symbol",
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockRejectedValueOnce(databaseError);
    await eulerNotificationService.sendIRNotifications();
    expect(mockSendNotification).toBeCalledTimes(0);
    expect(prismaMock.eulerIRNotification.update).toBeCalledTimes(0);
    expect(loggerSpy).toBeCalledTimes(2);
    expect(loggerSpy).toBeCalledWith(databaseError);
  });

  it("Should properly handle notification errors", async () => {
    const notificationError = new NotificationError("notification error");

    // will trigger a notification
    prismaMock.eulerIRNotification.findMany.mockResolvedValue([
      {
        id: "1",
        deviceId: "deviceId",
        tokenAddress: "tokenAddress",
        supplyAPY: 0,
        borrowAPY: 1,
        supplyLowerThreshold: 0,
        supplyUpperThreshold: 0,
        borrowLowerThreshold: 0,
        borrowUpperThreshold: 10,
        token: {
          symbol: "symbol",
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    prismaMock.eulerToken.findFirstOrThrow.mockResolvedValue({
      token: {
        symbol: "symbol",
      },
      supplyAPY: 0,
      borrowAPY: 1.1,
    } as any);
    mockSendNotification.mockRejectedValueOnce(notificationError);
    const loggerSpy = jest.spyOn(logger, "error");
    await eulerNotificationService.sendIRNotifications();
    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith(new NotificationError(notificationError));
  });
});

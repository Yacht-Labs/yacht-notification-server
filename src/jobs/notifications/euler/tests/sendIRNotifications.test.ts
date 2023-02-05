import { AppleNotificationSender } from "./../../../../notifications/AppleNotificationSender";
import {
  EulerNotificationService,
  IRNotificationType,
} from "../../../../notifications/euler/EulerNotificationService";

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
  const mockSupplyAPYNotification = {
    id: 1,
    deviceId: "deviceId",
    tokenAddress: "tokenAddress",
    supplyAPY: 1,
    supplyLowerThreshold: 1,
    supplyUpperThreshold: 1,
    token: {
      symbol: "symbol",
    },
    isActive: true,
  };

  const mockBorrowAPYNotification = {
    id: 2,
    deviceId: "deviceId",
    tokenAddress: "tokenAddress",
    borrowAPY: 1,
    borrowLowerThreshold: 1,
    borrowUpperThreshold: 1,
    token: {
      symbol: "symbol",
    },
    isActive: true,
  };

  const eulerNotificationService = new EulerNotificationService(
    new AppleNotificationSender()
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should properly a notification message if the change is above the threshold", () => {
    const notificationParams = {
      notificationAPY: 1,
      realAPY: 1.1,
      lowerThreshold: 0,
      upperThreshold: 10,
      symbol: "symbol",
      type: IRNotificationType.BORROW,
    };

    const borrowUpperMessage =
      eulerNotificationService.buildIRNotification(notificationParams);
    expect(borrowUpperMessage).toEqual(
      `The Euler ${IRNotificationType.BORROW}APY on ${notificationParams.symbol} is now ${notificationParams.realAPY}%`
    );

    const borrowUpperNoMessage = eulerNotificationService.buildIRNotification({
      ...notificationParams,
      upperThreshold: 0,
    });
    expect(borrowUpperNoMessage).toEqual("");

    const borrowUpperNoMessage2 = eulerNotificationService.buildIRNotification({
      ...notificationParams,
      upperThreshold: 9,
    });
    expect(borrowUpperNoMessage2).toEqual("");
  });

  xit("Should not set a notification message if the change is not past the threshold", () => {});

  xit("Should send a notification when applicable", () => {});

  xit("Should not send a notification when not applicable", () => {});

  xit("Should update the database with the new APY value", () => {});

  xit("Should properly handle database errors", () => {});

  xit("Should properly handle notification errors", () => {});
});

import { sendHealthNotifications } from "./eulerNotifications";
import { prismaMock } from "../../singleton";
import { EulerHealthNotification } from "@prisma/client";
import { getHealthScoreByAddress } from "../server/routes/Euler";
import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from "ethers";
import { Provider, Notification } from "apn";
jest.mock("@ethersproject/contracts");
jest.mock("apn");

const ACCOUNT_ID = "100";
const DEVICE_ID = "100";
const ADDRESS = "100";

describe("Euler Notifications", () => {
  describe("Health Notifications", () => {
    let mockEulerContract: {
      getAccountStatus: jest.Mock;
    } = { getAccountStatus: jest.fn() };
    let mockApnSend = jest.fn();
    const typedContractMock = Contract as unknown as jest.Mock;
    const typedApnProvider = Provider as unknown as jest.Mock;
    const typedApnNotification = Notification as unknown as jest.Mock;
    beforeAll(() => {
      typedContractMock.mockImplementation(() => mockEulerContract);
      typedApnProvider.mockImplementation(() => ({
        send: mockApnSend,
      }));
      typedApnNotification.mockImplementation(() => ({
        expiry: 0,
        alert: "",
        topic: "",
      }));
    });

    const healthNotification2: EulerHealthNotification = {
      id: "2",
      thresholdValue: 2,
      isActive: true,
      accountId: ACCOUNT_ID,
      deviceId: DEVICE_ID,
      seen: false,
      account: {
        address: ADDRESS,
        deviceId: DEVICE_ID,
        name: "healthNotification2",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as EulerHealthNotification;

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("Should send a notification when applicable", async () => {
      const healthNotification1: EulerHealthNotification = {
        id: "1",
        thresholdValue: 1,
        isActive: true,
        accountId: ACCOUNT_ID,
        deviceId: DEVICE_ID,
        seen: false,
        account: {
          address: ADDRESS,
          deviceId: DEVICE_ID,
          name: "healthNotification1",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as EulerHealthNotification;

      const mock =
        prismaMock.eulerHealthNotification.findMany.mockResolvedValue([
          healthNotification1,
        ] as unknown as EulerHealthNotification[]);

      mockEulerContract.getAccountStatus = jest
        .fn()
        .mockResolvedValueOnce(ethers.utils.parseUnits("0.8"));

      await sendHealthNotifications();

      expect(mockApnSend).toHaveBeenCalled();
      // TEST CASES
      // 1.
      // Find a notification
      // Get a APY that would trigger the threshold
      // Check that the notification was sent
      // Check that the notification was updated

      // 2.
      // Do the above for two notifications, both of which need notifications
      // 3.
      // How about one that needs to be notified and one that doesn't
      // 4. Don't send for a notification that has been "seen"
      // 5. Reset
    });
  });

  xdescribe("Interest Rate Notifications", () => {
    // Find a healthscore that doesn't need a notification, don't do anything
    // Find a healthscore that needs a notification, check that it was sent, check that the db updates to seen
    // Find a healthscore that's been seen but should be updated to !seen
    // Check error on unable to send notification
  });
});

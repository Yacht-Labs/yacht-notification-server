import { sendHealthNotifications } from "./../../jobs/notifications/euler/sendHealthNotifications";
import { NotificationService } from "../apn";
import { EulerHealthNotification, EulerIRNotification } from "@prisma/client";
import { Prisma } from "@prisma/client";
import db from "../../../prisma/db";
import logger from "../../utils/Logging/logger";
import {
  EulerHealthNotificationWithAccount,
  NotificationType,
} from "../../types";
import { AppleNotificationSender } from "../AppleNotificationSender";
import { EulerService } from "../../services/EulerService";

enum IRNotificationType {
  BORROW = "Borrow",
  SUPPLY = "Supply",
}

export class EulerNotificationService {
  constructor(public appleNotificationSender: AppleNotificationSender) {}

  buildIRNotification(
    notificationAPY: number | null,
    realAPY: number,
    lowerThreshold: number,
    upperThreshold: number,
    symbol: string,
    type: string
  ): string {
    let notificationText = "";
    if (!notificationAPY) {
      return notificationText;
    }
    if (lowerThreshold) {
      if (realAPY <= notificationAPY * (1 - lowerThreshold / 100)) {
        notificationText = `The Euler ${type}APY on ${symbol} is now ${realAPY}%`;
      }
    }
    if (upperThreshold) {
      if (realAPY >= notificationAPY * (1 + upperThreshold / 100)) {
        notificationText = `The Euler ${type}APY on ${symbol} is now ${realAPY}%`;
      }
    }
    return notificationText;
  }

  async processIRNotification(
    borrowAPY: number,
    supplyAPY: number,
    symbol: string,
    notification: EulerIRNotification
  ) {
    const borrowNotification = this.buildIRNotification(
      notification.borrowAPY,
      borrowAPY,
      notification.borrowLowerThreshold,
      notification.borrowUpperThreshold,
      symbol,
      IRNotificationType.BORROW
    );
    if (borrowNotification) {
      const success = await this.appleNotificationSender.sendNotification(
        borrowNotification,
        notification.deviceId,
        notification.id,
        NotificationType.EulerIR
      );
      if (success) {
        await db.eulerIRNotification.update({
          where: { id: notification.id },
          data: {
            borrowAPY,
          },
        });
      }
    }
    const supplyNotification = this.buildIRNotification(
      notification.supplyAPY,
      supplyAPY,
      notification.supplyLowerThreshold,
      notification.supplyUpperThreshold,
      symbol,
      IRNotificationType.SUPPLY
    );
    if (supplyNotification) {
      const success = await this.appleNotificationSender.sendNotification(
        supplyNotification,
        notification.deviceId,
        notification.id,
        NotificationType.EulerIR
      );
      if (success) {
        await db.eulerIRNotification.update({
          where: { id: notification.id },
          data: {
            supplyAPY,
          },
        });
      }
    }
  }

  async getHealthNotifications(): Promise<
    (EulerHealthNotification & {
      account: {
        deviceId: string;
        address: string;
        name: string | null;
      };
    })[]
  > {
    return await db.eulerHealthNotification.findMany({
      where: { isActive: true, deviceId: { not: "NOTIFICATIONS_DISABLED" } },
      include: {
        account: {
          select: {
            address: true,
            deviceId: true,
            name: true,
          },
        },
      },
    });
  }

  async sendHealthNotifications() {
    try {
      const healthNotifications = await this.getHealthNotifications();
      for (const notification of healthNotifications) {
        const healthScore = await EulerService.getHealthScoreByAddress(
          EulerService.getSubAccountAddressFromAccount(
            notification.account.address,
            notification.subAccountId
          )
        );
        const message = this.generateHealthNotification(
          healthScore,
          notification
        );
        if (message) {
          const success = await this.appleNotificationSender.sendNotification(
            message,
            notification.deviceId,
            notification.id,
            NotificationType.EulerHealthScore
          );
          if (success) {
            await db.eulerHealthNotification.update({
              where: { id: notification.id },
              data: { seen: true },
            });
          }
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }

  generateHealthNotification(
    healthScore: number,
    healthNotification: Prisma.EulerHealthNotificationGetPayload<
      typeof EulerHealthNotificationWithAccount
    >
  ): string | undefined {
    if (
      healthNotification.thresholdValue > healthScore &&
      !healthNotification.seen
    ) {
      const message = `Euler health score for ${
        healthNotification.account.name
      }, subAccountId ${
        healthNotification.subAccountId
      } has dropped below ${healthNotification.thresholdValue
        .toString()
        .slice(
          0,
          healthNotification.thresholdValue.toString().indexOf(".") + 2
        )}!`;
      return message;
    }
  }
}

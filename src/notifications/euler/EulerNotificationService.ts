import { NotificationService } from "../apn";
import {
  EulerHealthNotification,
  Account,
  EulerIRNotification,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import db from "../../../prisma/db";
import logger from "../../utils/Logging/logger";
import {
  EulerHealthNotificationWithAccount,
  NotificationType,
} from "../../types";

enum IRNotificationType {
  BORROW = "Borrow",
  SUPPLY = "Supply",
}

export class EulerNotificationService {
  notificationService = new NotificationService();
  constructor() {}

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
      const success = await this.notificationService.sendNotification(
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
      const success = await this.notificationService.sendNotification(
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

  async processHealthNotification(
    healthScore: number,
    healthNotification: Prisma.EulerHealthNotificationGetPayload<
      typeof EulerHealthNotificationWithAccount
    >
  ) {
    if (
      healthNotification.thresholdValue > healthScore &&
      !healthNotification.seen
    ) {
      try {
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
        const success = await this.notificationService.sendNotification(
          message,
          healthNotification.deviceId,
          healthNotification.id,
          NotificationType.EulerHealthScore
        );
        if (success) {
          await db.eulerHealthNotification.update({
            where: { id: healthNotification.id },
            data: { seen: true },
          });
        }
      } catch (err) {
        logger.error(`Error sending Euler health notification: ${err}`);
      }
    }
  }
}

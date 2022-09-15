import { NotificationService } from "../apn";
import {
  EulerHealthNotification,
  Account,
  EulerIRNotification,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import db from "../../../prisma/db";
import logger from "../../utils/logger";
import { EulerHealthNotificationWithAccount } from "../../types";

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
      if (realAPY < notificationAPY * (1 - lowerThreshold)) {
        notificationText = `The Euler ${type}APY on ${symbol} is now ${realAPY}!`;
      }
    }
    if (upperThreshold) {
      if (realAPY > notificationAPY * (1 + upperThreshold)) {
        notificationText = `The Euler ${type}APY on ${symbol} is now ${realAPY}!`;
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
      "borrow"
    );
    if (borrowNotification) {
      await this.notificationService.sendNotification(
        borrowNotification,
        notification.deviceId
      );
      await db.eulerIRNotification.update({
        where: { id: notification.id },
        data: {
          borrowAPY,
        },
      });
    }
    const supplyNotification = this.buildIRNotification(
      notification.supplyAPY,
      supplyAPY,
      notification.supplyLowerThreshold,
      notification.supplyUpperThreshold,
      symbol,
      "supply"
    );
    if (supplyNotification) {
      await this.notificationService.sendNotification(
        supplyNotification,
        notification.deviceId
      );
      await db.eulerIRNotification.update({
        where: { id: notification.id },
        data: {
          supplyAPY,
        },
      });
    }
  }

  async processHealthNotification(
    healthScore: number,
    healthNotification: Prisma.EulerHealthNotificationGetPayload<
      typeof EulerHealthNotificationWithAccount
    >
  ) {
    if (
      healthNotification.seen &&
      healthScore >= healthNotification.thresholdValue * 1.1
    ) {
      await db.eulerHealthNotification.update({
        where: { id: healthNotification.id },
        data: { seen: false },
      });
    } else if (
      healthNotification.thresholdValue < healthScore &&
      !healthNotification.seen
    ) {
      try {
        const message = `Euler health score for ${healthNotification.account.name}, subAccountId ${healthNotification.subAccountId} has dropped below ${healthNotification.thresholdValue}!`;
        await this.notificationService.sendNotification(
          message,
          healthNotification.deviceId
        );
        await db.eulerHealthNotification.update({
          where: { id: healthNotification.id },
          data: { seen: true },
        });
      } catch (err) {
        logger.error(`Error sending Euler health notification: ${err}`);
      }
    }
  }
}

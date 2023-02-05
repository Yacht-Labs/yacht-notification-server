import { DatabaseError } from "./../../types/errors";
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

export enum IRNotificationType {
  BORROW = "Borrow",
  SUPPLY = "Supply",
}

export type IRNotificationParams = {
  notificationAPY: number | null;
  realAPY: number;
  lowerThreshold: number;
  upperThreshold: number;
  symbol: string;
  type: string;
};

export class EulerNotificationService {
  constructor(public appleNotificationSender: AppleNotificationSender) {}

  async getIrNotifications(): Promise<EulerIRNotification[]> {
    try {
      return await db.eulerIRNotification.findMany({
        where: { isActive: true, deviceId: { not: "NOTIFICATIONS_DISABLED" } },
      });
    } catch (err) {
      throw new DatabaseError(err);
    }
  }

  buildIRNotification(params: IRNotificationParams): string {
    let notificationText = "";
    if (!params.notificationAPY) {
      return notificationText;
    }
    if (params.lowerThreshold) {
      if (
        params.realAPY <=
        params.notificationAPY * (1 - params.lowerThreshold / 100)
      ) {
        notificationText = `The Euler ${params.type}APY on ${params.symbol} is now ${params.realAPY}%`;
      }
    }
    if (params.upperThreshold) {
      if (
        params.realAPY >=
        params.notificationAPY * (1 + params.upperThreshold / 100)
      ) {
        notificationText = `The Euler ${params.type}APY on ${params.symbol} is now ${params.realAPY}%`;
      }
    }
    return notificationText;
  }

  async sendIRNotifications() {
    try {
      const irNotifications = await this.getIrNotifications();
      for (const notification of irNotifications) {
        const eulerToken = await db.eulerToken.findFirstOrThrow({
          where: { address: notification.tokenAddress },
          include: {
            token: {
              select: {
                symbol: true,
              },
            },
          },
        });
        const { borrowAPY, supplyAPY } = eulerToken;
        const borrowMessage = this.buildIRNotification({
          notificationAPY: notification.borrowAPY,
          realAPY: borrowAPY,
          lowerThreshold: notification.borrowLowerThreshold,
          upperThreshold: notification.borrowUpperThreshold,
          symbol: eulerToken.token.symbol,
          type: IRNotificationType.BORROW,
        });
        const supplyMessage = this.buildIRNotification({
          notificationAPY: notification.supplyAPY,
          realAPY: supplyAPY,
          lowerThreshold: notification.supplyLowerThreshold,
          upperThreshold: notification.supplyUpperThreshold,
          symbol: eulerToken.token.symbol,
          type: IRNotificationType.SUPPLY,
        });
        const message = borrowMessage || supplyMessage;
        if (message) {
          const success = await this.appleNotificationSender.sendNotification(
            message,
            notification.deviceId,
            notification.id,
            NotificationType.EulerIR
          );
          if (success) {
            await db.eulerIRNotification.update({
              where: { id: notification.id },
              data: {
                borrowAPY: borrowMessage ? borrowAPY : notification.borrowAPY,
                supplyAPY: supplyMessage ? supplyAPY : notification.supplyAPY,
              },
            });
          }
        }
      }
    } catch (err) {
      logger.error(err);
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
    try {
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
    } catch (err) {
      throw new DatabaseError(err);
    }
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

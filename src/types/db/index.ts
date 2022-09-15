import { Prisma } from "@prisma/client";

export const EulerHealthNotificationWithAccount =
  Prisma.validator<Prisma.EulerHealthNotificationArgs>()({
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

export const EulerTokenWithSymbol = Prisma.validator<Prisma.EulerTokenArgs>()({
  include: {
    token: {
      select: {
        symbol: true,
      },
    },
  },
});

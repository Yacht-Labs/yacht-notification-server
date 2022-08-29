import { BigNumber, ethers } from "ethers";
import db from "../../prisma/db";
import * as eulerLensContract from "../constants/abis/eulerLens.json";
import { generateNotification, sendNotification } from "../notifications/apn";
// // console.log("work");
// // request(APIURL, tokenQuery).then(({ asset }) => {
// //   console.log(asset);
// //   const borrowAPY = asset.borrowAPY[0] + "." + asset.borrowAPY.slice(1, 3);
// //   console.log(borrowAPY);
// // });

// const tokenQuery = gql`
//   {
//     asset(id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
//       id
//       name
//       borrowAPY
//       supplyAPY
//     }
//   }
// `;
// const prisma = new PrismaClient();

// const sendIRNotification = async () => {
//   const notifications = await prisma.eulerIRNotification.findMany({
//     where: { isActive: true },
//   });
//   notifications.forEach(async (notification) => {
//     try {
//       const { borrowAPY, supplyAPY } = await prisma.token.findFirstOrThrow({
//         where: { address: notification.tokenAddress },
//       });
//       if (notification.borrowAPY && notification.borrowThreshold) {
//         const diff = Math.abs(borrowAPY - notification.borrowAPY);
//         if (diff > notification.borrowThreshold / 100) {
//           // construct notification
//         }
//       }
//       if (notification.supplyAPY && notification.supplyThreshold) {
//         const diff = Math.abs(borrowAPY - notification.supplyAPY);
//         if (diff > notification.supplyThreshold / 100) {
//           // construct notification
//         }
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   });
// };
const getHealthScoreByAddress = async (address: string): Promise<number> => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/a1b56be8bd4d4b6fa5a343abffe797ab" // mainnet
  );
  const eulerLens = new ethers.Contract(
    "0xc2d41d42939109CDCfa26C6965269D9C0220b38E", // Euler simple lens mainnet
    eulerLensContract.abi,
    provider
  );
  const { healthScore }: { healthScore: BigNumber } =
    await eulerLens.getAccountStatus(address);
  return parseInt(ethers.utils.formatEther(healthScore));
};

const sendHealthNotifications = async () => {
  const healthNotifications = await db.eulerHealthNotification.findMany({
    where: { isActive: true },
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
  healthNotifications.forEach(async (notification) => {
    const healthScore = await getHealthScoreByAddress(
      notification.account.address
    );
    if (healthScore < notification.thresholdValue && !notification.seen) {
      try {
        const note = generateNotification(
          `Euler healthscore for account ${notification.account.name} has dropped below ${notification.thresholdValue}!`
        );
        await sendNotification(note, notification.deviceId);
        await db.eulerHealthNotification.update({
          where: { id: notification.id },
          data: { seen: true },
        });
      } catch (err) {
        console.log(err);
      }
    }
    if (notification.seen && healthScore >= notification.thresholdValue * 1.1) {
      await db.eulerHealthNotification.update({
        where: { id: notification.id },
        data: { seen: false },
      });
    }
  });
};

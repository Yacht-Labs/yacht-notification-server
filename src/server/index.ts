import express from "express";
import eulerRoutes from "./routes/Euler";
import accountRoutes from "./routes/Accounts";
import notificationRoutes from "./routes/Notifications";
import { runJobs } from "../jobs";
const app = express();
const port = 3000;

app.use(express.json());
app.use("/euler", eulerRoutes);
app.use("/accounts", accountRoutes);
app.use("/notifications", notificationRoutes);

// app.post("/addresses", async (req, res) => {
//   const { pubKey, deviceId, name } = req.body;
//   const address = await prisma.address.create({
//     data: {
//       pubKey,
//       deviceId,
//       name,
//     },
//   });
//   res.json(address);
// });

// app.post("/notifications/euler/ir", async (req, res) => {
//   const {
//     address,
//     tokenAddress,
//     borrowAPY,
//     supplyAPY,
//     borrowThreshold,
//     supplyThreshold,
//   } = req.body;
//   const notification = await prisma.eulerIRNotification.create({
//     data: {
//       tokenAddress,
//       borrowAPY,
//       supplyAPY,
//       borrowThreshold,
//       supplyThreshold,
//       addressPubKey: address,
//     },
//   });
//   res.json(notification);
// });

// app.put("/notifications/euler/ir/:id", async (req, res) => {
//   const { id } = req.params;
//   const { borrowAPY, supplyAPY, borrowThreshold, supplyThreshold } = req.body;
//   const notification = await prisma.eulerIRNotification.update({
//     where: { id },
//     data: {
//       borrowAPY,
//       supplyAPY,
//       borrowThreshold,
//       supplyThreshold,
//     },
//   });
//   res.json(notification);
// });

// app.delete("/notifications/euler/ir/:id", async (req, res) => {
//   const { id } = req.params;
//   const notification = await prisma.eulerIRNotification.update({
//     where: { id },
//     data: {
//       isActive: false,
//     },
//   });
//   res.json(notification);
// });

// app.post("/notifications/euler/health", async (req, res) => {
//   const { address, thresholdValue } = req.body;
//   const notification = await prisma.eulerHealthNotification.create({
//     data: {
//       addressPubKey: address,
//       thresholdValue,
//     },
//   });
//   res.json(notification);
// });

// app.put("/notifications/euler/health/:id", async (req, res) => {
//   const { id } = req.params;
//   const { thresholdValue } = req.body;
//   const notification = await prisma.eulerHealthNotification.update({
//     where: { id },
//     data: {
//       thresholdValue,
//     },
//   });
//   res.json(notification);
// });

// app.delete("/notifications/euler/healthscore/:id", async (req, res) => {
//   const { id } = req.params;
//   const notification = await prisma.eulerHealthNotification.update({
//     where: { id },
//     data: {
//       isActive: false,
//     },
//   });
//   res.json(notification);
// });

// const initTokenDb = async () => {
//   const formatAPY = (rawAPY: string): string => {
//     return rawAPY[0] + "." + rawAPY.slice(1, 3);
//   };
//   const tokenQuery = gql`
//     {
//       asset(id: $tokenAddress) {
//         id
//         name
//         borrowAPY
//         supplyAPY
//       }
//     }
//   `;
//   collateralAssets.forEach(async (collateralAsset) => {
//     const {
//       asset,
//     }: {
//       asset: {
//         id: string;
//         borrowAPY: string;
//         supplyAPY: string;
//         name: string;
//       };
//     } = await request(APIURL, tokenQuery, {
//       tokenAddress: collateralAsset.address,
//     });
//     const borrowAPY = formatAPY(asset.borrowAPY);
//     const supplyAPY = formatAPY(asset.supplyAPY);
//     await prisma.token.create({
//       data: {
//         address: asset.id,
//         name: asset.name,
//         supplyAPY: parseInt(supplyAPY),
//         borrowAPY: parseInt(borrowAPY),
//         tier: "collateral",
//       },
//     });
//   });
// };

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  runJobs();
});

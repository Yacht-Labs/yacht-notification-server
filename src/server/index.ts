import { collateralAssets } from "./../constants/tokenAddresses";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { request, gql } from "graphql-request";

const prisma = new PrismaClient();
const app = express();
const port = 3000;

const APIURL =
  "https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet";

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/addresses", async (req, res) => {
  const { pubKey, deviceId, name } = req.body;
  const address = await prisma.address.create({
    data: {
      pubKey,
      deviceId,
      name,
    },
  });
  res.json(address);
});

app.post("/notifications/euler/ir", async (req, res) => {
  const {
    address,
    tokenAddress,
    borrowAPY,
    supplyAPY,
    borrowThreshold,
    supplyThreshold,
  } = req.body;
  const notification = await prisma.eulerIRNotification.create({
    data: {
      tokenAddress,
      borrowAPY,
      supplyAPY,
      borrowThreshold,
      supplyThreshold,
      addressPubKey: address,
    },
  });
  res.json(notification);
});

app.put("/notifications/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  const { borrowAPY, supplyAPY, borrowThreshold, supplyThreshold } = req.body;
  const notification = await prisma.eulerIRNotification.update({
    where: { id },
    data: {
      borrowAPY,
      supplyAPY,
      borrowThreshold,
      supplyThreshold,
    },
  });
  res.json(notification);
});

app.delete("/notifications/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  const notification = await prisma.eulerIRNotification.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
  res.json(notification);
});

app.post("/notifications/euler/healthscore", async (req, res) => {
  const { address, thresholdValue } = req.body;
  const notification = await prisma.eulerHealthNotification.create({
    data: {
      addressPubKey: address,
      thresholdValue,
    },
  });
  res.json(notification);
});

app.put("/notifications/euler/healthscore/:id", async (req, res) => {
  const { id } = req.params;
  const { thresholdValue } = req.body;
  const notification = await prisma.eulerHealthNotification.update({
    where: { id },
    data: {
      thresholdValue,
    },
  });
  res.json(notification);
});

app.delete("/notifications/euler/healthscore/:id", async (req, res) => {
  const { id } = req.params;
  const notification = await prisma.eulerHealthNotification.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
  res.json(notification);
});

const initTokenDb = async () => {
  const formatAPY = (rawAPY: string): string => {
    return rawAPY[0] + "." + rawAPY.slice(1, 3);
  };
  const tokenQuery = gql`
    {
      asset(id: $tokenAddress) {
        id
        name
        borrowAPY
        supplyAPY
      }
    }
  `;
  collateralAssets.forEach(async (collateralAsset) => {
    const {
      asset,
    }: {
      asset: {
        id: string;
        borrowAPY: string;
        supplyAPY: string;
        name: string;
      };
    } = await request(APIURL, tokenQuery, {
      tokenAddress: collateralAsset.address,
    });
    const borrowAPY = formatAPY(asset.borrowAPY);
    const supplyAPY = formatAPY(asset.supplyAPY);
    await prisma.token.create({
      data: {
        address: asset.id,
        name: asset.name,
        supplyAPY: parseInt(supplyAPY),
        borrowAPY: parseInt(borrowAPY),
        tier: "collateral",
      },
    });
  });
};

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  console.log("....Initializing Token DB....");
  await initTokenDb();
  console.log("....Finished Initializing Token DB");
});

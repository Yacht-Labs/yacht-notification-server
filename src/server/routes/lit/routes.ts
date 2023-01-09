import express from "express";
import litSdk from "./sdk";
import { create } from "ipfs-core";
import db from "../../../../prisma/db";
import fs from "fs";
import path from "path";
type LitERC20SwapParam = {
  counterPartyAddress: string;
  tokenAddress: string;
  chain: string;
  amount: string;
  decimals: number;
};

function isLitSwapParam(param: any): param is LitERC20SwapParam {
  return (
    param.counterPartyAddress &&
    param.tokenAddress &&
    param.chain &&
    param.amount &&
    param.decimals
  );
}

const router = express.Router();

router.post("/mintSwapPkp", async (req, res) => {
  function checkParams(params: LitERC20SwapParam): boolean {
    if (
      !params.counterPartyAddress ||
      !params.tokenAddress ||
      !params.chain ||
      !params.amount ||
      !params.decimals
    ) {
      return false;
    }
    return true;
  }
  const ipfs = await create({ start: false, offline: true });
  try {
    const {
      chainAParams,
      chainBParams,
    }: { chainAParams: LitERC20SwapParam; chainBParams: LitERC20SwapParam } =
      req.body;
    if (!checkParams(chainAParams) || !checkParams(chainBParams)) {
      return res.status(400).send("Invalid params");
    }
    const litActionCode = litSdk.createERC20SwapLitAction(
      chainAParams,
      chainBParams
    );
    const ipfsCID = (
      await ipfs.add(litActionCode, { onlyHash: true })
    ).cid.toString();
    const pkpInfo = await litSdk.mintGrantBurnWithLitAction(ipfsCID);
    await db.litPkpSwap.create({
      data: {
        chainAParams,
        chainBParams,
        pkpPublicKey: pkpInfo.publicKey,
        ipfsCID,
        address: pkpInfo.address,
      },
    });
    return res.json({ ipfsCID, ...pkpInfo });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  } finally {
    await ipfs.stop();
  }
});

router.post("/runLitAction", async (req, res) => {
  const { pkpPublicKey }: { pkpPublicKey: string } = req.body;
  if (!pkpPublicKey) {
    return res.status(400).send("Invalid params");
  }
  try {
    const litPkpSwap = await db.litPkpSwap.findUnique({
      where: { pkpPublicKey },
    });
    if (litPkpSwap) {
      // check that chainAParams and chainBParams are valid LitErc20SwapParams
      if (
        !isLitSwapParam(litPkpSwap.chainAParams) ||
        !isLitSwapParam(litPkpSwap.chainBParams)
      ) {
        return res.status(500).send("Invalid swap params in database");
      }
      const code = litSdk.createERC20SwapLitAction(
        litPkpSwap.chainAParams,
        litPkpSwap.chainBParams
      );
      fs.writeFileSync(
        path.resolve(__dirname, "litActionCode.txt"),
        code,
        "utf8"
      );
      const litActionCodeResponse = await litSdk.runLitAction({
        pkpPublicKey,
        code,
      });
      return res.json(litActionCodeResponse);
    } else {
      res.status(400).send("Invalid PKP public key");
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// create a route /lit/swapObjects/:counterPartyAddress that gets all litPkpSwap objects with the correct counterPartyAddress
router.get("/swapObjects/:counterPartyAddress", async (req, res) => {
  const { counterPartyAddress } = req.params;
  // check that counterPartyAddress is a valid address
  if (!counterPartyAddress) {
    return res.status(400).send("Invalid counterPartyAddress");
  }
  try {
    const litPkpSwaps = await db.litPkpSwap.findMany({
      where: {
        OR: [
          {
            chainBParams: {
              path: ["counterPartyAddress"],
              equals: counterPartyAddress,
            },
          },
          {
            chainAParams: {
              path: ["counterPartyAddress"],
              equals: counterPartyAddress,
            },
          },
        ],
      },
    });
    return res.json(litPkpSwaps);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// create a route /lit/swapObject/:pkpPublicKey that gets a single litPkpSwap object with the correct pkpPublicKey
router.get("/swapObject/:pkpPublicKey", async (req, res) => {
  const { pkpPublicKey } = req.params;
  // check that pkpPublicKey is a valid pkpPublicKey
  if (!pkpPublicKey) {
    return res.status(400).send("Invalid pkpPublicKey");
  }
  try {
    const litPkpSwap = await db.litPkpSwap.findUnique({
      where: { pkpPublicKey },
    });
    return res.json(litPkpSwap);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

export default router;

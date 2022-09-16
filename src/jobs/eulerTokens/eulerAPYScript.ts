import { getEulerGraphEndpoint } from "../../utils/";
import { ProviderError } from "../../types/errors";
import { request } from "graphql-request";
import { ethers, BigNumber } from "ethers";
import WebSocket from "ws";
import EulerToolsClient from "./EulerToolsClient.js";
import BigNumberJs from "bignumber.js";
import db from "../../../prisma/db";
// const WebSocket = require("ws");
//const { enablePatches, applyPatches } = require("immer")
// const EulerToolsClient = require("./EulerToolsClient");
//enablePatches()

const EULERSCAN_ENDPOINT = "wss://escan-mainnet.euler.finance";

const eulerClient = new EulerToolsClient({
  version: "example script",
  endpoint: EULERSCAN_ENDPOINT,
  WebSocket,
  onConnect: () => console.log("Euler History Client connected"),
  onDisconnect: () => console.log("Euler History Client disconnected"),
});

interface Patch {
  result: {
    value: {
      epoch: {
        endBlock: number;
        epoch: number;
        eulIssuance: string;
        numAssetsRewarded: number;
        startBlock: number;
      };
      tokens: {
        [address: string]: string;
      };
    };
  }[];
}

export const updateEulApys = async () =>
  // : Promise<
  //   ProviderResult<{
  //     epoch: {
  //       endBlock: number;
  //       epoch: number;
  //       eulIssuance: string;
  //       numAssetsRewarded: number;
  //       startBlock: number;
  //     };
  //     tokens: {
  //       [address: string]: string;
  //     };
  //   }>
  // >
  {
    await eulerClient.connect();

    let result;
    const id = await eulerClient.sub(
      { cmd: "sub", query: { topic: "rewardsIssuance" } },
      async (err: Error, patch: Patch) => {
        console.log("...Updating EUL APYs...");
        if (err) result = new ProviderError(err.message);

        eulerClient.unsubscribe(id); // don't unsubscribe if using immer

        // if using immer:
        //for (let p of patch.result) p.path = p.path.split("/").filter(e => e !== "")
        //result = applyPatches(result, patch.result)

        const { epoch } = patch.result[0].value;
        const { tokens } = patch.result[0].value;
        const SECONDS_IN_YEAR = 31536000;
        const AVERAGE_BLOCK_TIME = 12;
        const EPOCHS_PER_YEAR =
          SECONDS_IN_YEAR /
          AVERAGE_BLOCK_TIME /
          (epoch.endBlock - epoch.startBlock);
        const EULER_ADDRESS = "0xd9fcd98c322942075a5c3860693e9f4f03aae07b";

        const tokenAddresses = Object.keys(tokens);
        const eulPerToken = tokenAddresses.map((_, i) => {
          return {
            tokenAddress: tokenAddresses[i],
            numEulInEpoch: ethers.utils.formatEther(
              BigNumber.from(tokens[tokenAddresses[i]])
            ),
          };
        });

        const eulQuery = `{
            asset(id: "0xd9fcd98c322942075a5c3860693e9f4f03aae07b") {
                currPriceUsd
              }
        }`;
        const {
          asset: { currPriceUsd },
        } = await request(getEulerGraphEndpoint(), eulQuery);
        const eulPrice = new BigNumberJs(currPriceUsd)
          .dividedBy(new BigNumberJs("10e17"))
          .toString();

        for (const token of eulPerToken) {
          const totalBorrowsQuery = `{
                asset(id: "${token.tokenAddress}") {
                    name
                  totalBorrowsUsd
                  decimals
                }
              }`;
          const {
            asset: { totalBorrowsUsd, name, decimals },
          } = await request(getEulerGraphEndpoint(), totalBorrowsQuery);
          const formattedBorrows = new BigNumberJs(totalBorrowsUsd)
            .dividedBy(
              new BigNumberJs(`10e${(parseInt(decimals) - 1).toString()}`)
            )
            .toString();
          const APR =
            ((EPOCHS_PER_YEAR *
              parseFloat(token.numEulInEpoch) *
              parseFloat(eulPrice)) /
              parseFloat(formattedBorrows)) *
            100;
          await db.eulerToken.update({
            where: {
              address: token.tokenAddress,
            },
            data: {
              eulAPY: APR,
            },
          });
        }
        console.log("...Finished updating EUL APYS...\n");
        await eulerClient.shutdown();
        process.exit;
        return;
      }
    );
  };

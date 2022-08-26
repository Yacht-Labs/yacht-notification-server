import * as dotenv from "dotenv";
dotenv.config();

export const getEulerGraphEndpoint = (): string => {
  return "https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet";
  //   const endpoint = process.env.EULER_GRAPH_ENDPOINT;
  //   if (!endpoint) {
  //     throw new Error();
  //   }
  //   return endpoint;
};

export const formatAPY = (rawAPY: string): number => {
  return parseFloat(rawAPY[0] + "." + rawAPY.slice(1, 3));
};

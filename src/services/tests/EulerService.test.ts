import { prismaMock } from "../../../test/singleton";
import { asset, EulerService } from "../EulerService";
import fetch from "node-fetch";
import { TokenInfo } from "../../types/Euler";
import { Token } from "@prisma/client";

const mockJsonFetchResponse = jest.fn();
const mockGraphqlRequest = jest.fn();

jest.mock("node-fetch", () =>
  jest.fn().mockResolvedValue({
    json: () => mockJsonFetchResponse(),
  })
);

// mock request from graphql-request
jest.mock("graphql-request", () => ({
  gql: jest.fn(),
  request: () => mockGraphqlRequest(),
}));

const TOKEN = {
  id: "1",
  address: "0xfcf8eda095e37a41e002e266daad7efc1579bc0a",
  chainId: 1,
  name: "FLEX Coin",
  symbol: "FLEX",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/9108/large/coinflex_logo.png?1628750583",
  protocols: ["euler"],
  price: null,
  extensions: null,
} as Token;

const asset: asset = {
  id: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919",
  currPriceUsd: "2766318034420633304",
  borrowAPY: "184301279438679374893319177",
  supplyAPY: "101505377331132309035088151",
  decimals: "18",
  totalBalances: "395521328552343594223981",
  totalBorrows: "293579815032872202517508",
  config: {
    borrowFactor: "2800000000",
    collateralFactor: "0",
    tier: "cross",
  },
};

describe("Euler Service", () => {
  describe("updateTokenList", () => {
    beforeEach(() => {
      prismaMock.token.update.mockResolvedValue(TOKEN);
      prismaMock.token.create.mockResolvedValue(TOKEN);
      mockJsonFetchResponse.mockResolvedValue({
        tokens: [
          {
            chainId: 42161,
            address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
            name: "Wrapped ETH",
            symbol: "WETH",
            decimals: 18,
            logoURI:
              "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
          } as TokenInfo,
        ],
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Shouldn't update tokens if no tokens are returned", async () => {
      mockJsonFetchResponse.mockResolvedValue({ tokens: [] });
      await EulerService.updateTokenList();
      expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
    });

    it("Shouldn't update a token if data is missing", async () => {
      mockJsonFetchResponse.mockResolvedValue({
        tokens: [
          {
            chainId: 42161,
            address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
            name: "Wrapped ETH",
            symbol: "WETH",
          },
        ],
      });
      await EulerService.updateTokenList();
      expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
    });

    xit("Should create a token if it doesn't exist", async () => {
      prismaMock.token.findFirst.mockResolvedValue(null);
      await EulerService.updateTokenList();
      expect(prismaMock.token.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
    });

    xit("Should update a token if it exists and doesn't have euler in protocols", async () => {
      prismaMock.token.findFirst.mockResolvedValue({ ...TOKEN, protocols: [] });
      await EulerService.updateTokenList();
      expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(1);
    });

    it("Should not update a token if it exists and has euler in protocols", async () => {
      prismaMock.token.findFirst.mockResolvedValue(TOKEN);
      await EulerService.updateTokenList();
      expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
    });
  });

  describe("Update Euler Tokens", () => {
    beforeEach(() => {
      prismaMock.token.findFirst.mockResolvedValue(TOKEN);
      prismaMock.token.update.mockResolvedValue(TOKEN);
      // mock resolved value for db.eulerToken
      prismaMock.eulerToken.upsert.mockResolvedValue({
        id: "1",
        address: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919",
        tokenId: "1",
        tier: "cross",
        supplyAPY: 12,
        borrowAPY: 12,
        borrowFactor: 12,
        collateralFactor: 12,
        totalSupplyUSD: "12",
        totalBorrowsUSD: "12",
        eulAPY: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockGraphqlRequest.mockResolvedValue({
        assets: [asset],
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it("Shouldn't update tokens if no assets are returned", async () => {
      mockGraphqlRequest.mockResolvedValueOnce({ assets: [] });
      await EulerService.updateEulerTokens();
      expect(prismaMock.eulerToken.upsert).toHaveBeenCalledTimes(0);
    });

    it("Shouldn't update a token if data is missing", async () => {
      mockGraphqlRequest.mockResolvedValueOnce({
        currPriceUsd: "2766318034420633304",
        borrowAPY: "184301279438679374893319177",
        supplyAPY: "101505377331132309035088151",
        decimals: "18",
      });
      await EulerService.updateEulerTokens();
      expect(prismaMock.token.findFirst).toHaveBeenCalledTimes(0);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
      expect(prismaMock.eulerToken.upsert).toHaveBeenCalledTimes(0);
    });

    xit("Shouldn't update euler token if there's not a token record", async () => {
      mockGraphqlRequest.mockResolvedValue({
        assets: [asset],
      });
      prismaMock.token.findFirst.mockResolvedValue(null);
      await EulerService.updateEulerTokens();
      expect(prismaMock.token.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
      expect(prismaMock.eulerToken.upsert).toHaveBeenCalledTimes(0);
    });
  });
});

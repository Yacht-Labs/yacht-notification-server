import { SquidService } from "./../SquidService";
import { prismaMock } from "../../../test/singleton";
import fetch from "node-fetch";
import { TokenData } from "@0xsquid/sdk";
const mockJsonResponse = jest.fn();

jest.mock("node-fetch", () =>
  jest.fn().mockResolvedValue({
    json: () => mockJsonResponse(),
  })
);

const TOKEN = {
  id: "1",
  address: "0xfcf8eda095e37a41e002e266daad7efc1579bc0a",
  chainId: 1,
  name: "FLEX Coin",
  symbol: "FLEX",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/9108/large/coinflex_logo.png?1628750583",
  protocols: ["squid"],
  price: null,
  extensions: null,
};

describe("Squid Service", () => {
  beforeEach(() => {
    prismaMock.token.update.mockResolvedValue(TOKEN);
    prismaMock.token.create.mockResolvedValue(TOKEN);
    mockJsonResponse.mockResolvedValue({
      tokens: [
        {
          chainId: 42161,
          address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          name: "Wrapped ETH",
          symbol: "WETH",
          decimals: 18,
          logoURI:
            "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
          coingeckoId: "weth",
        } as TokenData,
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Shouldn't update token list if no tokens are returned", async () => {
    mockJsonResponse.mockResolvedValue({ tokens: [] });
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
    expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
  });

  it("Shouldn't update a token if data is missing", async () => {
    mockJsonResponse.mockResolvedValue({
      tokens: [
        {
          address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          name: "Wrapped ETH",
          decimals: 18,
          logoURI:
            "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
          coingeckoId: "weth",
        },
      ],
    });
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
    expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
  });

  it("Should convert decimals to numbers", async () => {
    mockJsonResponse.mockResolvedValue({
      tokens: [
        {
          chainId: 42220,
          address: "0x617f3112bf5397D0467D315cC709EF968D9ba546",
          name: "Tether USD | Wormhole",
          symbol: "USDT.wh",
          decimals: "6",
          logoURI:
            "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
          coingeckoId: "tether",
        },
      ],
    });
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(1);
  });

  it("Should create a token if it doesn't exist", async () => {
    prismaMock.token.findFirst.mockResolvedValue(null);
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
  });

  it("Should update a token if it exists and doesn't have squid in protocols", async () => {
    prismaMock.token.findFirst.mockResolvedValue({ ...TOKEN, protocols: [] });
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
    expect(prismaMock.token.update).toHaveBeenCalledTimes(1);
  });

  it("Should not update a token if it exists and has squid in protocols", async () => {
    prismaMock.token.findFirst.mockResolvedValue(TOKEN);
    await SquidService.updateTokenList();
    expect(prismaMock.token.create).toHaveBeenCalledTimes(0);
    expect(prismaMock.token.update).toHaveBeenCalledTimes(0);
  });
});

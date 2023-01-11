import request from "supertest";
import { app, server } from "../../index";
import { YachtLitSdk } from "lit-swap-sdk";
import { prismaMock } from "../../../../test/singleton";
import { dnsEncode } from "ethers/lib/utils";

const mockMintGrantBurn = jest.fn().mockResolvedValue({
  tokenId: "0x1234",
  publicKey: "0x1234",
  address: "0x1234",
});

const mockRunLitAction = jest.fn();

jest.mock("lit-swap-sdk", () => {
  return {
    YachtLitSdk: jest.fn().mockImplementation(() => {
      return {
        mintGrantBurnWithLitAction: () => mockMintGrantBurn(),
        createERC20SwapLitAction: jest.fn().mockImplementation(() => {
          return "Javascript Code";
        }),
        runLitAction: () => mockRunLitAction(),
      };
    }),
  };
});

describe("Lit Swap Routes", () => {
  beforeEach(() => {
    (YachtLitSdk as any as jest.Mock).mockClear();
  });

  afterAll(() => {
    server.close(() => {});
  });

  const properSwapParams = {
    chainAParams: {
      counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      tokenAddress: "0xe6b8a5cf854791412c1f6efc7caf629f5df1c747",
      chain: "mumbai",
      amount: "10",
      decimals: "18",
    },
    chainBParams: {
      counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      tokenAddress: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
      chain: "goerli",
      amount: "10",
      decimals: "18",
    },
  };

  const litPkpSwapModelInstance = {
    ...properSwapParams,
    pkpPublicKey: "0x1234",
    ipfsCID: "0x1234",
    address: "0x1234",
  };

  describe("/mintSwapPkp", () => {
    it("should return 200 when passed proper parameters", async () => {
      const prismaLitMockCreate =
        prismaMock.litPkpSwap.create.mockResolvedValueOnce(
          litPkpSwapModelInstance
        );
      const response = await request(app)
        .post("/lit/mintSwapPkp")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(properSwapParams))
        .set("Accept", "application/json");
      expect(prismaLitMockCreate).toHaveBeenCalled();
      expect(response.status).toEqual(200);
      expect(response.body.tokenId).toBe("0x1234");
      expect(response.body.publicKey).toBe("0x1234");
      expect(response.body.address).toBe("0x1234");
    });

    it("should return 400 when passed improper parameters", async () => {
      const params = {
        chainAParams: {
          counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          tokenAddress: "0xe6b8a5cf854791412c1f6efc7caf629f5df1c747",
          chain: "mumbai",
          decimals: "18",
        },
        chainBParams: {
          counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          tokenAddress: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
          amount: "10",
          decimals: "18",
        },
      };
      const response = await request(app)
        .post("/lit/mintSwapPkp")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(params))
        .set("Accept", "application/json");
      expect(response.status).toEqual(400);
    });

    it("should return 500 if mintGrantBurn fails", async () => {
      const params = properSwapParams;
      const prismaLitMockCreate =
        prismaMock.litPkpSwap.create.mockResolvedValueOnce(
          litPkpSwapModelInstance
        );
      mockMintGrantBurn.mockRejectedValueOnce(new Error("Error"));
      const response = await request(app)
        .post("/lit/mintSwapPkp")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(params))
        .set("Accept", "application/json");
      expect(prismaLitMockCreate).toHaveBeenCalledTimes(0);
      expect(response.status).toEqual(500);
    });
  });

  describe("/runLitAction", () => {
    it("should return 200 when passed proper parameters", async () => {
      const params = {
        pkpPublicKey: "0x1234",
      };
      // mock prisma litPkpSwap findUnique
      const prismaLitMockFindUnique =
        prismaMock.litPkpSwap.findUnique.mockResolvedValueOnce(
          litPkpSwapModelInstance
        );
      mockRunLitAction.mockResolvedValueOnce({ response: "success" });
      const response = await request(app)
        .post("/lit/runLitAction")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(params))
        .set("Accept", "application/json");
      expect(prismaLitMockFindUnique).toHaveBeenCalledTimes(1);
      expect(response.status).toEqual(200);
    });

    it("should return 400 when passed improper parameters", async () => {
      const response = await request(app)
        .post("/lit/runLitAction")
        .set("Content-Type", "application/json")
        .send(
          JSON.stringify({
            pkpPublicKey: "0x1234",
          })
        )
        .set("Accept", "application/json");
      expect(response.status).toEqual(400);
    });

    it("should return 500 if the database fails", async () => {
      prismaMock.litPkpSwap.findUnique.mockRejectedValueOnce(
        new Error("Error")
      );
      const response = await request(app)
        .post("/lit/runLitAction")
        .set("Content-Type", "application/json")
        .send(
          JSON.stringify({
            pkpPublicKey: "0x1234",
          })
        )
        .set("Accept", "application/json");
      expect(response.status).toEqual(500);
    });

    it("should return 500 if runLitAction fails", async () => {
      const params = {
        pkpPublicKey: "0x1234",
      };
      const prismaLitMockFindUnique =
        prismaMock.litPkpSwap.findUnique.mockResolvedValueOnce(
          litPkpSwapModelInstance
        );
      mockRunLitAction.mockRejectedValueOnce(new Error("Error"));
      const response = await request(app)
        .post("/lit/runLitAction")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(params))
        .set("Accept", "application/json");
      expect(response.status).toEqual(500);
    });
  });

  describe("/swapObjects/:counterPartyAddress", () => {
    it("should return 200 when passed proper parameters", async () => {
      const params = {
        counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      };
      // mock prisma litPkpSwap findMany
      const prismaLitMockFindMany =
        prismaMock.litPkpSwap.findMany.mockResolvedValueOnce([
          litPkpSwapModelInstance,
        ]);
      const response = await request(app)
        .get(`/lit/swapObjects/${params.counterPartyAddress}`)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toEqual(200);
      expect(prismaLitMockFindMany).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual([litPkpSwapModelInstance]);
    });

    it("should return 404 when passed no parameters", async () => {
      const response = await request(app)
        .get(`/lit/swapObjects/`)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toEqual(404);
    });

    it("should return 500 if the database fails", async () => {
      const params = {
        counterPartyAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      };

      prismaMock.litPkpSwap.findMany.mockRejectedValueOnce(new Error("Error"));
      const response = await request(app)
        .get(`/lit/swapObjects/${params.counterPartyAddress}`)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toEqual(500);
    });
  });

  describe("/swapObject", () => {
    it("should return 200 when passed proper parameters", async () => {
      const params = {
        pkpPublicKey: "0x1234",
      };
      const prismaLitMockFindUnique =
        prismaMock.litPkpSwap.findUnique.mockResolvedValueOnce(
          litPkpSwapModelInstance
        );
      const response = await request(app)
        .get(`/lit/swapObject/${params.pkpPublicKey}}`)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toEqual(200);
      expect(prismaLitMockFindUnique).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual(litPkpSwapModelInstance);
    });

    it("should return 500 if the database fails", async () => {
      const params = {
        pkpPublicKey: "0x1234",
      };
      // mock prisma litPkpSwap findUnique
      prismaMock.litPkpSwap.findUnique.mockRejectedValueOnce(
        new Error("Error")
      );
      const response = await request(app)
        .get(`/lit/swapObject/${params.pkpPublicKey}}`)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toEqual(500);
    });
  });
});

import request from "supertest";
import { app } from "../../index";

describe("Lit Swap Routes", () => {
  it("should return 200 when passed proper parameters", (done) => {
    const params = {
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
    const res = request(app)
      .post("/lit/mintSwapPkp")
      .send(params)
      .set("Accept", "application/json")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  });
});

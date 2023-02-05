import { isEvmAddress } from "../evm";

describe("Utils", () => {
  describe("EVM", () => {
    it("should return true if address is valid", () => {
      expect(isEvmAddress("0x0000000000000000000000000000000000000000")).toBe(
        true
      );
      expect(isEvmAddress("0x38c3A84293F9079DEC28573cD3f1E8a995b0B500")).toBe(
        true
      );
    });

    it("should return false if address is invalid", () => {
      expect(isEvmAddress("0x000000000000000000000000000000000000000")).toBe(
        false
      );
      expect(isEvmAddress("0x0235223500000000000000")).toBe(false);
    });
  });
});

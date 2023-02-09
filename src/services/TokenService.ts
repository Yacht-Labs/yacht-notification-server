import { EulerService } from "./EulerService";
import { SquidService } from "./SquidService";
export class TokenService {
  public static async updateTokenList() {
    await EulerService.updateTokenList();
    await SquidService.updateTokenList();
  }
}

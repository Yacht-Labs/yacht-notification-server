import { updateEulApy } from "./../../src/jobs/EulerTools/eulerAPYScript";
import { updateTokenList } from "../../src/jobs/updateTokens";
import { updateEulerTokens } from "../../src/jobs/updateEulerTokens";

async function seedDb() {
  await updateTokenList();
  await updateEulerTokens();
  await updateEulApy();
}

seedDb();

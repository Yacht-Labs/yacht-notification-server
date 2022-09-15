import { updateEulApys } from "../../src/jobs/eulerTokens/eulerAPYScript";
import { updateTokenList } from "../../src/jobs/updateTokens";
import { updateEulerTokens } from "../../src/jobs/eulerTokens/updateEulerTokens";

async function seedDb() {
  await updateTokenList();
  await updateEulerTokens();
  await updateEulApys();
}

seedDb();

import { getDbEndpoint } from "../../src/utils/environment";
import { exec } from "child_process";

const endpoint = getDbEndpoint();

const options = {
  env: { ...process.env, DATABASE_URL: endpoint },
};

exec(
  `npx prisma migrate resolve --rolled-back "20230201181750_add"`,
  options,
  (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  }
);
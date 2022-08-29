import { getDbEndpoint } from "../../src/utils/environment";
import { exec } from "child_process";

const endpoint = getDbEndpoint();
const [migrationName] = process.argv.slice(2);

const options = {
  env: { ...process.env, DATABASE_URL: endpoint },
};

exec(
  `npx prisma migrate dev ${migrationName}`,
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
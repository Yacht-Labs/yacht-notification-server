import * as dotenv from "dotenv";
dotenv.config();

const getStringEnv = (key: string) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Environment var ${key} not set`);
  }
  return val;
};

export const getEulerGraphEndpoint = (): string => {
  return getStringEnv("EULER_GRAPH_ENDPOINT");
};

export const getApnAuthKey = (): string => {
  const base64 = getStringEnv("NOTIFICATION_AUTHKEY");
  return Buffer.from(base64, "base64").toString("ascii");
};

export const isProduction = (): boolean => {
  return process.env.PRODUCTION === "true" ? true : false;
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === "test" ? true : false;
};

export const getApnBundleName = (): string => {
  const isProd = isProduction();
  return isProd ? "com.YachtLabs.Yacht" : "com.YachtLabs.Yacht.dev";
};

export const getEulerSimpleLens = (): string => {
  return getStringEnv("EULER_SIMPLE_LENS");
};

export const getProviderUrl = (chainId: number): string => {
  if (isTest()) {
    return "http://localhost:999999999";
  }
  switch (chainId) {
    case 1:
      return getStringEnv("MAINNET_PROVIDER_URL");
    case 80001:
      return getStringEnv("MUMBAI_PROVIDER_URL");
    default:
      return getStringEnv("MAINNET_PROVIDER_URL");
  }
};

export const getApnKeyId = (): string => {
  return getStringEnv("APN_KEY_ID");
};

export const getApnTeamId = (): string => {
  return getStringEnv("APN_TEAM_ID");
};

export const getDbUser = (): string => {
  return isProduction()
    ? getStringEnv("RDS_USERNAME")
    : getStringEnv("DB_USER");
};

export const getDbPassword = (): string => {
  return isProduction()
    ? getStringEnv("RDS_PASSWORD")
    : getStringEnv("DB_PASSWORD");
};

export const getDbHost = (): string => {
  return isProduction()
    ? getStringEnv("RDS_HOSTNAME")
    : getStringEnv("DB_HOST");
};

export const getDbPort = (): string => {
  return isProduction() ? getStringEnv("RDS_PORT") : getStringEnv("DB_PORT");
};

export const getDbName = (): string => {
  return isProduction() ? getStringEnv("RDS_DB_NAME") : getStringEnv("DB_NAME");
};

export const getDbEndpoint = (): string => {
  return `postgresql://${getDbUser()}:${getDbPassword()}@${getDbHost()}:${getDbPort()}/${getDbName()}?schema=public`;
};

export const getMumbaiPrivateKey = (): string => {
  return isTest()
    ? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    : getStringEnv("MUMBAI_PRIVATE_KEY");
};

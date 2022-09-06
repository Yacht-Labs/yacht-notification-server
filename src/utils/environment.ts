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
  return getStringEnv("NOTIFICATION_AUTHKEY");
};

export const isProduction = (): boolean => {
  return process.env.production === "true" ? true : false;
};

export const getEulerSimpleLens = (): string => {
  return getStringEnv("EULER_SIMPLE_LENS");
};

export const getProviderUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return getStringEnv("MAINNET_PROVIDER_URL");
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

export const formatAPY = (rawAPY: string): number => {
  return rawAPY === "0" ? 0 : parseFloat(rawAPY[0] + "." + rawAPY.slice(1, 3));
};

export const getDbUser = (): string => {
  return getStringEnv("DB_USER");
};

export const getDbPassword = (): string => {
  return getStringEnv("DB_PASSWORD");
};

export const getDbHost = (): string => {
  return getStringEnv("DB_HOST");
};

export const getDbPort = (): string => {
  return getStringEnv("DB_PORT");
};

export const getDbName = (): string => {
  return getStringEnv("DB_NAME");
};

export const getDbEndpoint = (): string => {
  return `postgresql://${getDbUser()}:${getDbPassword()}@${getDbHost()}:${getDbPort()}/${getDbName()}?schema=public`;
};

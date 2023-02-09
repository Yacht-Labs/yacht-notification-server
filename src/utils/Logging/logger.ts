import {
  getAwsAccessKeyId,
  getAwsLogGroup,
  getAwsLogStream,
  getAwsRegion,
  getAwsSecretKey,
  isProduction,
} from "./../environment";
import winston, { format } from "winston";
import CloudWatchTransport from "winston-cloudwatch";

const { combine, errors, prettyPrint } = format;

const formatter = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.splat(),
  format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
    }`;
  })
);

const transports = [
  new winston.transports.Console({
    format: prettyPrint({
      colorize: true,
    }),
    silent: process.env.NODE_ENV === "test",
  }),
] as winston.transport[];

if (isProduction()) {
  transports.push(
    new CloudWatchTransport({
      logGroupName: getAwsLogGroup(),
      logStreamName: getAwsLogStream(),
      awsOptions: {
        credentials: {
          accessKeyId: getAwsAccessKeyId(),
          secretAccessKey: getAwsSecretKey(),
        },
        region: getAwsRegion(),
      },
      jsonMessage: true,
      retentionInDays: isProduction() ? 14 : 1,
      silent: process.env.NODE_ENV === "test",
    })
  );
}

const logger = winston.createLogger({
  format: combine(errors({ stack: true }), formatter),
  levels: winston.config.npm.levels,
  transports: transports,
  exitOnError: false,
});

export default logger;

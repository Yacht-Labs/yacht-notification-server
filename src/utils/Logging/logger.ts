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
import { YachtError } from "../../types/errors";

const { combine, timestamp, printf } = format;

// const myFormat = printf(({ level, message, timestamp }) => {
//   return `${timestamp} ${level}: ${message}`;
// });

const enumerateErrorFormat = format((info: any) => {
  console.log("info----", info.stack);
  return info;
});

const options = {
  console: {
    level: "debug",
    handleExceptions: true,
    json: true,
    colorize: true,
  },
};

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: combine(
    enumerateErrorFormat(),
    // format.errors({ stack: true }),
    format.json()
  ),
  // timestamp({
  //   format: "YYYY-MM-DD HH:mm:ss",
  // }),
  // myFormat
  transports: [
    new winston.transports.Console(options.console),
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
    }),
  ],
  exitOnError: false,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
// if (!isProduction()) {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.simple(),
//     })
//   );
// }

export default logger;

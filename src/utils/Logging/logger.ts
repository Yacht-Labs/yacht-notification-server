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

const logger = winston.createLogger({
  format: combine(errors({ stack: true }), formatter),
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({
      format: prettyPrint({
        colorize: true,
      }),
    }),
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

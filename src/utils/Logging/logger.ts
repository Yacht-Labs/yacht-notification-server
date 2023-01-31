import {
  getAwsAccessKeyId,
  getAwsLogGroup,
  getAwsLogStream,
  getAwsRegion,
  getAwsSecretKey,
} from "./../environment";
import winston from "winston";
import CloudWatchTransport from "winston-cloudwatch";
const options = {
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: winston.format.json(),
  transports: [
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
    }),
  ],
  exitOnError: false,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;

import { getErrorMessage } from "../utils";
import logger from "../utils/Logging/logger";

enum ErrorTypes {
  BUSINESS_LOGIC = "BusinessLogic",
  PROVIDER = "Provider",
  GRAPH = "Graph",
  DATABASE = "Database",
  REQUEST = "Request",
  NOTIFICATION = "Notification",
}

export abstract class YachtError extends Error {
  public stack: any;
  public isTrusted: boolean;
  constructor(error: unknown, public type: ErrorTypes, public status?: number) {
    super(getErrorMessage(error));
    this.isTrusted = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProviderError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.PROVIDER);
  }
}

export class DatabaseError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.DATABASE);
  }
}

export class GraphError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.GRAPH);
  }
}

export class BusinessLogicError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.BUSINESS_LOGIC);
  }
}

export class RequestError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.REQUEST, 400);
  }
}

export class NotificationError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.NOTIFICATION);
  }
}

export class HttpError extends YachtError {
  constructor(error: unknown, status?: number) {
    super(error, ErrorTypes.REQUEST);
  }
}

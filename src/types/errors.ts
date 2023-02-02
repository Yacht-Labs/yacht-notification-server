import { getErrorMessage } from "../utils";
import logger from "../utils/Logging/logger";

enum ErrorTypes {
  BUSINESS_LOGIC = "BusinessLogic",
  PROVIDER = "Provider",
  GRAPH = "Graph",
  DATABASE = "Database",
  REQUEST = "Request",
}

export abstract class YachtError extends Error {
  public stack: any;
  constructor(error: unknown, public type: ErrorTypes, public status?: number) {
    super(getErrorMessage(error));
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProviderError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.PROVIDER, 500);
  }
}

export class DatabaseError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.DATABASE, 500);
  }
}

export class GraphError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.GRAPH, 500);
  }
}

export class BusinessLogicError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.BUSINESS_LOGIC, 500);
  }
}

export class RequestError extends YachtError {
  constructor(error: unknown) {
    super(error, ErrorTypes.REQUEST, 400);
  }
}

export class HttpError extends YachtError {
  constructor(error: unknown, status?: number) {
    super(error, ErrorTypes.REQUEST);
  }
}

import logger from "../utils/logger";

enum ErrorTypes {
  BUSINESS_LOGIC = "BusinessLogic",
  PROVIDER = "Provider",
  GRAPH = "Graph",
  DATABASE = "Database",
}

export abstract class YachtError {
  constructor(public message: string, public type: ErrorTypes) {}
}

export class ProviderError extends YachtError {
  constructor(message: string) {
    logger.error({ message });
    super(message, ErrorTypes.PROVIDER);
  }
}

export class DatabaseError extends YachtError {
  constructor(message: string) {
    logger.error({ message });
    super(message, ErrorTypes.DATABASE);
  }
}

export class GraphError extends YachtError {
  constructor(message: string) {
    logger.error({ message });
    super(message, ErrorTypes.GRAPH);
  }
}

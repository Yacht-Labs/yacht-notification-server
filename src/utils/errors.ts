import logger from "./Logging/logger";
import { Request, Response, NextFunction } from "express";
export default class ErrorHandler {
  public static logError(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    logger.error(error);
    next(error);
  }
  public static handleError(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const status = error.status || 500;
    const message = error.message || "Something went wrong";
    res.status(status).json({ status, message });
  }
}

type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

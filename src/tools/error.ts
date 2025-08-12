export class AppError extends Error {
  public code?: string | number;
  public details?: any;

  constructor(message: string, code?: string | number, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function handleError(error: unknown, context?: string) {
  if (error instanceof AppError) {
    console.error(
      `[AppError]${context ? ` [${context}]` : ""} ${error.message}`,
      {
        code: error.code,
        details: error.details,
        stack: error.stack,
      }
    );
  } else if (error instanceof Error) {
    console.error(`[Error]${context ? ` [${context}]` : ""} ${error.message}`, {
      stack: error.stack,
    });
  } else {
    console.error(`[UnknownError]${context ? ` [${context}]` : ""}`, error);
  }
}

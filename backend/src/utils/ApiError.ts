export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors?: any[],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, errors?: any[]) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized access") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden resource") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string = "Conflict detected", errors?: any[]) {
    return new ApiError(409, message, errors);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(500, message);
  }
}

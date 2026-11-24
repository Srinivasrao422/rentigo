export interface ApiResponsePayload<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export class ApiResponse<T = any> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data?: T;
  public meta?: ApiResponsePayload<T>["meta"];

  constructor(
    statusCode: number,
    message: string = "Success",
    data?: T,
    meta?: ApiResponsePayload<T>["meta"]
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(data: T, message: string = "Success", statusCode: number = 200, meta?: ApiResponsePayload<T>["meta"]) {
    return new ApiResponse(statusCode, message, data, meta);
  }

  static created<T>(data: T, message: string = "Resource created successfully") {
    return new ApiResponse(201, message, data);
  }
}

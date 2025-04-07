import log from "@/main/core/utils/logger";

const logger = log.scope("IpcErrorHandler");

/**
 * Standard IPC error response structure
 */
export interface IpcErrorResponse {
  code: string;
  message: string;
  method: string;
  timestamp: string;
  details?: any;
}

/**
 * Utility to create standardized IPC error responses
 */
export class IpcErrorHandler {
  /**
   * Create a standardized error response from any error
   *
   * @param error The error object
   * @param method The IPC method that caused the error
   * @param logError Whether to log the error
   * @returns A standardized error response
   */
  static createErrorResponse(
    error: any,
    method: string,
    logError: boolean = true
  ): IpcErrorResponse {
    // Extract error information
    const message = error instanceof Error ? error.message : String(error);
    const code = error.code || "IPC_ERROR";
    const details = error.details || undefined;

    // Create standardized response
    const response: IpcErrorResponse = {
      code,
      message,
      method,
      timestamp: new Date().toISOString(),
      details,
    };

    // Log the error if requested
    if (logError) {
      logger.error(`Error in ${method}:`, error);
    }

    return response;
  }

  /**
   * Handle an error by logging and returning a standard response
   *
   * @param error The error that occurred
   * @param method The IPC method where it happened
   * @returns A standardized error response
   */
  static handleError(error: any, method: string): IpcErrorResponse {
    return this.createErrorResponse(error, method, true);
  }

  /**
   * Wrap an IPC handler with standardized error handling
   *
   * @param handler The original IPC handler
   * @param method The IPC method name
   * @returns A wrapped handler with error handling
   */
  static wrapHandler<T extends (...args: any[]) => Promise<any>>(
    handler: T,
    method: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        const errorResponse = this.handleError(error, method);
        throw errorResponse; // Re-throw as a standard error object
      }
    }) as T;
  }
}

export default IpcErrorHandler;

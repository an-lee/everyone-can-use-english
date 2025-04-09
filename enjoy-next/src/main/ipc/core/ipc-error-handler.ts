import { log } from "@main/core";
import { IpcMainInvokeEvent } from "electron";

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
      const logger = log.scope("IpcErrorHandler");
      logger.error(new Error(`Ipc Error in ${method}: [${code}]${message}`));
    }

    return response;
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
    return (async (event: IpcMainInvokeEvent, ...args: any[]) => {
      try {
        return await handler(event, ...args);
      } catch (error) {
        const errorResponse = this.createErrorResponse(error, method, true);
        log.debug("Sending IPC error:", errorResponse);
        event.sender.send("ipc:onError", errorResponse);

        throw errorResponse; // Re-throw as a standard error object
      }
    }) as T;
  }
}

export default IpcErrorHandler;

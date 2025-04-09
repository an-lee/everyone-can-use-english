/**
 * Standard IPC error response structure
 */
declare interface IpcErrorResponse {
  code: string;
  message: string;
  method: string;
  timestamp: string;
  details?: any;
}

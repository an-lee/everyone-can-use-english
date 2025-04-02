import { app } from "electron";
import path from "path";
import { createLogger, format, transports } from "winston";

const logDir = path.join(app.getPath("userData"), "logs");

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create base logger instance
const logger = createLogger({
  level: app.isPackaged ? "info" : "debug",
  levels: logLevels,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    // File transport for all logs
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logDir, "app.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (!app.isPackaged) {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        format.printf(({ level, message, timestamp, scope, ...rest }) => {
          const scopeStr = scope ? `[${scope}] ` : "";
          const restStr = Object.keys(rest).length
            ? ` ${JSON.stringify(rest)}`
            : "";
          return `${timestamp} ${level}: ${scopeStr}${message}${restStr}`;
        })
      ),
    })
  );
}

// Create a scoped logger factory
const createScopedLogger = (scope: string) => {
  const scopedLogger = {
    error: (message: string, meta?: any) =>
      logger.error(message, { scope, ...meta }),
    warn: (message: string, meta?: any) =>
      logger.warn(message, { scope, ...meta }),
    info: (message: string, meta?: any) =>
      logger.info(message, { scope, ...meta }),
    debug: (message: string, meta?: any) =>
      logger.debug(message, { scope, ...meta }),
    scope: (nestedScope: string) =>
      createScopedLogger(`${scope}:${nestedScope}`),
  };

  return scopedLogger;
};

// Export a root logger that can create scoped loggers
export default {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  scope: (scope: string) => createScopedLogger(scope),
};

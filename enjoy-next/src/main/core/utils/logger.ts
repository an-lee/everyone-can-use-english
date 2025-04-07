import * as winston from "winston";
import * as path from "path";
import * as fs from "fs-extra";

// Create logs directory
const logsDir = path.join(
  process.env.APPDATA ||
    (process.platform === "darwin"
      ? path.join(process.env.HOME || "", "Library", "Application Support")
      : path.join(process.env.HOME || "", ".local", "share")),
  "enjoy-next",
  "logs"
);

fs.ensureDirSync(logsDir);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "enjoy-next" },
  transports: [
    // Write to all logs with level 'info' and below to `combined.log`
    // Write all logs with level 'error' and below to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Add scope functionality
const log = {
  scope: (scope: string) => {
    return {
      info: (message: string, ...meta: any[]) =>
        logger.info(`[${scope}] ${message}`, ...meta),
      error: (message: string | Error, ...meta: any[]) => {
        if (message instanceof Error) {
          logger.error(`[${scope}] ${message.message}`, {
            error: message,
            ...meta,
          });
        } else {
          logger.error(`[${scope}] ${message}`, ...meta);
        }
      },
      warn: (message: string, ...meta: any[]) =>
        logger.warn(`[${scope}] ${message}`, ...meta),
      debug: (message: string, ...meta: any[]) =>
        logger.debug(`[${scope}] ${message}`, ...meta),
    };
  },
  info: (message: string, ...meta: any[]) => logger.info(message, ...meta),
  error: (message: string | Error, ...meta: any[]) => {
    if (message instanceof Error) {
      logger.error(message.message, { error: message, ...meta });
    } else {
      logger.error(message, ...meta);
    }
  },
  warn: (message: string, ...meta: any[]) => logger.warn(message, ...meta),
  debug: (message: string, ...meta: any[]) => logger.debug(message, ...meta),
};

export { log };
export default log;

import { InitPhase } from "@main/core/plugin/phase-registry";
import log from "@main/services/logger";
import { db } from "@main/storage/db";

// Configure logger
const logger = log.scope("DbInitPhase");

/**
 * Initialization phase that sets up the database system
 */
export class DbInitPhase implements InitPhase {
  readonly id = "db-init";
  readonly name = "Database Initialization";
  readonly description = "Sets up the database system and connections";
  readonly dependencies: string[] = ["ipc-setup"]; // Depends on IPC system being initialized first
  readonly timeout = 10000; // 10 seconds timeout

  async execute(): Promise<void> {
    logger.info("Initializing database system");

    try {
      // Call the database initialization method
      // This will set up event listeners but not connect to DB yet
      db.init();

      logger.info("Database system initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize database system:", error);
      throw error;
    }
  }
}

// Export the phase
export default new DbInitPhase();

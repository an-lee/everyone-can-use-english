import log from "@main/services/logger";

type ServiceMethod = (...args: any[]) => Promise<any>;
type ServiceClass = Record<string, ServiceMethod>;

/**
 * Factory function to create IPC handlers from service classes
 * This reduces repetition between service and IPC handler files
 *
 * @param entityName Name of the entity for logging
 * @param service Service class containing methods to expose via IPC
 * @param methodNames Names of methods to expose (optional, defaults to all methods)
 * @returns Object with IPC handlers
 */
export function createIpcHandlers(
  entityName: string,
  service: ServiceClass,
  methodNames?: string[]
): Record<string, ServiceMethod> {
  const logger = log.scope(`${entityName}Ipc`);
  const handlers: Record<string, ServiceMethod> = {};

  // If no method names provided, use all methods from the service
  const methods =
    methodNames ||
    Object.getOwnPropertyNames(service).filter(
      (name) => typeof service[name] === "function" && !name.startsWith("_")
    );

  // Create a handler for each method
  for (const methodName of methods) {
    if (typeof service[methodName] !== "function") {
      continue;
    }

    handlers[methodName] = async (...args: any[]) => {
      try {
        logger.debug(`Calling ${methodName} with args:`, args);
        return await service[methodName](...args);
      } catch (error) {
        // Create more specific error message based on method and args
        let errorMsg = `Error in ${entityName}.${methodName}`;
        if (args.length > 0 && typeof args[0] === "string") {
          errorMsg += ` with ID ${args[0]}`;
        }
        logger.error(errorMsg, error);
        throw error;
      }
    };
  }

  return handlers;
}

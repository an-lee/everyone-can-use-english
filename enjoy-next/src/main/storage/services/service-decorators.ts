import { log } from "@/main/core";
import { PreloadApiGenerator, ServiceHandlerMetadata } from "@/main/ipc";
import "reflect-metadata";
import db from "../db";

const SERVICE_METHOD_KEY = "service:method";
const SERVICE_METADATA_KEY = "service:metadata";

/**
 * Metadata for a service method parameter
 */
export interface ServiceParameterMetadata {
  name: string;
  type: string;
  required: boolean;
  index: number;
  description?: string;
}

/**
 * Metadata for a service method
 */
export interface ServiceMethodMetadata {
  name: string;
  returnType: string;
  parameters: ServiceParameterMetadata[];
  description?: string;
}

/**
 * Metadata for a service class
 */
export interface ServiceClassMetadata {
  name: string;
  methods: Map<string, ServiceMethodMetadata>;
}

/**
 * Registry of service metadata
 */
export class ServiceMetadataRegistry {
  private static instance: ServiceMetadataRegistry;
  private services: Map<any, ServiceClassMetadata> = new Map();

  private constructor() {}

  static getInstance(): ServiceMetadataRegistry {
    if (!ServiceMetadataRegistry.instance) {
      ServiceMetadataRegistry.instance = new ServiceMetadataRegistry();
    }
    return ServiceMetadataRegistry.instance;
  }

  registerService(target: any, name: string): void {
    if (!this.services.has(target)) {
      this.services.set(target, {
        name,
        methods: new Map(),
      });
    }
  }

  getServiceMetadata(target: any): ServiceClassMetadata | undefined {
    return this.services.get(target);
  }

  registerMethod(
    target: any,
    methodName: string,
    metadata: ServiceMethodMetadata
  ): void {
    const serviceMetadata = this.getServiceMetadata(target);
    if (serviceMetadata) {
      serviceMetadata.methods.set(methodName, metadata);
    }
  }

  getMethodMetadata(
    target: any,
    methodName: string
  ): ServiceMethodMetadata | undefined {
    const serviceMetadata = this.getServiceMetadata(target);
    return serviceMetadata?.methods.get(methodName);
  }

  getAllServices(): Map<any, ServiceClassMetadata> {
    return this.services;
  }
}

/**
 * Decorator for service classes
 */
export function Service(name: string) {
  return function (target: any) {
    ServiceMetadataRegistry.getInstance().registerService(target, name);
    Reflect.defineMetadata(SERVICE_METADATA_KEY, { name }, target);
    return target;
  };
}

/**
 * Decorator for service methods
 */
export function ServiceMethod(description?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const paramTypes =
      Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
    const returnType = Reflect.getMetadata(
      "design:returntype",
      target,
      propertyKey
    );

    // Extract parameter metadata
    const parameters: ServiceParameterMetadata[] = paramTypes.map(
      (type: any, index: number) => {
        // Get parameter name (would need parameter decorators for better names)
        const paramName = `param${index}`;

        // Convert type to string representation
        const typeStr =
          type?.name || typeof type === "function" ? type.name : "any";

        return {
          name: paramName,
          type: typeStr,
          required: true, // Default to required
          index,
        };
      }
    );

    // Create method metadata
    const methodMetadata: ServiceMethodMetadata = {
      name: propertyKey,
      returnType: returnType?.name || "Promise<any>",
      parameters,
      description,
    };

    // Store in registry
    ServiceMetadataRegistry.getInstance().registerMethod(
      target.constructor,
      propertyKey,
      methodMetadata
    );

    // Also store on the method itself
    Reflect.defineMetadata(
      SERVICE_METHOD_KEY,
      methodMetadata,
      target,
      propertyKey
    );

    return descriptor;
  };
}

/**
 * Decorator for method parameters
 */
export function Param(options: {
  name?: string;
  description?: string;
  required?: boolean;
}) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // Get existing parameter metadata or create new
    const existingMetadata = Reflect.getMetadata(
      SERVICE_METHOD_KEY,
      target,
      propertyKey
    ) || { parameters: [] };

    // Update parameter info
    if (!existingMetadata.parameters[parameterIndex]) {
      existingMetadata.parameters[parameterIndex] = {};
    }

    existingMetadata.parameters[parameterIndex] = {
      ...existingMetadata.parameters[parameterIndex],
      name: options.name,
      description: options.description,
      required: options.required !== undefined ? options.required : true,
      index: parameterIndex,
    };

    // Store updated metadata
    Reflect.defineMetadata(
      SERVICE_METHOD_KEY,
      existingMetadata,
      target,
      propertyKey
    );
  };
}

/**
 * Helper function to get method parameter metadata
 */
export function getServiceMethodMetadata(
  target: any,
  methodName: string
): ServiceMethodMetadata | undefined {
  return ServiceMetadataRegistry.getInstance().getMethodMetadata(
    target,
    methodName
  );
}

/**
 * Handler factory for creating IPC handlers from service classes
 */
export function createIpcHandlers<
  T extends Record<string, (...args: any[]) => Promise<any>>,
>(
  entityName: string,
  service: T,
  channelPrefix: string
): Record<string, (...args: any[]) => Promise<any>> {
  // Create the handlers
  const handlers: Record<string, (...args: any[]) => Promise<any>> = {};

  // Try to get metadata from ServiceMetadataRegistry first
  const serviceMetadata =
    ServiceMetadataRegistry.getInstance().getServiceMetadata(
      service.constructor
    );

  // Log the available metadata for debugging
  log
    .scope("ipc-db")
    .debug(
      `Service metadata for ${entityName}:`,
      serviceMetadata
        ? `Found with ${serviceMetadata.methods.size} methods`
        : "Not found"
    );

  // Extract method names from the service
  const methodNames = Object.getOwnPropertyNames(service).filter(
    (name) =>
      typeof service[name as keyof typeof service] === "function" &&
      !name.startsWith("_")
  );

  // IMPORTANT: Also get methods from prototype (where class methods are defined)
  const prototypeMethodNames = Object.getOwnPropertyNames(
    Object.getPrototypeOf(service)
  ).filter(
    (name) =>
      typeof service[name as keyof typeof service] === "function" &&
      !name.startsWith("_") &&
      name !== "constructor"
  );

  // Combine all method names (unique)
  const allMethodNames = [
    ...new Set([...methodNames, ...prototypeMethodNames]),
  ];

  // Generate metadata for preload API generation
  const preloadMetadata: ServiceHandlerMetadata = {
    name: entityName,
    channelPrefix: channelPrefix,
    parentModule: "db", // Specify db as the parent module
    methods: [],
  };

  // Create a handler for each method
  for (const methodName of allMethodNames) {
    if (typeof service[methodName as keyof typeof service] !== "function") {
      continue;
    }

    // Create the handler function
    handlers[methodName] = async (...args: any[]) => {
      try {
        // Check if database is connected before executing the method
        if (!db.dataSource?.isInitialized) {
          const dbState = db.currentState.state;
          throw new Error(
            `Database is not connected (current state: ${dbState}). Please connect to the database first.`
          );
        }

        return await service[methodName as keyof typeof service](...args);
      } catch (error: any) {
        // Create a standardized error response
        const message = error instanceof Error ? error.message : String(error);
        throw {
          code: error.code || "DB_ERROR",
          message,
          method: `db:${channelPrefix}:${methodName}`,
          timestamp: new Date().toISOString(),
        };
      }
    };

    // Get method metadata from registry if available
    const registryMethodMetadata = serviceMetadata?.methods.get(methodName);

    // Log available method metadata for debugging
    log
      .scope("ipc-db")
      .debug(
        `Method metadata for ${entityName}.${methodName}:`,
        registryMethodMetadata ? "Found" : "Not found"
      );

    // Define method metadata for preload
    const methodMetadataForPreload: {
      name: string;
      returnType: string;
      description: string;
      parameters: Array<{
        name: string;
        type: string;
        required?: boolean;
      }>;
    } = {
      name: methodName,
      returnType: "Promise<any>",
      description: `${entityName} ${methodName} operation`,
      parameters: [],
    };

    // If registry metadata is available, use it
    if (registryMethodMetadata) {
      methodMetadataForPreload.returnType = registryMethodMetadata.returnType;
      methodMetadataForPreload.description =
        registryMethodMetadata.description ||
        methodMetadataForPreload.description;
      methodMetadataForPreload.parameters =
        registryMethodMetadata.parameters.map((param) => ({
          name: param.name,
          type: param.type,
          required: param.required,
        }));
    } else {
      // Try to get metadata directly from method via reflection
      const methodDescriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(service),
        methodName
      );

      if (methodDescriptor) {
        const directMetadata = Reflect.getMetadata(
          "service:method",
          Object.getPrototypeOf(service),
          methodName
        );

        if (directMetadata && directMetadata.parameters) {
          log
            .scope("ipc-db")
            .debug(`Direct metadata found for ${entityName}.${methodName}`);

          methodMetadataForPreload.parameters = directMetadata.parameters.map(
            (param: any) => ({
              name: param.name || `param${param.index}`,
              type: param.type || "any",
              required: param.required,
            })
          );

          if (directMetadata.returnType) {
            methodMetadataForPreload.returnType = directMetadata.returnType;
          }
        }
      }
    }

    // Add metadata for this method
    preloadMetadata.methods.push(methodMetadataForPreload);
  }

  // Register the metadata for preload API generation
  PreloadApiGenerator.registerServiceHandler(preloadMetadata);

  // Log registration for debugging
  log
    .scope("ipc-db")
    .info(
      `Registered service handler: ${entityName} with ${preloadMetadata.methods.length} methods under db.${channelPrefix}`
    );

  return handlers;
}

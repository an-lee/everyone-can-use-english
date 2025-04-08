import { log } from "@/main/core";
import "reflect-metadata";

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

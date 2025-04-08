import { ipcRegistry } from "@main/ipc/core";
import fs from "fs";
import path from "path";
import { log } from "@main/core";
import capitalize from "lodash/capitalize";
import camelCase from "lodash/camelCase";

const logger = log.scope("PreloadGenerator");

/**
 * Metadata about an IPC service handler
 */
export interface ServiceHandlerMetadata {
  name: string;
  channelPrefix: string;
  parentModule?: string; // Add parent module option for nesting
  methods: {
    name: string;
    parameters?: {
      name: string;
      type: string;
      required?: boolean;
    }[];
    returnType: string;
    description?: string;
  }[];
}

/**
 * Generates TypeScript interfaces and implementations for the preload API
 * based on the registered IPC modules.
 */
export class PreloadApiGenerator {
  // Store registered service metadata for generation
  private static serviceHandlers: ServiceHandlerMetadata[] = [];

  /**
   * Register metadata for a service-based handler
   */
  static registerServiceHandler(metadata: ServiceHandlerMetadata): void {
    // Check if this service is already registered to avoid duplicates
    const existingServiceIndex = this.serviceHandlers.findIndex(
      (s) =>
        s.name === metadata.name && s.channelPrefix === metadata.channelPrefix
    );

    if (existingServiceIndex !== -1) {
      // Replace existing service with updated one
      this.serviceHandlers[existingServiceIndex] = metadata;
      logger.info(`Updated service handler metadata for: ${metadata.name}`);
    } else {
      // Add new service
      this.serviceHandlers.push(metadata);
      logger.info(
        `Registered service handler metadata for: ${metadata.name} with parent ${metadata.parentModule || "none"}`
      );
    }

    // Log the number of registered services
    logger.info(
      `Total registered service handlers: ${this.serviceHandlers.length}`
    );
  }

  /**
   * Clear all registered service handlers
   */
  static clearServiceHandlers(): void {
    this.serviceHandlers = [];
    logger.info("Cleared all service handler metadata");
  }

  /**
   * Generate TypeScript code for the preload API
   * @param outputPath Path to write the generated file
   */
  static async generatePreloadApi(outputPath: string): Promise<void> {
    // Get metadata from IPC modules
    const metadata = ipcRegistry.getAllMethodsMetadata();

    // Group by module
    const moduleGroups = new Map<string, any[]>();
    for (const method of metadata) {
      if (!moduleGroups.has(method.module)) {
        moduleGroups.set(method.module, []);
      }
      moduleGroups.get(method.module)!.push(method);
    }

    // Log registered services for debugging
    logger.info(
      `Generating preload API with ${this.serviceHandlers.length} service handlers registered`
    );
    for (const service of this.serviceHandlers) {
      logger.info(
        `Service: ${service.name}, Prefix: ${service.channelPrefix}, Parent: ${service.parentModule || "none"}`
      );
    }

    let code = `// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on ${new Date().toISOString()}
import { ipcRenderer } from 'electron';

// Define necessary types
export interface DbState {
  state: string;
  message?: string;
}

`;

    // Organize service handlers by parent module
    const servicesByParent = new Map<string, ServiceHandlerMetadata[]>();
    for (const service of this.serviceHandlers) {
      const parentKey = service.parentModule || "root";
      if (!servicesByParent.has(parentKey)) {
        servicesByParent.set(parentKey, []);
      }
      servicesByParent.get(parentKey)!.push(service);
    }

    // Generate the main interface
    code += `export interface EnjoyAPI {\n`;

    // Add module-based interfaces
    for (const [moduleName, methods] of moduleGroups.entries()) {
      // Skip if no methods
      if (methods.length === 0) continue;

      // Get channel prefix from first method
      const channelPrefix = methods[0].channel.split(":")[0];
      // Camelize the channel prefix
      const camelizedPrefix = camelCase(channelPrefix);

      code += `  ${camelizedPrefix}: {\n`;

      // Add core methods for this module
      for (const method of methods) {
        const methodName = camelCase(method.name);
        const params = this.generateMethodParams(
          method.metadata.parameters || []
        );
        const returnType = method.metadata.returns?.type || "any";

        code += `    ${methodName}: ${params} => Promise<${returnType}>;\n`;
      }

      // Add nested service interfaces if this module has any services
      const moduleServices = servicesByParent.get(camelizedPrefix) || [];
      if (moduleServices.length > 0) {
        for (const service of moduleServices) {
          // Get service name (namespace)
          const serviceName = camelCase(
            service.channelPrefix.split(":").pop() || ""
          );

          // Add service nested object
          code += `    ${serviceName}: {\n`;

          for (const method of service.methods) {
            const methodName = camelCase(method.name);
            const params = this.generateMethodParams(method.parameters || []);
            const returnType = method.returnType || "any";

            code += `      ${methodName}: ${params} => Promise<${returnType}>;\n`;
          }

          code += `    };\n`;
        }
      }

      code += `  };\n`;
    }

    // Add standalone service-based interfaces (those without a parent module)
    const rootServices = servicesByParent.get("root") || [];
    for (const service of rootServices) {
      // Camelize the channel prefix
      const camelizedPrefix = camelCase(service.channelPrefix);
      code += `  ${camelizedPrefix}: {\n`;

      for (const method of service.methods) {
        const methodName = camelCase(method.name);
        const params = this.generateMethodParams(method.parameters || []);
        code += `    ${methodName}: ${params} => Promise<${method.returnType}>;\n`;
      }

      code += `  };\n`;
    }

    code += `}\n\n`;

    // Generate implementations for module-based APIs
    for (const [moduleName, methods] of moduleGroups.entries()) {
      // Skip if no methods
      if (methods.length === 0) continue;

      // Get channel prefix from first method
      const channelPrefix = methods[0].channel.split(":")[0];
      // Camelize the channel prefix for variable names
      const camelizedPrefix = camelCase(channelPrefix);

      code += `// ${moduleName} API\n`;
      code += `export const ${capitalize(camelizedPrefix)}API = {\n`;

      // Main module methods
      for (const method of methods) {
        const methodName = camelCase(method.name);
        const channel = method.channel;
        const params = this.generateMethodParams(
          method.metadata.parameters || []
        );
        const paramNames = this.extractParamNames(
          method.metadata.parameters || []
        );

        code += `  ${methodName}: ${params} => `;
        code += `ipcRenderer.invoke('${channel}'${paramNames.length > 0 ? ", " + paramNames.join(", ") : ""})`;
        code += `,\n`;
      }

      // Add nested service implementations if this module has any services
      const moduleServices = servicesByParent.get(camelizedPrefix) || [];
      if (moduleServices.length > 0) {
        for (const service of moduleServices) {
          // Get service name (namespace)
          const serviceName = camelCase(
            service.channelPrefix.split(":").pop() || ""
          );

          // Add nested service object
          code += `  ${serviceName}: {\n`;

          for (const method of service.methods) {
            const methodName = camelCase(method.name);
            // Build the full channel name: parentModule:servicePrefix:methodName
            const channel = `${service.parentModule}:${service.channelPrefix}:${methodName}`;
            const params = this.generateMethodParams(method.parameters || []);
            const paramNames = this.extractParamNames(method.parameters || []);

            code += `    ${methodName}: ${params} => `;
            code += `ipcRenderer.invoke('${channel}'${paramNames.length > 0 ? ", " + paramNames.join(", ") : ""})`;
            code += `,\n`;
          }

          code += `  },\n`;
        }
      }

      code += `};\n\n`;
    }

    // Generate implementations for standalone service-based APIs (those without a parent)
    for (const service of rootServices) {
      // Camelize the channel prefix for variable names
      const camelizedPrefix = camelCase(service.channelPrefix);

      code += `// ${service.name} API\n`;
      code += `export const ${capitalize(camelizedPrefix)}API = {\n`;

      for (const method of service.methods) {
        const methodName = camelCase(method.name);
        const channel = `${service.channelPrefix}:${methodName}`;
        const params = this.generateMethodParams(method.parameters || []);
        const paramNames = this.extractParamNames(method.parameters || []);

        code += `  ${methodName}: ${params} => `;
        code += `ipcRenderer.invoke('${channel}'${paramNames.length > 0 ? ", " + paramNames.join(", ") : ""})`;
        code += `,\n`;
      }

      code += `};\n\n`;
    }

    // Create the directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputPath, code);
    logger.info(`Generated preload API at ${outputPath}`);
  }

  /**
   * Generate TypeScript method parameters
   */
  private static generateMethodParams(
    params: Array<{
      name: string;
      type: string;
      required?: boolean;
    }>
  ): string {
    if (params.length === 0) {
      return "()";
    }

    const paramStrings = params.map(
      (p) => `${p.name}${p.required === false ? "?" : ""}: ${p.type}`
    );

    return `(${paramStrings.join(", ")})`;
  }

  /**
   * Extract just the parameter names for the implementation
   */
  private static extractParamNames(params: Array<{ name: string }>): string[] {
    return params.map((p) => p.name);
  }
}

export default PreloadApiGenerator;

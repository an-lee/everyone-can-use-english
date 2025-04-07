import { ipcRegistry } from "@main/ipc/core";
import fs from "fs";
import path from "path";
import { log } from "@main/core";

const logger = log.scope("PreloadGenerator");

/**
 * Metadata about an IPC service handler
 */
export interface ServiceHandlerMetadata {
  name: string;
  channelPrefix: string;
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
    this.serviceHandlers.push(metadata);
    logger.info(`Registered service handler metadata for: ${metadata.name}`);
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

    let code = `// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on ${new Date().toISOString()}
import { ipcRenderer } from 'electron';

`;

    // Generate the main interface
    code += `export interface EnjoyAPI {\n`;

    // Add module-based interfaces
    for (const [moduleName, methods] of moduleGroups.entries()) {
      // Skip if no methods
      if (methods.length === 0) continue;

      // Get channel prefix from first method
      const channelPrefix = methods[0].channel.split(":")[0];

      code += `  ${channelPrefix}: {\n`;

      for (const method of methods) {
        const methodName = method.name;
        const params = this.generateMethodParams(
          method.metadata.parameters || []
        );
        const returnType = method.metadata.returns?.type || "any";

        code += `    ${methodName}: ${params} => Promise<${returnType}>;\n`;
      }

      code += `  };\n`;
    }

    // Add service-based interfaces
    for (const service of this.serviceHandlers) {
      code += `  ${service.channelPrefix}: {\n`;

      for (const method of service.methods) {
        const params = this.generateMethodParams(method.parameters || []);
        code += `    ${method.name}: ${params} => Promise<${method.returnType}>;\n`;
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

      code += `// ${moduleName} API\n`;
      code += `export const ${this.capitalize(channelPrefix)}API = {\n`;

      for (const method of methods) {
        const methodName = method.name;
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

      code += `};\n\n`;
    }

    // Generate implementations for service-based APIs
    for (const service of this.serviceHandlers) {
      code += `// ${service.name} API\n`;
      code += `export const ${this.capitalize(service.channelPrefix)}API = {\n`;

      for (const method of service.methods) {
        const methodName = method.name;
        const channel = `db:${service.channelPrefix}${this.capitalize(methodName)}`;
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

  /**
   * Capitalize the first letter of a string
   */
  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default PreloadApiGenerator;

# Enjoy Plugin System

This document explains how to create and use plugins for the Enjoy application.

## Plugin Types

Enjoy supports two types of plugins:

1. **Built-in Plugins**: These are developed as part of the application codebase using TypeScript and bundled during build.
2. **Third-party Plugins**: These are written in JavaScript and installed by users at runtime.

## Plugin Structure

A valid plugin must have the following structure:

```
my-plugin/
├── manifest.json     # Plugin metadata
├── index.js          # Main plugin entry point (for third-party plugins)
└── ... (other files)
```

### Manifest Format

The `manifest.json` file must include:

```json
{
  "id": "unique-plugin-id",
  "name": "My Plugin",
  "version": "1.0.0",
  "main": "index.js",
  "description": "Description of the plugin",
  "author": "Author Name",
  "engines": {
    "app": ">=1.0.0"
  },
  "contributes": {
    "commands": [
      {
        "id": "myCommand",
        "title": "My Command"
      }
    ],
    "menus": {
      "mainMenu": [
        {
          "id": "myPlugin",
          "command": "myCommand"
        }
      ]
    }
  }
}
```

## Creating a Third-Party Plugin

Third-party plugins are loaded at runtime using ES modules. These plugins don't need to be compiled as part of the application build.

### Plugin Entry Point Formats

You can structure your plugin in several ways:

#### 1. Object-based Plugin

```javascript
export default {
  async activate(context) {
    // Initialize plugin
    
    // Register commands
    context.registerCommand("myCommand", () => {
      console.log("Command executed!");
    });
    
    // Optional: return cleanup function
    return {
      async deactivate() {
        // Cleanup resources
      }
    };
  }
};
```

#### 2. Function-based Plugin (Factory Pattern)

```javascript
export default function createPlugin(manifest, isBuiltIn) {
  return {
    async activate(context) {
      // Initialize plugin
      
      // Register commands
      context.registerCommand("myCommand", () => {
        console.log("Command executed!");
      });
    },
    
    async deactivate() {
      // Cleanup resources
    }
  };
}
```

### Plugin API

Plugins have access to various APIs through the plugin context:

- `context.registerCommand(id, callback)`: Register a command
- `context.registerView(id, component)`: Register a UI view
- `context.subscribe(event, callback)`: Subscribe to events
- `context.publish(event, ...args)`: Publish events
- `context.registerInitPhase(phase)`: Register an initialization phase
- `context.waitForPhase(phaseId)`: Wait for an initialization phase to complete
- `context.getStoragePath()`: Get the plugin's storage directory

## Installing Third-Party Plugins

To install a third-party plugin:

1. Create a folder with your plugin name in:
   - Windows: `%APPDATA%\enjoy-next\plugins\`
   - macOS: `~/Library/Application Support/enjoy-next/plugins/`
   - Linux: `~/.config/enjoy-next/plugins/`
2. Add your plugin files to this folder (at minimum, manifest.json and index.js)
3. Restart the application

## Developing Built-in Plugins

Built-in plugins are developed within the application codebase using TypeScript and compiled during the build process.

### Creating a Built-in Plugin

1. Create a new directory in `src/plugins/` for your plugin
2. Create a `manifest.json` file with plugin metadata
3. Create an `index.ts` file with your plugin implementation
4. Create a `plugin-deps.ts` file to bundle plugin dependencies

### Built-in Plugin Structure

A built-in plugin should have the following structure:

```
src/plugins/my-plugin/
├── manifest.json     # Plugin metadata
├── index.ts          # Main plugin implementation
├── plugin-deps.ts    # Plugin dependencies (re-exports)
└── ... (other files)
```

### Class-based Plugin Implementation

For built-in plugins, the recommended approach is to extend the `BasePlugin` class:

```typescript
import { dialog } from "electron";
import { log } from "@main/core/utils";
import { BasePlugin, PluginLifecycle } from "./plugin-deps";

export default class MyPlugin extends BasePlugin {
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }

  async load(context: PluginContext): Promise<void> {
    // Call parent method first to get context set up
    await super.load(context);
    
    // Your setup code
    log.scope("my-plugin").info("Plugin loaded");
  }

  async activate(): Promise<void> {
    // Call parent activate method
    await super.activate();
    
    // Register commands
    this.context.registerCommand("myCommand", () => {
      console.log("Command executed!");
    });
    
    log.scope("my-plugin").info("Plugin activated");
  }

  async deactivate(): Promise<void> {
    // Clean up resources
    log.scope("my-plugin").info("Plugin deactivating");
    
    // Call parent deactivate method
    await super.deactivate();
  }
}
```

### Plugin Dependencies File

To ensure all necessary dependencies are properly bundled for your plugin, create a `plugin-deps.ts` file:

```typescript
/**
 * This file bundles all needed plugin dependencies
 * This helps ensure that dependencies are included in the plugin build
 */
export { PluginLifecycle } from "@main/plugin/plugin-types";
export { BasePlugin } from "@main/plugin/core/base-plugin";

// Re-export types to make them available to the plugin
export interface IPluginDeps {
  PluginLifecycle: typeof import("@main/plugin/plugin-types").PluginLifecycle;
  BasePlugin: typeof import("@main/plugin/core/base-plugin").BasePlugin;
}
```

## Plugin Lifecycle

Plugins go through the following lifecycle:

1. **Discovery**: Plugins are discovered in the built-in and user plugin directories
2. **Loading**: The manifest is read and the main module is loaded
3. **Initialization**: For class-based plugins, the `load(context)` method is called
4. **Activation**: The plugin's `activate()` method is called
5. **Active**: Plugin is running and can interact with the application
6. **Deactivation**: Plugin's `deactivate()` method is called for cleanup
7. **Unloaded**: Plugin resources are released

## Build Process

The build system automatically transpiles built-in TypeScript plugins to JavaScript. Each plugin in the `src/plugins/` directory is built as a separate entry point:

1. Vite identifies all directories in `src/plugins/`
2. For each plugin, it creates entry points for `index.ts` and `plugin-deps.ts`
3. The build output preserves the directory structure in `.vite/build/plugins/`
4. At runtime, the plugin manager loads these compiled JS files

## Plugin Manager Implementation

The plugin manager handles the loading and lifecycle of both built-in and third-party plugins:

1. **Path Resolution**:
   - Built-in plugins: `.vite/build/plugins/` directory in the app package
   - Third-party plugins: `plugins/` directory in the user data folder

2. **Plugin Loading**:
   - Discovers plugin directories
   - Reads manifest files
   - Dynamically imports plugin modules using ES module imports

3. **Plugin Registration**:
   - Handles different export formats (class, object, factory function)
   - Creates plugin context for each plugin
   - Manages plugin lifecycle state

## Best Practices

When developing plugins:

1. **Use the Correct Pattern**:
   - For built-in plugins: Use class inheritance with `BasePlugin`
   - For third-party plugins: Use the object or factory pattern

2. **Bundle Dependencies**:
   - Always create a `plugin-deps.ts` file for built-in plugins
   - Import from this file in your plugin to ensure dependencies are included

3. **Proper Cleanup**:
   - Always implement proper cleanup in the `deactivate` method
   - Unsubscribe from events, release resources, and clear timers

4. **Error Handling**:
   - Catch and log errors in your plugin methods
   - Don't let exceptions bubble up to the plugin manager

5. **Versioning**:
   - Use semantic versioning for your plugins
   - Specify the required application version in the `engines` field

## Example Plugins

See the example plugins in the `example-plugins/` directory for complete working examples.

## Troubleshooting

Common issues and solutions:

### Built-in Plugin Issues

- **"X is not defined" errors**: Ensure you're importing all dependencies via `plugin-deps.ts`
- **Plugin not loading**: Check that your plugin directory structure matches the expected format
- **Circular dependencies**: Avoid circular imports in your plugin code

### Third-party Plugin Issues

- **Plugin not found**: Ensure it's in the correct user plugins directory
- **Import errors**: Third-party plugins must use ES module syntax (export default)
- **Context errors**: Only use API methods provided by the plugin context

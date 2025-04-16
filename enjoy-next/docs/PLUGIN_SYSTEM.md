# Plugin System

This document provides a detailed overview of the plugin system architecture in the Electron application.

## Overview

The plugin system provides extensibility to the application by allowing third-party code to integrate with the core application. Plugins can enhance functionality, add new features, or modify existing behavior without requiring changes to the core codebase.

## Plugin Architecture

The plugin system is built around these core components:

### Plugin Manager

The plugin manager (located in `src/main/plugin/manager`) is responsible for:

- Loading built-in and user plugins
- Managing the plugin lifecycle (loading, activation, deactivation)
- Providing access to plugin metadata and state
- Cleaning up plugin resources when deactivated

### Plugin Core

The core plugin functionality (located in `src/main/plugin/core`) provides:

- Plugin context creation and management
- Plugin API implementation
- Event handling for plugins
- Resource management for plugins

### Plugin Types

The `types.ts` file defines the interfaces and types used throughout the plugin system:

- Plugin manifest format
- Plugin lifecycle hooks
- Plugin context interface
- Plugin event types

### Plugin Context

Each plugin is provided with a `PluginContext` that:

- Provides APIs for interacting with the application
- Manages plugin-specific resources
- Ensures proper isolation between plugins
- Handles plugin initialization and cleanup

### Plugin Observables

The system uses RxJS observables to broadcast plugin events:

- Plugin loaded
- Plugin activated
- Plugin deactivated
- Plugin error states
- Configuration changes

### Initialization Phase Integration

Plugins can participate in the application's initialization process through the phase system:

- Plugins use the `PluginPhaseAdapter` to interact with the core phase registry
- Phase IDs are automatically namespaced with the plugin ID
- Plugin-provided phases are properly cleaned up when a plugin is deactivated
- Dependencies between phases ensure correct execution order

## Plugin Lifecycle

Plugins go through the following lifecycle states:

1. **Discovery**: Plugins are discovered in the built-in and user plugin directories
2. **Loading**: Plugin manifest is read and the main module is loaded
3. **Activation**: Plugin's `activate` function is called with the plugin context
4. **Active**: Plugin is running and can interact with the application
5. **Deactivation**: Plugin's `deactivate` function is called for cleanup
6. **Unloaded**: Plugin resources are released

## Plugin Structure

A valid plugin must have the following structure:

```
my-plugin/
├── manifest.json     # Plugin metadata
├── main.js           # Main plugin entry point
└── ... (other files)
```

### Manifest Format

The `manifest.json` file must include:

```json
{
  "id": "unique-plugin-id",
  "name": "My Plugin",
  "version": "1.0.0",
  "main": "main.js",
  "description": "Description of the plugin",
  "author": "Author Name",
  "engines": {
    "app": ">=1.0.0"
  },
  "dependencies": {
    "other-plugin-id": ">=1.0.0"
  }
}
```

### Plugin Entry Point

The main file must export a default object with at least an `activate` function:

```typescript
export default {
  /**
   * Called when the plugin is activated
   * @param context The plugin context
   * @returns Optional object with deactivate function
   */
  async activate(context) {
    // Initialize plugin
    
    // Optional: return cleanup function
    return {
      async deactivate() {
        // Cleanup resources
      }
    };
  }
};
```

## Plugin API

Plugins have access to various APIs through the plugin context:

### Configuration

- `context.config.get(key)`: Get plugin configuration
- `context.config.set(key, value)`: Set plugin configuration

### Events

- `context.events.on(eventName, handler)`: Subscribe to events
- `context.events.emit(eventName, data)`: Emit events

### Application Interaction

- `context.app.getPath(pathType)`: Get application paths
- `context.app.getVersion()`: Get application version

### Window Management

- `context.windows.getAll()`: Get all open windows
- `context.windows.getMain()`: Get main window
- `context.windows.create(options)`: Create a new window

### API Extension

- `context.registerApi(name, implementation)`: Register API for renderer process
- `context.registerCommand(name, callback)`: Register a command

### Initialization Integration

- `context.registerInitPhase(phase)`: Register a custom initialization phase
- `context.unregisterInitPhase(phaseId)`: Unregister a previously registered phase
- `context.getInitPhases()`: Get all registered initialization phases
- `context.waitForPhase(phaseId, timeoutMs)`: Wait for a specific phase to complete

## Plugin Development

### Creating a Plugin

1. Create a new directory in `plugins/`
2. Create a `manifest.json` file with plugin metadata
3. Create a main file with the plugin implementation
4. Export an object with `activate` function

### Development Workflow

1. Place your plugin in the user plugins directory:
   - Windows: `%APPDATA%/your-app-name/plugins/`
   - macOS: `~/Library/Application Support/your-app-name/plugins/`
   - Linux: `~/.config/your-app-name/plugins/`

2. Develop and test your plugin
3. Package your plugin for distribution

### Debugging Plugins

Plugins can be debugged by:

- Checking logs in the DevTools console
- Using the `context.logger` for plugin-specific logging
- Inspecting plugin state through application debug tools

## Built-in Plugins

The application comes with several built-in plugins that provide core functionality:

- Located in `src/plugins/`
- Loaded before user plugins
- Cannot be disabled by users
- May provide extension points for other plugins

## Security Considerations

The plugin system includes several security measures:

- Plugins run in the main process and have access to Node.js APIs
- User plugins should be validated before installation
- Plugin APIs are designed to provide controlled access to system resources
- Plugin sandboxing may be implemented in future versions

## Best Practices

When developing plugins:

1. **Minimal Activation**: Keep your `activate` function small and fast
2. **Proper Cleanup**: Always clean up resources in the `deactivate` function
3. **Error Handling**: Handle errors gracefully to prevent plugin crashes
4. **Configuration**: Use the configuration API for storing plugin settings
5. **Event-Driven**: Use events for communication with other plugins
6. **Type Safety**: Use TypeScript for better type checking
7. **Documentation**: Document your plugin API and extension points
8. **Phase Dependencies**: When registering initialization phases, declare proper dependencies
9. **Namespacing**: Use plugin-specific namespaces for events and configuration keys

## Integration with Application Initialization

Plugins can integrate with the application initialization process:

```typescript
export default {
  async activate(context) {
    // Register an initialization phase
    context.registerInitPhase({
      name: "My Plugin Setup",
      description: "Sets up my plugin's functionality",
      dependencies: ["database", "plugins_activation"], // Depends on core phases
      execute: async () => {
        // Phase execution code
        await setupMyPlugin();
      }
    });
    
    // Wait for a specific phase to complete before doing something
    context.waitForPhase("app_ready").then(() => {
      // Do something when the app is fully ready
    });
  }
};
```

## Plugin Distribution

Plugins can be distributed as:

- ZIP archives containing the plugin directory
- NPM packages with a specific structure
- Repositories that can be cloned into the plugins directory

## Executing Plugin Commands

Commands registered by plugins can be executed in various ways:

### From the Main Process

In the main Electron process, you can execute plugin commands using the exported function from the plugin context:

```typescript
import { executeCommand } from "src/main/plugin/core/plugin-context";

// Execute a command by its full ID (format: pluginId.commandName)
await executeCommand("my-plugin.myCommand", ...args);
```

The command ID follows the pattern `pluginId.commandName`, where:

- `pluginId` is the unique ID of the plugin (from manifest.json)
- `commandName` is the ID provided when registering the command

### From the Renderer Process

In the renderer process, you can execute plugin commands through the IPC bridge:

```typescript
// Using the exposed API in the renderer
window.EnjoyAPI.plugin.executeCommand("my-plugin.myCommand", ...args);
```

The Enjoy API is exposed to the renderer process via the preload script and provides access to plugin functionality.

### Command Execution Flow

When a command is executed:

1. The command is looked up in the registered commands registry
2. The associated callback function is invoked with any provided arguments
3. The result is returned to the caller
4. A `command:executed` event is emitted that can be listened for

### Example Usage

```typescript
// In a plugin's activate function
context.registerCommand("greet", (name) => {
  return `Hello, ${name}!`;
});

// From the main process
const greeting = await executeCommand("my-plugin.greet", "World");
console.log(greeting); // Outputs: "Hello, World!"

// From the renderer process
const greeting = await window.EnjoyAPI.plugin.executeCommand("my-plugin.greet", "World");
console.log(greeting); // Outputs: "Hello, World!"
```

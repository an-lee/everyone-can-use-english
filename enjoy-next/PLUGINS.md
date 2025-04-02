# Plugin System Architecture

## Overview

The plugin system is designed to extend the functionality of the Enjoy application. It allows both built-in and user-installed plugins to add features, commands, views, and more to the application.

## Architecture

The plugin system consists of several key components:

### 1. Plugin Manager

Located at `src/main/core/plugin-manager.ts`, the Plugin Manager is responsible for:

- Loading built-in plugins from the application's source directory
- Loading user plugins from the user data directory
- Activating and deactivating plugins
- Managing the plugin lifecycle

### 2. Plugin Types

Located at `src/main/core/plugin-types.ts`, this file defines the interfaces and types used by the plugin system:

- `PluginLifecycle`: Enum representing the possible states of a plugin (unloaded, loaded, active, error)
- `PluginManifest`: Interface describing the plugin's metadata and contributions
- `IPlugin`: Interface that all plugins must implement
- `PluginContext`: Interface providing APIs for plugins to interact with the application

### 3. Base Plugin

Located at `src/main/core/base-plugin.ts`, the Base Plugin class implements the `IPlugin` interface and provides common functionality for all plugins, such as:

- Configuration storage and retrieval
- Lifecycle management
- Event handling

### 4. Plugin Context

Located at `src/main/core/plugin-context.ts`, the Plugin Context provides APIs for plugins to interact with the application:

- Registering commands
- Registering views
- Publishing and subscribing to events
- Accessing services
- Storage handling

### 5. IPC Handlers

Located at `src/main/core/ipc-handlers.ts`, the IPC Handlers enable communication between the main process and renderer process for plugin-related operations:

- Getting the list of plugins
- Executing plugin commands
- Notifying the renderer of plugin events

## Plugin Structure

A plugin consists of:

1. A `manifest.json` file that describes the plugin and its contributions
2. A main JavaScript/TypeScript file that exports a class extending the `BasePlugin` class
3. Optional additional files for the plugin's functionality

Example manifest.json:

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "version": "1.0.0",
  "description": "A sample plugin that demonstrates the plugin system",
  "author": "Enjoy Developer",
  "main": "index.js",
  "contributes": {
    "commands": [
      {
        "id": "showGreeting",
        "title": "Show Greeting"
      }
    ],
    "menus": {
      "mainMenu": [
        {
          "id": "helloWorld",
          "command": "showGreeting"
        }
      ]
    }
  }
}
```

Example plugin implementation:

```typescript
import { BasePlugin } from '../../main/core/base-plugin';
import { PluginContext, PluginManifest } from '../../main/core/plugin-types';

export default class HelloWorldPlugin extends BasePlugin {
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }
  
  async activate(): Promise<void> {
    await super.activate();
    
    // Register commands
    this.context.registerCommand('showGreeting', () => {
      console.log('Hello from the plugin!');
    });
  }
  
  async deactivate(): Promise<void> {
    await super.deactivate();
  }
}
```

## Plugin Lifecycle

1. **Loading**: The plugin manager discovers and loads plugins during application startup
2. **Activation**: After loading, plugins are activated and can register commands, views, etc.
3. **Use**: Users interact with the plugin through the application
4. **Deactivation**: When the application is closing, plugins are deactivated to clean up resources

## Creating a New Plugin

To create a new plugin:

1. Create a new directory with the plugin's name in either:
   - `src/plugins/` for built-in plugins
   - `%APPDATA%/enjoy-next/plugins/` for user plugins

2. Create a `manifest.json` file in the plugin directory with the required metadata

3. Create the main plugin file (as specified in the manifest) that exports a class extending `BasePlugin`

4. Implement the plugin's functionality using the Plugin Context API

## Renderer Integration

The plugin system integrates with the renderer process through the preload script, which exposes an API for:

- Getting the list of plugins
- Executing plugin commands
- Subscribing to plugin events

Example usage in renderer:

```typescript
// Get all plugins
const plugins = await window.enjoy.plugins.getPlugins();

// Execute a command
await window.enjoy.plugins.executeCommand('hello-world.showGreeting');

// Listen for events
window.enjoy.events.on('plugin:activated', (plugin) => {
  console.log(`Plugin ${plugin.name} activated`);
});
```

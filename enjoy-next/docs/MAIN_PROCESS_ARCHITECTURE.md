# Main Process Architecture

This document explains the architecture of the main process in the Electron application.

## Overview

The main process serves as the central control system for the Electron application, managing core functionalities such as:

1. **Application Configuration**: Managing user settings and application state
2. **Database Management**: Handling data persistence and database connections
3. **IPC Communication**: Facilitating communication between main and renderer processes
4. **Plugin System**: Providing extensibility through a plugin architecture
5. **Storage Services**: Managing data models and business logic

## Core Components

### AppConfig

The `AppConfig` module manages application-wide configuration using an observable pattern:

- **Storage**: Uses `electron-store` for persistent configuration storage
- **Reactive State**: Provides reactive state management through RxJS observables
- **Path Management**: Handles various application paths (library, user data, database, cache)
- **User Management**: Manages user sessions and authentication state

Key features:

- Observable configuration properties that components can subscribe to
- Type-safe configuration access with TypeScript generics
- Path resolution for user-specific data

### Database Management

The database module provides a robust connection management system with:

- **Connection Management**: Handles connections with retry logic and timeout protection
- **State Broadcasting**: Notifies all renderer processes of database state changes
- **Error Handling**: Comprehensive error handling and reporting
- **Session Management**: Tracks database sessions and operations

The system uses TypeORM for database interactions and supports:

- Automatic reconnection with exponential backoff
- Connection state monitoring
- Database path management based on current user

### IPC Architecture

The IPC system follows a modular approach:

- **BaseIpcModule**: Abstract base class for all IPC modules
- **IPC Registry**: Central registry for IPC handlers with metadata support
- **Preload API Generator**: Automatically generates type-safe preload APIs
- **IPC Error Handling**: Standardized error handling for IPC calls

IPC modules are decorated with metadata that enables:

- Automatic documentation generation
- Type validation
- Consistent error handling
- Channel prefix management

### Plugin System

The plugin system provides extensibility through:

- **Plugin Manager**: Loads and manages both built-in and user plugins
- **Plugin Lifecycle**: Handles plugin activation, deactivation, and error states
- **Plugin Context**: Provides APIs for plugins to interact with the application
- **Plugin Observables**: Event system for plugin state changes

Plugins have a standardized structure:

- Manifest file with metadata
- Lifecycle hooks (activate/deactivate)
- Configuration access
- Context-bound API access

## Main Process Initialization Flow

1. **App Configuration**: The AppConfig module is initialized first
2. **Services Initialization**: Core services (Logger, etc.) are started
3. **Database Setup**: Database connections are prepared
4. **IPC Handler Registration**: IPC modules are discovered and registered
5. **Plugin Loading**: Built-in plugins are loaded, followed by user plugins
6. **Window Creation**: The main application window is created
7. **Renderer Process Communication**: IPC channels are established

## Storage System

The storage system uses TypeORM with a service-oriented architecture:

- **Entities**: Data models representing database tables
- **Services**: Business logic for entity operations
- **Repository Pattern**: Abstracts database access
- **IPC Integration**: Entity services are exposed through IPC modules

## Directory Structure

```
src/main/
├── core/                  # Core application modules
│   ├── app-config.ts      # Application configuration
│   └── initializer/       # Application initialization
├── ipc/                   # IPC communication modules
│   ├── modules/           # Individual IPC modules
│   ├── base-ipc-module.ts # Base class for IPC modules
│   ├── ipc-registry.ts    # IPC handler registry
│   └── preload-generator.ts # Preload API generator
├── plugin/                # Plugin system
│   ├── plugin-manager.ts  # Plugin loading and lifecycle
│   ├── plugin-context.ts  # Plugin API context
│   └── plugin-observables.ts # Event system for plugins
├── storage/               # Data storage
│   ├── entities/          # Database entity models
│   └── services/          # Entity services
└── services/              # Application services
    └── logger.ts          # Logging service
```

## Best Practices

When extending the main process:

1. **Follow the Module Pattern**: Create focused modules with clear responsibilities
2. **Use Observables for State**: Use RxJS observables for reactive state management
3. **Provide Type Safety**: Use TypeScript interfaces and types for all APIs
4. **Document with Metadata**: Add descriptive metadata to IPC methods
5. **Standardize Error Handling**: Use the error handling patterns from base modules
6. **Separate Business Logic**: Keep business logic in services, separate from IPC handling
7. **Manage Resources Properly**: Ensure proper cleanup of resources (subscriptions, connections)

## Communication Patterns

The application uses these communication patterns:

1. **IPC for Main-Renderer**: Direct IPC communication with typed channels
2. **Observables for State**: RxJS observables for reactive state management
3. **Events for Plugins**: Event emitters for plugin communication
4. **Database for Persistence**: TypeORM entities for data persistence

## Extension Points

The main process can be extended through:

1. **New IPC Modules**: Adding new IPC modules to expose functionality to renderer
2. **Plugin Development**: Creating plugins that hook into the application lifecycle
3. **Database Entities**: Adding new entity models and services
4. **Configuration Extensions**: Extending the application configuration

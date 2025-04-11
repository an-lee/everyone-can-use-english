# Enjoy Next - Plugin-based Electron Application

## Architecture Overview

This application is built as an Electron-based desktop application with a plugin-based architecture that uses reactive programming principles for state management, event handling, and initialization.

## Core Components

### Initialization System

The application uses a phased initialization system that allows for orderly startup with dependency management:

- **Phase Registry**: Manages dependency-ordered initialization phases
- **Observable Initialization**: Uses RxJS for reactive state updates during startup
- **Initialization Hooks**: Allows plugins to register callbacks at various points in the startup process
- **Timeout Handling**: Provides resilience with configurable timeouts for phases

### Plugin System

The plugin architecture allows for modular extension of application functionality:

- **Plugin Manager**: Handles loading and lifecycle management of plugins
- **Plugin Context**: Provides a controlled API surface for plugins
- **Observable-based Events**: Uses RxJS for reactive communication between plugins and the core app
- **Resource Management**: Ensures proper cleanup when plugins are deactivated

### Event Sourcing

All state changes in the application follow an event-sourcing pattern:

- **Event Buses**: Centralized event streams for application state changes
- **Type-safe Events**: All events are properly typed with TypeScript
- **Observable State**: Application state is derived from event streams
- **Reactive UI**: Components react to state changes through observable subscriptions

### IPC Bridge

Communication between the main and renderer processes is handled through:

- **IPC Handlers**: Type-safe message passing between processes
- **Command Execution**: Allows renderer to execute commands registered in main process
- **Window Management**: Controls for window state and lifecycle

## Data Flow

1. **Application Startup**:
   - App initializes phase registry
   - Core phases register (config, database, plugin system)
   - Plugins register their own phases
   - Phases execute in dependency order

2. **Plugin Activation**:
   - Plugin manager loads built-in and user plugins
   - Plugins receive context with controlled API
   - Plugins register commands, views, and services
   - Observables notify components of new capabilities

3. **User Interaction**:
   - UI dispatches commands through IPC
   - Plugin manager executes commands
   - Events are emitted on observable streams
   - Components react to state changes

4. **Shutdown**:
   - Plugins are deactivated in reverse order
   - Resources are cleaned up through subscription disposal
   - Database connections are closed
   - Application terminates

## Plugin Development

Plugins can:

- Register initialization phases
- Add hooks to existing phases
- Register commands that can be executed from the UI
- Register views that can be displayed in the application
- Define and consume services
- Subscribe to application events
- Wait for specific phases to complete

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **TypeScript**: Type-safe development
- **RxJS**: Reactive state management
- **React**: UI components (in renderer process)
- **Zustand**: State management for UI

## Architecture Benefits

- **Decoupled Components**: The observable pattern enables loose coupling
- **Type Safety**: TypeScript interfaces ensure correct usage
- **Extensibility**: Plugin system allows modular functionality
- **Testability**: Observable streams can be easily tested
- **Resilience**: Error handling and timeouts ensure stability

## Recent Improvements

### Migration to Observable Architecture

The codebase recently underwent a significant refactoring:

1. **EventEmitter to RxJS**: Replaced Node.js EventEmitter with RxJS Observables
   - Stronger typing of events and handlers
   - Better operator support for filtering, combining, and transforming events
   - Improved memory management with subscription cleanup

2. **Unified Event System**:
   - Consolidated multiple event mechanisms into a single Observable-based system
   - Removed duplicate event systems (`init-events.ts` → `init-observables.ts`)
   - Standardized event format and handling across the application

3. **Enhanced Plugin Architecture**:
   - Observable-based plugin state management
   - Reactive communication between plugins
   - Standardized resource cleanup

4. **Improved Error Handling**:
   - Better propagation of errors through observable chains
   - More consistent timeout handling
   - Enhanced recovery mechanisms

## Database Migrations

This project uses TypeORM for database management. To create a new migration:

```bash
node src/main/scripts/create-migration.mjs MyMigrationName
```

This will:

1. Create a timestamped migration file in `src/main/storage/migrations/`
2. Update `data-source.ts` to include the new migration
3. Set up the proper class structure for TypeORM to recognize the migration

After creating a migration, edit the generated file to implement your database changes in the `up` method and the rollback logic in the `down` method.

Migrations will run automatically when:

1. A new database is created
2. The `migrate()` method is called on the database manager

Example migration implementation:

```typescript
// Creating a new table
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(
    new Table({
      name: "users",
      columns: [
        new TableColumn({
          name: "id",
          type: "uuid",
          isPrimary: true,
          isGenerated: true,
          generationStrategy: "uuid",
        }),
        new TableColumn({
          name: "email",
          type: "varchar",
          isUnique: true,
        }),
        // Add more columns as needed
      ],
    })
  );
}

// Reverting changes
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.dropTable("users");
}
```

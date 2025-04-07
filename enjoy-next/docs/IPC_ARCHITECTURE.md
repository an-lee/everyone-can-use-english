# IPC Architecture

This directory contains the architecture for handling IPC (Inter-Process Communication) between the main and renderer processes in Electron.

## Overview

The IPC architecture follows these principles:

1. **Explicit Registration**: IPC modules are explicitly imported and registered
2. **Standardization**: Common patterns for defining handlers with metadata
3. **Type Safety**: Strong TypeScript typing throughout the pipeline
4. **Error Handling**: Consistent error handling across all IPC calls
5. **Documentation**: Self-documenting API through metadata
6. **Separation of Concerns**: Business logic in services, IPC handling in modules

## Components

### BaseIpcModule

The `BaseIpcModule` is the foundation for all IPC modules. It provides:

- Registration of methods as IPC handlers
- Automatic prefix handling for channel names
- Enhanced error handling
- Metadata collection

Example:

```typescript
import { BaseIpcModule, IpcMethod } from "@main/ipc/base-ipc-module";

export class MyIpcModule extends BaseIpcModule {
  constructor() {
    super("MyModule", "myPrefix");
  }

  @IpcMethod({
    description: "Does something awesome",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The ID to process",
        required: true
      }
    ],
    returns: {
      type: "boolean",
      description: "Success status"
    }
  })
  async doSomething(_event: any, id: string): Promise<boolean> {
    // Implementation
    return true;
  }
}
```

### IPC Registry

The `IpcRegistry` manages all IPC modules:

- Registers IPC modules and their methods
- Provides central access to all registered handlers
- Exposes metadata for documentation and type generation

### Preload API Manager & Generator

The system includes components to create TypeScript interfaces and implementations for the preload API:

- `PreloadApiManager`: Manages preload API registration and lifecycle
  - Initializes the API generation system
  - Determines where to output the generated files
  - Maintains development vs production environment differences
  - Handles cleanup when the application is shutting down

- `PreloadApiGenerator`: Generates type-safe preload API interfaces and implementations
  - Collects metadata from IPC modules and service handlers
  - Generates TypeScript interfaces and implementation code
  - Supports both decorator-based and service-based API registration
  - Creates API that is accessible in the renderer process

The generation process works as follows:

1. The `PreloadApiManager` initializes the system and calls `generatePreloadApi()`
2. The `PreloadApiGenerator` collects all registered metadata from:
   - IPC modules through the registry (decorator-based)
   - Explicitly registered service handlers (service-based)
3. The generator creates TypeScript code with:
   - The main `EnjoyAPI` interface with all modules and methods
   - Individual module-specific API objects
   - Implementation code that maps to IPC channels
4. The generated code is written to both:
   - The user data directory for runtime use
   - The source code directory for development and type checking (in development mode)

Example of generated preload API:

```typescript
// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2023-04-07T10:08:00.000Z
import { ipcRenderer } from 'electron';

export interface EnjoyAPI {
  app: {
    getConfig: () => Promise<AppConfig>;
    updateConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
  };
  
  db: {
    connect: () => Promise<DbState>;
    disconnect: () => Promise<DbState>;
    backup: () => Promise<{ state: "backup-completed" }>;
    status: () => Promise<DbState>;
  };
  
  // Service-based entity handlers
  bookmark: {
    findAll: (options?: { page?: number; limit?: number }) => Promise<PaginatedResult<Bookmark>>;
    findById: (id: string) => Promise<Bookmark>;
    create: (data: BookmarkCreateDto) => Promise<Bookmark>;
    update: (id: string, data: Partial<BookmarkUpdateDto>) => Promise<Bookmark>;
    delete: (id: string) => Promise<boolean>;
  };
}

// App API
export const AppAPI = {
  getConfig: () => ipcRenderer.invoke('app:getConfig'),
  updateConfig: (config) => ipcRenderer.invoke('app:updateConfig', config),
};

// Database API
export const DbAPI = {
  connect: () => ipcRenderer.invoke('db:connect'),
  disconnect: () => ipcRenderer.invoke('db:disconnect'),
  backup: () => ipcRenderer.invoke('db:backup'),
  status: () => ipcRenderer.invoke('db:status'),
};

// Bookmark API
export const BookmarkAPI = {
  findAll: (options) => ipcRenderer.invoke('db:bookmarkFindAll', options),
  findById: (id) => ipcRenderer.invoke('db:bookmarkFindById', id),
  create: (data) => ipcRenderer.invoke('db:bookmarkCreate', data),
  update: (id, data) => ipcRenderer.invoke('db:bookmarkUpdate', id, data),
  delete: (id) => ipcRenderer.invoke('db:bookmarkDelete', id),
};
```

### Error Handling

The `IpcErrorHandler` provides standardized error handling:

- Common error response format
- Consistent logging
- Ability to wrap handlers with error handling

### Service Handler Factory

The `createIpcHandlers` utility converts service objects to IPC handlers:

- Separates business logic (services) from IPC handling
- Automatically generates metadata for preload API generation
- Provides standardized error handling
- Maintains consistent channel naming conventions

Example usage of `createIpcHandlers`:

```typescript
// Register a service with the IPC system
function registerBookmarkService() {
  const { BookmarkService } = await import("@main/storage/services/bookmark-service");
  
  // Create IPC handlers from the service
  const handlers = createIpcHandlers("Bookmark", BookmarkService, "bookmark");
  
  // Register each handler with the IPC system
  for (const [methodName, handler] of Object.entries(handlers)) {
    const channel = `db:bookmark${capitalize(methodName)}`;
    ipcMain.handle(channel, handler);
    registeredEntityHandlers.add(channel);
  }
}
```

This automatically:

1. Creates IPC handlers for each method in the BookmarkService
2. Registers metadata with the PreloadApiGenerator
3. Formats channels as `db:bookmark{MethodName}`
4. Adds standardized error handling for all methods

### Database Entity Handlers

The architecture includes special handling for database entity-specific IPC modules:

- Entity modules can be registered when database is connected
- Entity modules are automatically discovered using the naming pattern `*-entity-ipc.ts`
- Each entity module is registered under the database namespace with method-specific channel names
- Channels format: `db:entityPrefix:MethodName`
- Entity handlers are automatically unregistered when database disconnects

## Implementation Approaches

The architecture supports two main approaches for implementing IPC handlers:

### 1. Decorator-Based Approach

This approach uses the `@IpcMethod` decorator to define metadata directly in IPC modules:

- Good for general-purpose IPC handlers
- More control over metadata
- Direct implementation in the module class

### 2. Service-Based Approach

This approach keeps business logic in service classes and generates IPC handlers:

- Better separation of concerns (business logic vs IPC)
- Ideal for database entity handlers
- Reusable services across different contexts
- Uses `createIpcHandlers` to generate handlers with metadata

## Adding a New IPC Module

1. Create a new file in `src/main/ipc/modules` named `your-feature-ipc.ts`
2. Extend `BaseIpcModule` and decorate methods with `@IpcMethod`
3. Export a singleton instance as default
4. Import and add your module to `ipc-handlers.ts` to register it

Example module file:

```typescript
import { BaseIpcModule, IpcMethod } from "@main/ipc/base-ipc-module";

export class MyFeatureIpcModule extends BaseIpcModule {
  constructor() {
    super("MyFeature", "myFeature");
  }

  @IpcMethod({
    description: "Gets data for the feature",
    returns: {
      type: "any[]",
      description: "Feature data"
    }
  })
  async getData(): Promise<any[]> {
    return []; // Your implementation
  }
}

const myFeatureIpcModule = new MyFeatureIpcModule();
export default myFeatureIpcModule;
```

Then update `src/main/core/ipc-handlers.ts`:

```typescript
// Import existing modules
import appConfigIpcModule from "@main/ipc/modules/app-config-ipc";
import appInitializerIpcModule from "@main/ipc/modules/app-initializer-ipc";
// ... other modules ...

// Import your new module
import myFeatureIpcModule from "@main/ipc/modules/your-feature-ipc";

// ... existing setup code ...

export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Register modules
  ipcRegistry.addModule(appConfigIpcModule);
  ipcRegistry.addModule(appInitializerIpcModule);
  // ... other modules ...
  
  // Register your new module
  ipcRegistry.addModule(myFeatureIpcModule);
  
  // ... rest of the function ...
};
```

Also, add your module to the barrel file in `src/main/ipc/modules/index.ts`:

```typescript
// ... existing exports ...
export * from "./your-feature-ipc";
```

## Adding a Database Entity Service

To create an entity service:

1. Create a service in the storage domain (e.g., `src/main/storage/services/your-entity-service.ts`)
2. Use the service-based approach to register it in the DB IPC module

Example of an entity service:

```typescript
// src/main/storage/services/bookmark-service.ts
import { Bookmark } from "@main/storage/entities/bookmark";

export const BookmarkService = {
  /**
   * Find all bookmarks with pagination
   */
  findAll: async (options?: { page?: number; limit?: number }) => {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    
    const [items, total] = await Bookmark.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" }
    });
    
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },
  
  // Other CRUD methods...
};
```

Example of registering the service:

```typescript
// In db-ipc.ts
private async registerBookmarkService(): Promise<void> {
  try {
    const { BookmarkService } = await import("@main/storage/services/bookmark-service");
    this.registerServiceHandlers("Bookmark", BookmarkService, "bookmark");
  } catch (error) {
    this.logger.error("Failed to register Bookmark service:", error);
  }
}
```

## Preload API Usage

The generated preload API can be imported and used in renderer code. The API is exposed through the preload script and available as `window.EnjoyAPI` in the renderer process.

For module-based APIs:

```typescript
// Direct window access
const config = await window.EnjoyAPI.app.getConfig();

// Or using imported API objects (recommended for better type checking)
import { AppAPI } from 'generated/preload-api';

const config = await AppAPI.getConfig();
await AppAPI.updateConfig({ theme: 'dark' });
```

For database entity APIs, which are created using the service-based approach:

```typescript
// Using a database entity API directly
const bookmarks = await window.EnjoyAPI.bookmark.findAll({ page: 1, limit: 10 });

// Or using the imported API objects
import { BookmarkAPI } from 'generated/preload-api';

// Create a new bookmark
const newBookmark = await BookmarkAPI.create({
  title: "Important Link",
  url: "https://example.com",
  tags: ["important", "example"]
});

// Get a bookmark by ID
const bookmark = await BookmarkAPI.findById("some-id");

// Update a bookmark
await BookmarkAPI.update("some-id", { title: "Updated Title" });

// Delete a bookmark
await BookmarkAPI.delete("some-id");
```

The generated API provides full type safety, intellisense support, and consistent error handling across all IPC calls.

## Best Practices

1. **Use Metadata**: Always provide complete metadata for your IPC methods
2. **Error Handling**: Use the errorHandling option in @IpcMethod to control error behavior
3. **Type Safety**: Define proper parameter and return types
4. **Channel Naming**: Use consistent channel naming with your module prefix
5. **Documentation**: Write clear descriptions for methods, parameters, and return values
6. **Separation of Concerns**: Keep business logic in services, IPC handling in modules
7. **Entity Services**: For database entities, use the service-based approach

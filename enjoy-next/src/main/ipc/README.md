# IPC Architecture

This directory contains the architecture for handling IPC (Inter-Process Communication) between the main and renderer processes in Electron.

## Overview

The IPC architecture follows these principles:

1. **Discoverability**: IPC modules are auto-discovered through naming conventions
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

The `IpcRegistry` automatically discovers and manages all IPC modules:

- Auto-discovers modules following the naming convention `*-ipc.ts`
- Registers all methods marked with `@IpcMethod`
- Provides central access to all registered handlers
- Exposes metadata for documentation and type generation

### Preload API Generator

The `PreloadApiGenerator` creates TypeScript interfaces and implementations for the preload API based on the registered IPC modules:

- Generates type-safe preload API interfaces
- Creates the actual implementation code
- Updates when new modules are registered
- Supports both decorator-based and service-based APIs

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

1. Create a new file in `src/main/core/ipc/modules` named `your-feature-ipc.ts`
2. Extend `BaseIpcModule` and decorate methods with `@IpcMethod`
3. Export a singleton instance as default
4. The module will be auto-discovered and registered

Example:

```typescript
import { BaseIpcModule, IpcMethod } from "@main/core/ipc/base-ipc-module";

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

The generated preload API can be imported and used in renderer code:

```typescript
import { MyFeatureAPI } from 'generated/preload-api';

// Use the API
const data = await MyFeatureAPI.getData();
```

For database entity APIs, the channels are prefixed with db:

```typescript
// Using a database entity API
const bookmarks = await window.EnjoyAPI.db.bookmarkFindAll({ page: 1, limit: 10 });
```

## Best Practices

1. **Use Metadata**: Always provide complete metadata for your IPC methods
2. **Error Handling**: Use the errorHandling option in @IpcMethod to control error behavior
3. **Type Safety**: Define proper parameter and return types
4. **Channel Naming**: Use consistent channel naming with your module prefix
5. **Documentation**: Write clear descriptions for methods, parameters, and return values
6. **Separation of Concerns**: Keep business logic in services, IPC handling in modules
7. **Entity Services**: For database entities, use the service-based approach

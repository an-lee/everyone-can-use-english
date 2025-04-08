# IPC Modules Architecture

This directory contains IPC modules used for communication between the main and renderer processes.

## Overview

The IPC architecture follows a modular approach with two main types of modules:

1. **Regular IPC Modules**: General-purpose modules that handle various application functions
2. **Entity IPC Modules**: Specialized modules for database entity operations

## Regular IPC Modules

Regular IPC modules extend the `BaseIpcModule` class and use the `@IpcMethod` decorator to define handlers. These modules handle general application functionality like window management, app configuration, etc.

Example:

```typescript
import { BaseIpcModule, IpcMethod } from "@main/ipc/modules";

export class MyIpcModule extends BaseIpcModule {
  constructor() {
    super("MyModule", "myPrefix");
  }

  @IpcMethod({
    description: "Does something",
    returns: { type: "boolean", description: "Success status" }
  })
  async doSomething(): Promise<boolean> {
    // Implementation
    return true;
  }
}

// Export singleton instance
export const myIpcModule = new MyIpcModule();
```

## Entity IPC Modules

Entity IPC modules extend the `BaseEntityIpcModule` class and are designed to handle database entity operations. Each entity gets its own module, making the system more modular and maintainable.

### Adding a New Entity IPC Module

To add a new entity service IPC module:

1. Create a service class for your entity in `src/main/storage/services/`
2. Create an IPC module for your entity in `src/main/ipc/modules/`
3. Register your module in the necessary files

#### Step 1: Create Service Class

Create a plain service class:

```typescript
// src/main/storage/services/todo-service.ts
import { Todo } from "@main/storage/entities/todo";

// Interface for Todo items
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple Todo service
export class TodoService {
  // Find all todos
  async findAll(options?: { search?: string }): Promise<TodoItem[]> {
    // Implementation
    return Todo.find();
  }
  
  // Find by ID
  async findById(id: string): Promise<TodoItem | null> {
    // Implementation
    return Todo.findOne({ where: { id } });
  }
  
  // Other methods...
}

// Export a singleton instance
export const todoService = new TodoService();
```

#### Step 2: Create Entity IPC Module

Create an entity IPC module for your service with explicit metadata:

```typescript
// src/main/ipc/modules/db-todo-ipc.ts
import { BaseEntityIpcModule } from "./base-entity-ipc";
import { todoService } from "@main/storage/services/todo-service";

export class DbTodoIpcModule extends BaseEntityIpcModule<typeof todoService> {
  constructor() {
    super("Todo", "todo", todoService);
  }

  // Define parameter metadata explicitly
  protected getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> {
    // Define metadata for each method
    const metadataMap: Record<string, Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }>> = {
      findAll: [
        {
          name: "options",
          type: "object",
          required: false,
          description: "Search options"
        }
      ],
      findById: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Todo item ID"
        }
      ],
      // Other methods...
    };

    return metadataMap[methodName] || [];
  }

  // Define return types explicitly
  protected getMethodReturnType(methodName: string): string {
    const returnTypeMap: Record<string, string> = {
      findAll: "Promise<TodoItem[]>",
      findById: "Promise<TodoItem | null>",
      // Other methods...
    };
    
    return returnTypeMap[methodName] || "Promise<any>";
  }
}

// Export singleton instance
export const dbTodoIpcModule = new DbTodoIpcModule();
```

#### Step 3: Register Your Module

1. Add your module to the export in `src/main/ipc/modules/index.ts`:

```typescript
// Export entity IPC modules
export * from "./db-audio-ipc";
export * from "./db-todo-ipc"; // Add this line
```

2. Update the IPC handlers setup in `src/main/ipc/core/ipc-handlers.ts`:

```typescript
// Import entity IPC modules
import {
  dbAudioIpcModule,
  dbTodoIpcModule, // Add this import
} from "@main/ipc/modules";

// In the setupEntityIpcModules function:
const setupEntityIpcModules = async () => {
  // Initialize each entity module
  dbAudioIpcModule.initialize();
  dbTodoIpcModule.initialize(); // Add this line
  
  logger.info("Entity IPC modules setup complete");
};

// In the cleanupIpcHandlers function:
export const cleanupIpcHandlers = () => {
  // Clean up entity modules
  dbAudioIpcModule.dispose();
  dbTodoIpcModule.dispose(); // Add this line
  
  // Clear registry
  ipcRegistry.clear();
};
```

### Benefits of the New Architecture

1. **Simplicity**: No complex decorators or reflection magic
2. **Explicitness**: Metadata is defined directly where it's used
3. **Modularity**: Each entity has its own module, making the system more maintainable
4. **Isolation**: Entity modules are isolated, reducing the risk of bugs affecting the entire system
5. **Type Safety**: Complete parameter and return type information is preserved
6. **Self-documenting**: Metadata is used to generate documentation and type definitions

### Key Files in the Architecture

- `base-ipc-module.ts`: Base class for all IPC modules
- `base-entity-ipc.ts`: Base class for entity IPC modules
- `db-*-ipc.ts`: Individual entity IPC modules
- `ipc-handlers.ts`: Setup and registration of all IPC modules

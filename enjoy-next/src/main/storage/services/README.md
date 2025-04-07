# Service Decorators System

This module provides a set of decorators for creating services with automatic metadata extraction for parameters and return types.

## Usage

### Defining a Service

```typescript
import { Service, ServiceMethod, Param } from "./service-decorators";

// Define your data interfaces
interface User {
  id: string;
  name: string;
  email: string;
}

@Service("Users")
export class UserService {
  
  @ServiceMethod("Find a user by ID")
  async findById(
    @Param({ name: "id", required: true, description: "User ID" })
    id: string
  ): Promise<User | null> {
    // Implementation here
    return null;
  }
  
  @ServiceMethod("Create a new user")
  async create(
    @Param({ name: "data", required: true, description: "User data" })
    data: Omit<User, "id">
  ): Promise<User> {
    // Implementation here
    return {
      id: "new-id",
      ...data
    };
  }
}
```

### Registering with IPC

The decorators automatically provide metadata about your services that can be used by the IPC system. This allows for automatic registration of service methods and generation of type definitions for the renderer process.

```typescript
// In your IPC module
import { ServiceMetadataRegistry } from "./service-decorators";
import { UserService } from "./user-service";

// Get metadata from the registry
const userServiceMetadata = ServiceMetadataRegistry.getInstance().getServiceMetadata(UserService);

// Use metadata to register IPC handlers
if (userServiceMetadata) {
  userServiceMetadata.methods.forEach((methodMetadata, methodName) => {
    // Register IPC handler for this method
    ipcMain.handle(`users:${methodName}`, async (event, ...args) => {
      // Validate arguments based on metadata
      // Call the service method
      // Return the result
    });
  });
}
```

## Benefits

1. **Type Safety**: Decorators capture parameter and return types at design time
2. **Documentation**: Metadata includes descriptions for methods and parameters
3. **Auto-generation**: API definitions for the renderer process can be generated automatically
4. **Validation**: Parameter requirements can be validated based on metadata

## Implementation Details

The system uses TypeScript's experimental decorator metadata to extract type information at runtime. This requires `emitDecoratorMetadata` and `experimentalDecorators` to be enabled in your `tsconfig.json`.

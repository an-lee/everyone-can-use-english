# IPC Handler System

This directory contains the refactored IPC (Inter-Process Communication) handler system for the Enjoy Next application. The goal of this refactoring is to create a more organized, maintainable, and type-safe approach to handling IPC communications between the main and renderer processes.

## Key Components

### 1. IPC Registry (`ipc-registry.ts`)

A centralized registry for all IPC handlers in the application. This provides:

- Single point of registration for all handlers
- Prevention of duplicate handlers
- Ability to track all registered handlers
- Simplified registration and unregistration of handlers

### 2. Base IPC Module (`base-ipc-module.ts`)

A base class for creating IPC modules that encapsulate related functionality:

- Automatic registration of all public methods as IPC handlers
- Consistent naming conventions for IPC channels
- Easy organization of handlers by domain/feature

### 3. IPC Channels (`shared/ipc/ipc-channels.ts`)

A central place to define all IPC channel names as constants:

- Type safety for channel names
- Clear organization of channels by domain
- Shared between main and renderer processes

## How to Create a New IPC Module

1. Create a new file in the `modules` directory for your module
2. Extend the `BaseIpcModule` class
3. Implement your handler methods
4. Create a singleton instance
5. Register your handlers in `ipc-handlers.ts`

Example:

```typescript
import { BaseIpcModule, IpcMethod } from '../base-ipc-module';

export class MyFeatureIpcModule extends BaseIpcModule {
  constructor() {
    super('MyFeature', 'myFeature');
  }
  
  @IpcMethod()
  doSomething(event: IpcMainInvokeEvent, arg1: string): string {
    // Implementation
    return `Did something with ${arg1}`;
  }
}

const myFeatureIpcModule = new MyFeatureIpcModule();
export default myFeatureIpcModule;
```

Then in `ipc-handlers.ts`:

```typescript
import myFeatureIpcModule from './modules/my-feature-ipc';

// In setupIpcHandlers function
myFeatureIpcModule.registerHandlers();
```

## Calling IPC Methods from Renderer

When calling IPC methods from the renderer process, use the constants defined in `IpcChannels`:

```typescript
import { IpcChannels } from '@shared/ipc/ipc-channels';

// In renderer code
const result = await window.electron.ipcRenderer.invoke(
  IpcChannels.MY_FEATURE.DO_SOMETHING, 
  'some argument'
);
```

## Migration Guidelines

When migrating existing IPC handlers to the new system:

1. Create a new IPC module for each logical group of handlers
2. Move the implementation logic from the original handlers to the new module
3. Register the new module in `ipc-handlers.ts`
4. Update the constant in `IpcChannels` if needed
5. Update renderer code to use the constants from `IpcChannels`

## Best Practices

1. Group related functionality in the same module
2. Use descriptive method names
3. Add type annotations for parameters and return values
4. Document complex methods
5. Add methods to the appropriate existing module rather than creating many small modules
6. Keep modules focused on a single area of functionality

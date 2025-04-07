# Database Architecture

This document outlines the database architecture and data persistence strategy in the Electron application.

## Overview

The application uses a robust database system built on TypeORM to provide persistence, querying capabilities, and a consistent data model. The database architecture is designed to:

1. Support multi-user environments with separate database files per user
2. Provide resilient connection management
3. Enable structured access to data through services
4. Expose database functionality to the renderer process through IPC

## Core Components

### Database Module

The central database module (`storage/db.ts`) provides:

- Connection management with retry capability
- Error handling and state reporting
- Database path resolution
- Connection lifecycle hooks
- State broadcasting to renderer processes

### Data Source

The application uses TypeORM's `DataSource` to configure and connect to SQLite databases:

- Configured through `storage/data-source.ts`
- Entity discovery through patterns
- Migration support
- Connection pooling
- Query logging in development

### Entity Models

Entity models located in `storage/entities/` define the database schema using TypeORM decorators:

- Each entity corresponds to a database table
- Relationships between entities are defined explicitly
- Validation rules are applied at the entity level
- Entity lifecycle hooks for pre/post operations

### Services Layer

Each entity has a corresponding service module in `storage/services/` that:

- Provides business logic for entity operations
- Abstracts database access patterns
- Handles complex queries and transactions
- Implements validation and business rules

## Database Lifecycle

The database goes through several states:

1. **Disconnected**: Initial state, no connection established
2. **Connecting**: Connection in progress
3. **Connected**: Active connection to the database
4. **Reconnecting**: Attempting to re-establish connection after failure
5. **Error**: Connection failed
6. **Locked**: Database file is locked by another process

State transitions are broadcast to all renderer processes to maintain UI consistency.

## Connection Strategy

The connection strategy includes:

- **Path Resolution**: Database path is user-specific
- **Automatic Reconnection**: Exponential backoff for connection retries
- **Connection Pooling**: Managed by TypeORM
- **Timeout Protection**: Connections that take too long are aborted
- **Database Ping**: Regular pings maintain connection health
- **Error Recovery**: Systematic approach to recover from common errors

## Multi-User Support

The database architecture supports multiple users:

- Each user gets a separate database file
- Database path is determined from user ID
- User switching triggers database reconnection
- Session management preserves connection context

## Transaction Management

Transactions are managed through:

- Service-level transaction methods
- Entity manager transaction API
- Query runner for fine-grained control
- Automatic rollback on error

## IPC Integration

Database functionality is exposed to the renderer process through:

- Entity-specific IPC modules
- Service handlers that wrap database operations
- Standard error handling across all database operations
- Type-safe API for renderer process consumption

## Schema Evolution

The database architecture supports schema evolution through:

- TypeORM migrations
- Version tracking in database metadata
- Upgrade scripts for major schema changes
- Data validation during upgrades

## Example Service Implementation

A typical entity service follows this pattern:

```typescript
// UserService.ts
export const UserService = {
  async findById(id: number): Promise<User | null> {
    return User.findOne({ where: { id } });
  },

  async create(data: Partial<User>): Promise<User> {
    const user = User.create(data);
    return user.save();
  },

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    
    Object.assign(user, data);
    return user.save();
  },

  async delete(id: number): Promise<boolean> {
    const result = await User.delete(id);
    return result.affected > 0;
  },

  // Complex operations with transactions
  async transferCredits(fromId: number, toId: number, amount: number): Promise<boolean> {
    return db.dataSource.transaction(async manager => {
      const fromUser = await manager.findOne(User, { where: { id: fromId } });
      const toUser = await manager.findOne(User, { where: { id: toId } });
      
      if (!fromUser || !toUser) return false;
      if (fromUser.credits < amount) return false;
      
      fromUser.credits -= amount;
      toUser.credits += amount;
      
      await manager.save(fromUser);
      await manager.save(toUser);
      
      return true;
    });
  }
};
```

## Performance Considerations

The database architecture includes several performance optimizations:

- Indexes on frequently queried fields
- Lazy loading for large relations
- Query result caching
- Connection pooling
- Strategic use of transactions

## Error Handling

Database errors are handled through:

- Standardized error responses
- Retry logic for transient errors
- Detailed logging for diagnostic purposes
- Error broadcasting to renderer processes
- Recovery strategies for common failure modes

## Best Practices

When extending the database:

1. **Use Entity Services**: Keep database logic in service modules
2. **Define Clear Relationships**: Be explicit about entity relationships
3. **Validate Input**: Validate data before writing to the database
4. **Use Transactions**: Wrap related operations in transactions
5. **Handle Errors**: Implement proper error handling
6. **Document Schemas**: Keep entity documentation up-to-date
7. **Use Migrations**: Use migrations for schema changes
8. **Test Database Operations**: Write tests for database operations

## Debugging

Database operations can be debugged through:

- Query logging (enabled in development)
- Database state monitoring in the application
- SQLite database inspection tools
- Application logs with database operation details

## Security Considerations

The database implementation includes security measures:

- Parameter binding to prevent SQL injection
- Access control through the service layer
- Encryption of sensitive data
- File-level permissions on database files

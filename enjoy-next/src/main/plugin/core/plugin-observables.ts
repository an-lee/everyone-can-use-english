import {
  Subject,
  BehaviorSubject,
  Observable,
  filter,
  distinctUntilChanged,
  share,
} from "rxjs";
import { log } from "@main/core/utils";

const logger = log.scope("PluginObservables");

// Plugin event types
export enum PluginEventType {
  // Lifecycle events
  LOADED = "plugin:loaded",
  ACTIVATED = "plugin:activated",
  DEACTIVATED = "plugin:deactivated",

  // Command events
  COMMAND_REGISTERED = "command:registered",
  COMMAND_EXECUTED = "command:executed",

  // View events
  VIEW_REGISTERED = "view:registered",

  // Service events
  SERVICE_REGISTERED = "service:registered",

  // System events
  SYSTEM_EVENT = "system:event",
}

// Base event interface
export interface PluginEvent {
  type: PluginEventType;
  timestamp: number;
  pluginId: string;
}

// Plugin lifecycle events
export interface PluginLoadedEvent extends PluginEvent {
  type: PluginEventType.LOADED;
  pluginPath: string;
  metadata: PluginMetadata;
}

export interface PluginActivatedEvent extends PluginEvent {
  type: PluginEventType.ACTIVATED;
}

export interface PluginDeactivatedEvent extends PluginEvent {
  type: PluginEventType.DEACTIVATED;
}

// Command events
export interface CommandRegisteredEvent extends PluginEvent {
  type: PluginEventType.COMMAND_REGISTERED;
  commandId: string;
}

export interface CommandExecutedEvent extends PluginEvent {
  type: PluginEventType.COMMAND_EXECUTED;
  commandId: string;
  args: any[];
  result: any;
}

// View events
export interface ViewRegisteredEvent extends PluginEvent {
  type: PluginEventType.VIEW_REGISTERED;
  viewId: string;
  component: any;
}

// Service events
export interface ServiceRegisteredEvent extends PluginEvent {
  type: PluginEventType.SERVICE_REGISTERED;
  serviceId: string;
  service: any;
}

// System events
export interface SystemEvent extends PluginEvent {
  type: PluginEventType.SYSTEM_EVENT;
  eventName: string;
  data?: any;
}

// Union type for all plugin events
export type PluginEvents =
  | PluginLoadedEvent
  | PluginActivatedEvent
  | PluginDeactivatedEvent
  | CommandRegisteredEvent
  | CommandExecutedEvent
  | ViewRegisteredEvent
  | ServiceRegisteredEvent
  | SystemEvent;

// Plugin metadata
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
}

// Plugin activation state
export interface PluginState {
  id: string;
  metadata: PluginMetadata;
  isActive: boolean;
  isLoaded: boolean;
  error?: Error;
}

// Command definition
export interface CommandDefinition {
  id: string;
  pluginId: string;
  callback: (...args: any[]) => any;
}

// View definition
export interface ViewDefinition {
  id: string;
  pluginId: string;
  component: any;
}

// Service definition
export interface ServiceDefinition {
  id: string;
  pluginId: string;
  service: any;
}

/**
 * Observable-based plugin system
 */
class PluginObservables {
  // Main event stream
  private events$ = new Subject<PluginEvents>();

  // State streams
  private pluginStates$ = new BehaviorSubject<Record<string, PluginState>>({});
  private commands$ = new BehaviorSubject<Record<string, CommandDefinition>>(
    {}
  );
  private views$ = new BehaviorSubject<Record<string, ViewDefinition>>({});
  private services$ = new BehaviorSubject<Record<string, ServiceDefinition>>(
    {}
  );

  // Filter helpers for specific event types
  private filterEventType<T extends PluginEvents>(type: PluginEventType) {
    return this.events$.pipe(
      filter((event): event is T => event.type === type)
    );
  }

  // Event streams
  public pluginLoaded$ = this.filterEventType<PluginLoadedEvent>(
    PluginEventType.LOADED
  );
  public pluginActivated$ = this.filterEventType<PluginActivatedEvent>(
    PluginEventType.ACTIVATED
  );
  public pluginDeactivated$ = this.filterEventType<PluginDeactivatedEvent>(
    PluginEventType.DEACTIVATED
  );
  public commandRegistered$ = this.filterEventType<CommandRegisteredEvent>(
    PluginEventType.COMMAND_REGISTERED
  );
  public commandExecuted$ = this.filterEventType<CommandExecutedEvent>(
    PluginEventType.COMMAND_EXECUTED
  );
  public viewRegistered$ = this.filterEventType<ViewRegisteredEvent>(
    PluginEventType.VIEW_REGISTERED
  );
  public serviceRegistered$ = this.filterEventType<ServiceRegisteredEvent>(
    PluginEventType.SERVICE_REGISTERED
  );
  public systemEvent$ = this.filterEventType<SystemEvent>(
    PluginEventType.SYSTEM_EVENT
  );

  // Derived streams for changes
  public pluginsChanged$ = this.pluginStates$.pipe(
    distinctUntilChanged(),
    share()
  );

  public commandsChanged$ = this.commands$.pipe(
    distinctUntilChanged(),
    share()
  );

  public viewsChanged$ = this.views$.pipe(distinctUntilChanged(), share());

  public servicesChanged$ = this.services$.pipe(
    distinctUntilChanged(),
    share()
  );

  // Public state observables (read-only)
  public get plugins$(): Observable<Record<string, PluginState>> {
    return this.pluginStates$.asObservable();
  }

  public get commands$State(): Observable<Record<string, CommandDefinition>> {
    return this.commands$.asObservable();
  }

  public get views$State(): Observable<Record<string, ViewDefinition>> {
    return this.views$.asObservable();
  }

  public get services$State(): Observable<Record<string, ServiceDefinition>> {
    return this.services$.asObservable();
  }

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Set up automatic state updates based on events
   */
  private setupEventHandlers() {
    // Handle plugin loaded events
    this.pluginLoaded$.subscribe((event) => {
      const pluginStates = this.pluginStates$.getValue();

      this.pluginStates$.next({
        ...pluginStates,
        [event.pluginId]: {
          id: event.pluginId,
          metadata: event.metadata,
          isActive: false,
          isLoaded: true,
        },
      });

      logger.info(`Plugin loaded: ${event.pluginId}`);
    });

    // Handle plugin activated events
    this.pluginActivated$.subscribe((event) => {
      const pluginStates = this.pluginStates$.getValue();
      const pluginState = pluginStates[event.pluginId];

      if (pluginState) {
        this.pluginStates$.next({
          ...pluginStates,
          [event.pluginId]: {
            ...pluginState,
            isActive: true,
          },
        });

        logger.info(`Plugin activated: ${event.pluginId}`);
      }
    });

    // Handle plugin deactivated events
    this.pluginDeactivated$.subscribe((event) => {
      const pluginStates = this.pluginStates$.getValue();
      const pluginState = pluginStates[event.pluginId];

      if (pluginState) {
        this.pluginStates$.next({
          ...pluginStates,
          [event.pluginId]: {
            ...pluginState,
            isActive: false,
          },
        });

        // Clean up commands from this plugin
        this.cleanupPluginCommands(event.pluginId);

        // Clean up views from this plugin
        this.cleanupPluginViews(event.pluginId);

        // Clean up services from this plugin
        this.cleanupPluginServices(event.pluginId);

        logger.info(`Plugin deactivated: ${event.pluginId}`);
      }
    });

    // Handle command registration
    this.commandRegistered$.subscribe((event) => {
      const commands = this.commands$.getValue();

      logger.debug(
        `Command registered: ${event.commandId} by plugin ${event.pluginId}`
      );
    });

    // Handle view registration
    this.viewRegistered$.subscribe((event) => {
      logger.debug(
        `View registered: ${event.viewId} by plugin ${event.pluginId}`
      );
    });

    // Handle service registration
    this.serviceRegistered$.subscribe((event) => {
      logger.debug(
        `Service registered: ${event.serviceId} by plugin ${event.pluginId}`
      );
    });
  }

  /**
   * Clean up resources associated with a plugin
   */
  private cleanupPluginCommands(pluginId: string) {
    const commands = this.commands$.getValue();
    const updatedCommands = Object.entries(commands)
      .filter(([_, command]) => command.pluginId !== pluginId)
      .reduce((acc, [id, command]) => ({ ...acc, [id]: command }), {});

    this.commands$.next(updatedCommands);
  }

  private cleanupPluginViews(pluginId: string) {
    const views = this.views$.getValue();
    const updatedViews = Object.entries(views)
      .filter(([_, view]) => view.pluginId !== pluginId)
      .reduce((acc, [id, view]) => ({ ...acc, [id]: view }), {});

    this.views$.next(updatedViews);
  }

  private cleanupPluginServices(pluginId: string) {
    const services = this.services$.getValue();
    const updatedServices = Object.entries(services)
      .filter(([_, service]) => service.pluginId !== pluginId)
      .reduce((acc, [id, service]) => ({ ...acc, [id]: service }), {});

    this.services$.next(updatedServices);
  }

  /**
   * Emit an event to the event stream
   */
  private emit(event: PluginEvents) {
    logger.debug(`Emitting ${event.type} event for plugin ${event.pluginId}`);
    this.events$.next(event);
  }

  // Plugin lifecycle event emitters
  emitPluginLoaded(
    pluginId: string,
    pluginPath: string,
    metadata: PluginMetadata
  ): void {
    this.emit({
      type: PluginEventType.LOADED,
      timestamp: Date.now(),
      pluginId,
      pluginPath,
      metadata,
    });
  }

  emitPluginActivated(pluginId: string): void {
    this.emit({
      type: PluginEventType.ACTIVATED,
      timestamp: Date.now(),
      pluginId,
    });
  }

  emitPluginDeactivated(pluginId: string): void {
    this.emit({
      type: PluginEventType.DEACTIVATED,
      timestamp: Date.now(),
      pluginId,
    });
  }

  // Command event emitters
  emitCommandRegistered(pluginId: string, commandId: string): void {
    this.emit({
      type: PluginEventType.COMMAND_REGISTERED,
      timestamp: Date.now(),
      pluginId,
      commandId,
    });
  }

  emitCommandExecuted(
    pluginId: string,
    commandId: string,
    args: any[],
    result: any
  ): void {
    this.emit({
      type: PluginEventType.COMMAND_EXECUTED,
      timestamp: Date.now(),
      pluginId,
      commandId,
      args,
      result,
    });
  }

  // View event emitters
  emitViewRegistered(pluginId: string, viewId: string, component: any): void {
    this.emit({
      type: PluginEventType.VIEW_REGISTERED,
      timestamp: Date.now(),
      pluginId,
      viewId,
      component,
    });
  }

  // Service event emitters
  emitServiceRegistered(
    pluginId: string,
    serviceId: string,
    service: any
  ): void {
    this.emit({
      type: PluginEventType.SERVICE_REGISTERED,
      timestamp: Date.now(),
      pluginId,
      serviceId,
      service,
    });
  }

  // System event emitter
  emitSystemEvent(eventName: string, data?: any): void {
    this.emit({
      type: PluginEventType.SYSTEM_EVENT,
      timestamp: Date.now(),
      pluginId: "system",
      eventName,
      data,
    });
  }

  // State management methods
  registerCommand(
    pluginId: string,
    commandId: string,
    callback: (...args: any[]) => any
  ): void {
    const commands = this.commands$.getValue();

    // Check if command already exists
    if (commands[commandId]) {
      logger.warn(
        `Command ${commandId} already registered by plugin ${commands[commandId].pluginId}`
      );
      return;
    }

    // Register the command
    this.commands$.next({
      ...commands,
      [commandId]: {
        id: commandId,
        pluginId,
        callback,
      },
    });

    // Emit event
    this.emitCommandRegistered(pluginId, commandId);
  }

  registerView(pluginId: string, viewId: string, component: any): void {
    const views = this.views$.getValue();

    // Check if view already exists
    if (views[viewId]) {
      logger.warn(
        `View ${viewId} already registered by plugin ${views[viewId].pluginId}`
      );
      return;
    }

    // Register the view
    this.views$.next({
      ...views,
      [viewId]: {
        id: viewId,
        pluginId,
        component,
      },
    });

    // Emit event
    this.emitViewRegistered(pluginId, viewId, component);
  }

  registerService(pluginId: string, serviceId: string, service: any): void {
    const services = this.services$.getValue();

    // Check if service already exists
    if (services[serviceId]) {
      logger.warn(
        `Service ${serviceId} already registered by plugin ${services[serviceId].pluginId}`
      );
      return;
    }

    // Register the service
    this.services$.next({
      ...services,
      [serviceId]: {
        id: serviceId,
        pluginId,
        service,
      },
    });

    // Emit event
    this.emitServiceRegistered(pluginId, serviceId, service);
  }

  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    const commands = this.commands$.getValue();
    const command = commands[commandId];

    if (!command) {
      logger.error(`Command ${commandId} not found`);
      throw new Error(`Command ${commandId} not found`);
    }

    try {
      logger.debug(`Executing command ${commandId}`);
      const result = await command.callback(...args);

      // Emit command executed event
      this.emitCommandExecuted(command.pluginId, commandId, args, result);

      return result;
    } catch (error) {
      logger.error(`Error executing command ${commandId}:`, error);
      throw error;
    }
  }

  getCommand(commandId: string): CommandDefinition | undefined {
    return this.commands$.getValue()[commandId];
  }

  getAllCommands(): Record<string, CommandDefinition> {
    return this.commands$.getValue();
  }

  getView(viewId: string): ViewDefinition | undefined {
    return this.views$.getValue()[viewId];
  }

  getAllViews(): Record<string, ViewDefinition> {
    return this.views$.getValue();
  }

  getService(serviceId: string): any {
    const service = this.services$.getValue()[serviceId];
    return service?.service;
  }

  getPlugin(pluginId: string): PluginState | undefined {
    return this.pluginStates$.getValue()[pluginId];
  }

  getAllPlugins(): Record<string, PluginState> {
    return this.pluginStates$.getValue();
  }

  isPluginActive(pluginId: string): boolean {
    const plugin = this.getPlugin(pluginId);
    return plugin?.isActive ?? false;
  }
}

// Create and export singleton instance
export const pluginObservables = new PluginObservables();
export default pluginObservables;

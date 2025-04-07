export enum PluginLifecycle {
  UNLOADED = "unloaded",
  LOADED = "loaded",
  ACTIVE = "active",
  ERROR = "error",
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
  dependencies?: Record<string, string>;
  engines?: {
    enjoy?: string;
  };
  contributes?: {
    commands?: PluginCommand[];
    menus?: PluginMenu;
    configuration?: PluginConfiguration[];
    views?: PluginViews;
  };
}

export interface PluginCommand {
  id: string;
  title: string;
  keybinding?: string;
}

export interface PluginMenu {
  mainMenu?: PluginMenuItem[];
  contextMenu?: PluginMenuItem[];
}

export interface PluginMenuItem {
  id: string;
  command: string;
  group?: string;
  when?: string;
}

export interface PluginConfiguration {
  id: string;
  title: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  default?: any;
  description?: string;
}

export interface PluginViews {
  sidebar?: PluginViewItem[];
  panel?: PluginViewItem[];
}

export interface PluginViewItem {
  id: string;
  title: string;
  icon?: string;
}

export interface IPlugin {
  id: string;
  manifest: PluginManifest;
  isBuiltIn: boolean;
  lifecycle: PluginLifecycle;

  /**
   * Activates the plugin
   */
  activate(): Promise<void>;

  /**
   * Deactivates the plugin
   */
  deactivate(): Promise<void>;

  /**
   * Get plugin configuration
   */
  getConfig<T>(key: string): T | undefined;

  /**
   * Set plugin configuration
   */
  setConfig<T>(key: string, value: T): void;
}

export interface PluginContext {
  /**
   * Register a command that can be invoked by the user or other extensions.
   * @param id The command ID
   * @param callback The command implementation
   */
  registerCommand(id: string, callback: (...args: any[]) => any): void;

  /**
   * Register a view component that can be displayed in the UI.
   * @param id The view ID
   * @param component The view component
   */
  registerView(id: string, component: any): void;

  /**
   * Register an initialization phase for the application.
   * @param phase The phase definition without an ID (will be auto-generated)
   */
  registerInitPhase(phase: {
    name: string;
    description: string;
    dependencies: string[];
    execute: () => Promise<void>;
  }): void;

  /**
   * Unregister a previously registered initialization phase.
   * @param phaseName The name of the phase to unregister
   */
  unregisterInitPhase(phaseName: string): void;

  /**
   * Get all registered initialization phases.
   * @returns Array of phase information
   */
  getInitPhases(): Array<{ id: string; name: string; dependencies: string[] }>;

  /**
   * Subscribe to an event.
   * @param event The event name
   * @param callback The event handler
   */
  subscribe(event: string, callback: (...args: any[]) => any): void;

  /**
   * Publish an event.
   * @param event The event name
   * @param args The event arguments
   */
  publish(event: string, ...args: any[]): void;

  /**
   * Get the storage path for this plugin.
   * @returns The storage path
   */
  getStoragePath(): string;

  /**
   * Get a service provided by the application.
   * @param name The service name
   * @returns The service instance, or undefined if not found
   */
  getService<T>(name: string): T | undefined;
}

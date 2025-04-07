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
   * Register a command that can be invoked by the user
   */
  registerCommand(id: string, callback: (...args: any[]) => any): void;

  /**
   * Register a view that can be shown in the sidebar or panels
   */
  registerView(id: string, component: any): void;

  /**
   * Subscribe to an event
   */
  subscribe(event: string, callback: (...args: any[]) => any): void;

  /**
   * Publish an event
   */
  publish(event: string, ...args: any[]): void;

  /**
   * Get plugin storage directory
   */
  getStoragePath(): string;

  /**
   * Get a service by name
   */
  getService<T>(name: string): T | undefined;

  /**
   * Wait for a specific initialization phase to complete
   * @param phaseId The ID of the phase to wait for
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise that resolves when the phase completes or rejects on timeout
   */
  waitForPhase(phaseId: string, timeoutMs?: number): Promise<boolean>;
}

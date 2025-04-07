import { InitHookType } from "@/main/core/initializer/init-hooks";

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

// Define hook function types for the context
export type InitHookFunction =
  | (() => Promise<void> | void)
  | ((phaseId?: string) => Promise<void> | void)
  | ((phaseId: string, error?: Error) => Promise<void> | void);

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
    timeout?: number;
  }): void;

  /**
   * Unregister a previously registered initialization phase.
   * @param phaseName The name of the phase to unregister
   */
  unregisterInitPhase(phaseName: string): void;

  /**
   * Register a hook to be executed at a specific point in the initialization process.
   * @param hookType The type of hook to register
   * @param callback The hook callback function
   * @param order Optional execution order (lower numbers run first)
   * @returns The hook ID that can be used to unregister the hook
   */
  registerInitHook(
    hookType: InitHookType,
    callback: InitHookFunction,
    order?: number
  ): string;

  /**
   * Unregister a previously registered initialization hook.
   * @param hookId The ID of the hook to unregister
   * @returns True if the hook was found and unregistered
   */
  unregisterInitHook(hookId: string): boolean;

  /**
   * Get the available hook types.
   * @returns The InitHookType enum
   */
  getInitHookTypes(): typeof InitHookType;

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

  /**
   * Register a hook to be executed when a phase times out.
   * @param phaseId The phase ID to monitor for timeouts, or undefined for all phases
   * @param callback The function to call when a timeout occurs
   * @returns The hook ID that can be used to unregister the hook
   */
  registerPhaseTimeoutHandler(
    phaseId: string | undefined,
    callback: (phaseId: string, timeout: number) => Promise<void> | void
  ): string;

  /**
   * Wait for a specific phase to complete
   * @param phaseId The phase ID to wait for
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to true if phase completed, rejects on timeout
   */
  waitForPhase(phaseId: string, timeoutMs?: number): Promise<boolean>;
}

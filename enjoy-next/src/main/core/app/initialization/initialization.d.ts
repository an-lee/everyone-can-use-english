// Definition of initialization phases
declare type InitPhase = {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  execute: () => Promise<void>;
  timeout?: number; // Optional timeout in milliseconds
};

// Hook types
declare enum InitHookType {
  // Global hooks
  BEFORE_INIT = "before:init",
  AFTER_INIT = "after:init",
  INIT_FAILED = "init:failed",

  // Phase-specific hooks
  BEFORE_PHASE = "before:phase",
  AFTER_PHASE = "after:phase",
  PHASE_FAILED = "phase:failed",
  PHASE_TIMEOUT = "phase:timeout",
}

// Union type for all hook types
declare type HookFunction =
  | BeforeInitHook
  | AfterInitHook
  | InitFailedHook
  | BeforePhaseHook
  | AfterPhaseHook
  | PhaseFailedHook
  | PhaseTimeoutHook;

// Hook registration entry
declare type HookEntry = {
  id: string;
  type: InitHookType;
  pluginId?: string;
  order: number;
  fn: HookFunction;
};

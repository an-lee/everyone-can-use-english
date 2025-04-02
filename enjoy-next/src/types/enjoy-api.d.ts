interface EnjoyAPI {
  plugins: {
    getPlugins: () => Promise<any[]>;
    executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
  };
  events: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, listener: (...args: any[]) => void) => void;
    once: (channel: string, listener: (...args: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    enjoy: EnjoyAPI;
  }
}

import type { CapyState } from './types';

declare global {
  interface Window {
    capy: {
      setIgnoreMouse: (ignore: boolean) => void;
      getState: () => Promise<CapyState>;
      onStateChanged: (cb: (state: CapyState) => void) => () => void;
      onFlybyStart: (cb: (payload: { count: number }) => void) => () => void;
      onWindowBlurred: (cb: () => void) => () => void;
      flybyFinished: () => void;
      addTask: (title: string) => Promise<void>;
      updateTaskTitle: (id: string, title: string) => Promise<void>;
      toggleTask: (id: string) => Promise<void>;
      deleteTask: (id: string) => Promise<void>;
      setStartTime: (time: string) => Promise<void>;
      setPause: (minutes: number) => Promise<void>;
      clearPause: () => Promise<void>;
      setLaunchAtLogin: (enabled: boolean) => Promise<void>;
      quitApp: () => Promise<void>;
    };
  }
}

export {};

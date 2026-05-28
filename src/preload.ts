import { contextBridge, ipcRenderer } from 'electron';
import type { CapyState } from './types';

contextBridge.exposeInMainWorld('capy', {
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse', ignore),
  getState: (): Promise<CapyState> => ipcRenderer.invoke('get-state'),
  onStateChanged: (cb: (state: CapyState) => void) => {
    const handler = (_e: unknown, state: CapyState) => cb(state);
    ipcRenderer.on('state-changed', handler);
    return () => ipcRenderer.removeListener('state-changed', handler);
  },
  onFlybyStart: (cb: (payload: { count: number }) => void) => {
    const handler = (_e: unknown, payload: { count: number }) => cb(payload);
    ipcRenderer.on('flyby-start', handler);
    return () => ipcRenderer.removeListener('flyby-start', handler);
  },
  flybyFinished: () => ipcRenderer.send('flyby-finished'),
  addTask: (title: string) => ipcRenderer.invoke('add-task', title),
  updateTaskTitle: (id: string, title: string) =>
    ipcRenderer.invoke('update-task-title', id, title),
  toggleTask: (id: string) => ipcRenderer.invoke('toggle-task', id),
  deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),
  setStartTime: (time: string) => ipcRenderer.invoke('set-start-time', time),
  setPause: (minutes: number) => ipcRenderer.invoke('set-pause', minutes),
  clearPause: () => ipcRenderer.invoke('clear-pause'),
  setLaunchAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke('set-launch-at-login', enabled),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});

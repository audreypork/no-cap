import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Store from 'electron-store';
import AutoLaunch from 'auto-launch';
import { randomUUID } from 'node:crypto';
import type { CapyStoreShape, DayRecord } from './types';
import {
  localDateKey,
  msUntilNextMidnight,
  isAfterStartTimeToday,
} from './dateUtils';

if (started) {
  app.quit();
}

const DEFAULT_START_TIME = '15:00';
const FLYBY_INTERVAL_MS = 5 * 60 * 1000;
const FLYBY_CHECK_MS = 30 * 1000;

const store = new Store<CapyStoreShape>({
  defaults: {
    days: {},
    startTime: DEFAULT_START_TIME,
    launchAtLogin: true,
  },
});

const autoLaunch = new AutoLaunch({
  name: 'Capy',
  isHidden: true,
});

function ensureTodayRecord(): DayRecord {
  const today = localDateKey();
  const days = store.get('days');
  if (days[today]) return days[today];
  const startTime = store.get('startTime');
  const record: DayRecord = {
    date: today,
    tasks: [],
    startTime,
    currentTaskIndex: 0,
  };
  days[today] = record;
  store.set('days', days);
  return record;
}

function getTodayRecord(): DayRecord {
  return ensureTodayRecord();
}

function setTodayRecord(rec: DayRecord) {
  const days = store.get('days');
  days[rec.date] = rec;
  store.set('days', days);
}

let mainWindow: BrowserWindow | null = null;
let lastFlybyAt = 0;
let flybyInProgress = false;
let flybyCheckTimer: NodeJS.Timeout | null = null;
let rolloverTimer: NodeJS.Timeout | null = null;

function broadcastState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const state = {
    store: {
      days: store.get('days'),
      startTime: store.get('startTime'),
      pause: store.get('pause'),
      launchAtLogin: store.get('launchAtLogin'),
    },
    today: localDateKey(),
    now: Date.now(),
  };
  mainWindow.webContents.send('state-changed', state);
}

function createWindow() {
  const primary = screen.getPrimaryDisplay();
  const { x, y, width, height } = primary.bounds;

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    fullscreenable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.on('did-finish-load', () => {
    broadcastState();
  });

  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('window-blurred');
  });
}

function scheduleMidnightRollover() {
  if (rolloverTimer) clearTimeout(rolloverTimer);
  const ms = msUntilNextMidnight() + 1000;
  rolloverTimer = setTimeout(() => {
    ensureTodayRecord();
    broadcastState();
    scheduleMidnightRollover();
  }, ms);
}

function shouldFireFlyby(): { fire: boolean; reason?: string } {
  if (flybyInProgress) return { fire: false, reason: 'in-progress' };
  const today = getTodayRecord();
  if (today.tasks.length === 0) return { fire: false, reason: 'no-tasks' };
  const allDone = today.tasks.every((t) => t.done);
  if (allDone) return { fire: false, reason: 'all-done' };
  if (!isAfterStartTimeToday(today.startTime)) return { fire: false, reason: 'before-start' };
  const pause = store.get('pause');
  if (pause && pause.until > Date.now()) return { fire: false, reason: 'paused' };
  if (Date.now() - lastFlybyAt < FLYBY_INTERVAL_MS) return { fire: false, reason: 'interval' };
  return { fire: true };
}

function flybyTick() {
  const decision = shouldFireFlyby();
  if (!decision.fire) return;
  fireFlyby();
}

function fireFlyby() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const today = getTodayRecord();
  const undone = today.tasks.filter((t) => !t.done);
  if (undone.length === 0) return;

  flybyInProgress = true;
  lastFlybyAt = Date.now();
  mainWindow.webContents.send('flyby-start', { count: undone.length });
}

function startFlybyScheduler() {
  if (flybyCheckTimer) clearInterval(flybyCheckTimer);
  flybyCheckTimer = setInterval(flybyTick, FLYBY_CHECK_MS);
  setTimeout(flybyTick, 5000);
}

function registerIpc() {
  ipcMain.on('set-ignore-mouse', (e, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return;
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true });
    } else {
      win.setIgnoreMouseEvents(false);
    }
  });

  ipcMain.handle('get-state', () => ({
    store: {
      days: store.get('days'),
      startTime: store.get('startTime'),
      pause: store.get('pause'),
      launchAtLogin: store.get('launchAtLogin'),
    },
    today: localDateKey(),
    now: Date.now(),
  }));

  ipcMain.handle('add-task', (_e, title: string) => {
    const today = getTodayRecord();
    if (today.tasks.length >= 3) return;
    today.tasks.push({ id: randomUUID(), title: title || '', done: false });
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('update-task-title', (_e, id: string, title: string) => {
    const today = getTodayRecord();
    const t = today.tasks.find((x) => x.id === id);
    if (!t) return;
    t.title = title;
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('toggle-task', (_e, id: string) => {
    const today = getTodayRecord();
    const t = today.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : undefined;
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('delete-task', (_e, id: string) => {
    const today = getTodayRecord();
    today.tasks = today.tasks.filter((x) => x.id !== id);
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('set-start-time', (_e, time: string) => {
    store.set('startTime', time);
    const today = getTodayRecord();
    today.startTime = time;
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('bump-today-checkin-mins', (_e, minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(target.getMinutes()).padStart(2, '0');
    const today = getTodayRecord();
    today.startTime = `${hh}:${mm}`;
    setTodayRecord(today);
    broadcastState();
  });

  ipcMain.handle('set-pause', (_e, minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    store.set('pause', { until });
    broadcastState();
  });

  ipcMain.handle('clear-pause', () => {
    store.delete('pause');
    broadcastState();
  });

  ipcMain.on('flyby-finished', () => {
    flybyInProgress = false;
    broadcastState();
  });

  ipcMain.handle('set-launch-at-login', async (_e, enabled: boolean) => {
    store.set('launchAtLogin', enabled);
    try {
      const isEnabled = await autoLaunch.isEnabled();
      if (enabled && !isEnabled) await autoLaunch.enable();
      if (!enabled && isEnabled) await autoLaunch.disable();
    } catch (err) {
      console.error('auto-launch error', err);
    }
    broadcastState();
  });

  ipcMain.handle('quit-app', () => {
    app.exit(0);
  });
}

async function syncAutoLaunch() {
  try {
    const desired = store.get('launchAtLogin');
    const isEnabled = await autoLaunch.isEnabled();
    if (desired && !isEnabled) await autoLaunch.enable();
    if (!desired && isEnabled) await autoLaunch.disable();
  } catch (err) {
    console.error('auto-launch sync error', err);
  }
}

app.on('ready', async () => {
  if (app.dock) app.dock.hide();
  ensureTodayRecord();
  registerIpc();
  createWindow();
  scheduleMidnightRollover();
  startFlybyScheduler();
  await syncAutoLaunch();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

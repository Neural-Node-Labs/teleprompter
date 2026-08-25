import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startRemoteServer } from './remoteServer';
import { store, defaultSettings, type PrompterSettings } from './storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite injects this in dev; in prod we load from dist/
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let controlWindow: BrowserWindow | null = null;
let prompterWindow: BrowserWindow | null = null;

// ---- Shared prompter state (main process is the source of truth) ----
//
// Each Electron BrowserWindow runs its own isolated renderer with its own
// JS context — the control panel and the prompter window do NOT share
// React/Zustand state automatically. Anything the control panel changes
// (script text, style settings, playback commands) must be explicitly
// relayed through IPC. We keep a copy of the current script/settings here
// so that a prompter window opened *after* the control panel already has
// changes can pull the current state immediately on load, instead of only
// getting whatever happens to be sent next.
let currentScript = 'Paste or write your script here...';
// Seeded from disk (electron-store) so the app resumes with whatever
// settings were last in use, rather than always resetting to defaults.
let currentSettings: PrompterSettings = store.get('lastSettings', defaultSettings);

// Electron's transparent:false window means the "opacity" control can't
// use CSS to reveal what's behind it (there's a solid window backing it).
// Instead we drive it through the OS-level BrowserWindow.setOpacity() API,
// which reliably fades the *entire* native window (a real, guaranteed-
// visible effect on Windows, unlike layering translucent black over an
// already near-black window background). We clamp the minimum so the
// window never fades to fully invisible/unreachable.
function clampOpacity(value: number) {
  return Math.min(1, Math.max(0.1, value));
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Teleprompter — Control Panel',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  controlWindow.once('ready-to-show', () => {
    controlWindow?.show();
  });

  if (VITE_DEV_SERVER_URL) {
    controlWindow.loadURL(`${VITE_DEV_SERVER_URL}#/control`);
    // Auto-open DevTools in development so preload/IPC errors are visible
    // (preload script errors show under a "Preload script error" entry
    // in this console — that's the first place to look if a button click
    // silently does nothing).
    controlWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    controlWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      hash: '/control',
    });
  }

  controlWindow.webContents.on(
    'did-fail-load',
    (_e, errorCode, errorDescription) => {
      console.error('Control window failed to load:', errorCode, errorDescription);
    }
  );

  controlWindow.on('closed', () => {
    controlWindow = null;
    prompterWindow?.close();
  });
}

function createPrompterWindow() {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.length > 1 ? displays[1] : displays[0];

  prompterWindow = new BrowserWindow({
    x: targetDisplay.bounds.x + 100,
    y: targetDisplay.bounds.y + 100,
    width: 900,
    height: 600,
    frame: false,
    // NOTE: transparent:true frameless windows are notoriously unreliable
    // on Windows (DWM compositing frequently renders them fully invisible,
    // especially before first paint / on certain GPU drivers). We use a
    // solid opaque window instead, and drive the "see-through" opacity
    // effect via the native BrowserWindow.setOpacity() API (see
    // clampOpacity / the prompter:setSettings handler below) rather than
    // CSS transparency — more reliable and guaranteed visible.
    transparent: false,
    alwaysOnTop: true,
    backgroundColor: '#0d0d0f',
    show: false, // wait for ready-to-show to avoid a blank/white flash
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // 'floating' is high enough to stay above normal windows without the
  // rendering quirks 'screen-saver' level can sometimes trigger on Windows.
  prompterWindow.setAlwaysOnTop(true, 'floating');

  prompterWindow.once('ready-to-show', () => {
    prompterWindow?.show();
    prompterWindow?.focus();
    // Apply whatever opacity was last set, in case it changed before this
    // window existed (e.g. control panel adjusted it, then window closed
    // and got reopened).
    prompterWindow?.setOpacity(clampOpacity(currentSettings.bgOpacity));
  });

  if (VITE_DEV_SERVER_URL) {
    prompterWindow.loadURL(`${VITE_DEV_SERVER_URL}#/prompter`);
  } else {
    prompterWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      hash: '/prompter',
    });
  }

  prompterWindow.webContents.on(
    'did-fail-load',
    (_e, errorCode, errorDescription) => {
      console.error('Prompter window failed to load:', errorCode, errorDescription);
    }
  );

  prompterWindow.on('closed', () => {
    prompterWindow = null;
  });
}

app.whenReady().then(() => {
  createControlWindow();

  // Register global playback shortcuts (work even when prompter window
  // isn't focused, since presenters are usually looking at a camera).
  globalShortcut.register('Space', () => {
    prompterWindow?.webContents.send('playback:toggle');
  });
  globalShortcut.register('Up', () => {
    prompterWindow?.webContents.send('speed:increase');
  });
  globalShortcut.register('Down', () => {
    prompterWindow?.webContents.send('speed:decrease');
  });
  globalShortcut.register('R', () => {
    prompterWindow?.webContents.send('playback:restart');
  });

  // Start local WebSocket server so a phone on the same network can act
  // as a remote control.
  startRemoteServer((command) => {
    prompterWindow?.webContents.send('remote:command', command);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC handlers ----

ipcMain.handle('prompter:open', () => {
  try {
    if (!prompterWindow) {
      console.log('[main] Creating prompter window...');
      createPrompterWindow();
    } else {
      console.log('[main] Showing existing prompter window...');
      prompterWindow.show();
      prompterWindow.focus();
    }
  } catch (err) {
    console.error('[main] Failed to open prompter window:', err);
    throw err;
  }
});

ipcMain.handle('prompter:close', () => {
  console.log('[main] Closing prompter window...');
  prompterWindow?.close();
});

ipcMain.handle('prompter:setScript', (_event, text: string) => {
  currentScript = text;
  prompterWindow?.webContents.send('script:update', text);
});

ipcMain.handle('prompter:setSettings', (_event, settings: Partial<PrompterSettings>) => {
  currentSettings = { ...currentSettings, ...settings };
  store.set('lastSettings', currentSettings); // auto-persist, no explicit save needed
  prompterWindow?.webContents.send('settings:update', currentSettings);
  if (settings.bgOpacity !== undefined) {
    prompterWindow?.setOpacity(clampOpacity(settings.bgOpacity));
  }
});

ipcMain.handle('prompter:command', (_event, command: string) => {
  console.log('[main] Forwarding playback command to prompter:', command);
  prompterWindow?.webContents.send('remote:command', command);
});

ipcMain.handle('prompter:getInitialState', () => {
  return { script: currentScript, settings: currentSettings };
});

// ---- Settings presets (named, explicitly saved) ----

ipcMain.handle(
  'settings:savePreset',
  (_event, name: string, settings: PrompterSettings) => {
    const presets = store.get('settingsPresets', {});
    presets[name] = settings;
    store.set('settingsPresets', presets);
    return true;
  }
);

ipcMain.handle('settings:listPresets', () => {
  const presets = store.get('settingsPresets', {});
  return Object.keys(presets);
});

ipcMain.handle('settings:loadPreset', (_event, name: string) => {
  const presets = store.get('settingsPresets', {});
  return presets[name] ?? null;
});

ipcMain.handle('settings:deletePreset', (_event, name: string) => {
  const presets = store.get('settingsPresets', {});
  delete presets[name];
  store.set('settingsPresets', presets);
  return true;
});

ipcMain.handle('displays:list', () => {
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    label: `${d.bounds.width}x${d.bounds.height}`,
    bounds: d.bounds,
  }));
});

ipcMain.handle('script:save', (_event, name: string, text: string) => {
  const scripts = store.get('scripts', {}) as Record<string, string>;
  scripts[name] = text;
  store.set('scripts', scripts);
  return true;
});

ipcMain.handle('script:list', () => {
  const scripts = store.get('scripts', {}) as Record<string, string>;
  return Object.keys(scripts);
});

ipcMain.handle('script:load', (_event, name: string) => {
  const scripts = store.get('scripts', {}) as Record<string, string>;
  return scripts[name] ?? '';
});

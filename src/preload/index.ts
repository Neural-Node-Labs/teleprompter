import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Window control
  openPrompter: () => ipcRenderer.invoke('prompter:open'),
  closePrompter: () => ipcRenderer.invoke('prompter:close'),
  setScript: (text: string) => ipcRenderer.invoke('prompter:setScript', text),
  listDisplays: () => ipcRenderer.invoke('displays:list'),

  // Style/playback settings sync (control panel -> prompter window).
  // Each Electron window has its own isolated JS context, so these must
  // be explicitly relayed through the main process rather than relying
  // on shared in-memory state.
  setPrompterSettings: (settings: {
    fontSize?: number;
    lineHeight?: number;
    mirrored?: boolean;
    bgOpacity?: number;
    speed?: number;
  }) => ipcRenderer.invoke('prompter:setSettings', settings),

  // Playback commands (play/pause/restart/speed) triggered from control
  // panel buttons. Reuses the same 'remote:command' handling the prompter
  // window already listens to for the phone remote and global shortcuts.
  sendCommand: (command: string) => ipcRenderer.invoke('prompter:command', command),

  // Called by the prompter window on mount to pull whatever script/settings
  // the control panel currently has, in case they changed before the
  // prompter window existed.
  getInitialState: () => ipcRenderer.invoke('prompter:getInitialState'),

  // Named settings presets (e.g. "studio lighting", "dim room"), separate
  // from the auto-persisted "last used" settings applied via
  // setPrompterSettings/getInitialState above.
  savePreset: (
    name: string,
    settings: {
      fontSize: number;
      lineHeight: number;
      mirrored: boolean;
      bgOpacity: number;
      speed: number;
    }
  ) => ipcRenderer.invoke('settings:savePreset', name, settings),
  listPresets: () => ipcRenderer.invoke('settings:listPresets'),
  loadPreset: (name: string) => ipcRenderer.invoke('settings:loadPreset', name),
  deletePreset: (name: string) => ipcRenderer.invoke('settings:deletePreset', name),

  // Script persistence
  saveScript: (name: string, text: string) =>
    ipcRenderer.invoke('script:save', name, text),
  listScripts: () => ipcRenderer.invoke('script:list'),
  loadScript: (name: string) => ipcRenderer.invoke('script:load', name),

  // Events pushed from main -> prompter window
  onScriptUpdate: (cb: (text: string) => void) => {
    const listener = (_: unknown, text: string) => cb(text);
    ipcRenderer.on('script:update', listener);
    return () => ipcRenderer.removeListener('script:update', listener);
  },
  onSettingsUpdate: (
    cb: (settings: {
      fontSize: number;
      lineHeight: number;
      mirrored: boolean;
      bgOpacity: number;
      speed: number;
    }) => void
  ) => {
    const listener = (_: unknown, settings: any) => cb(settings);
    ipcRenderer.on('settings:update', listener);
    return () => ipcRenderer.removeListener('settings:update', listener);
  },
  onPlaybackToggle: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('playback:toggle', listener);
    return () => ipcRenderer.removeListener('playback:toggle', listener);
  },
  onPlaybackRestart: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('playback:restart', listener);
    return () => ipcRenderer.removeListener('playback:restart', listener);
  },
  onSpeedChange: (cb: (direction: 'up' | 'down') => void) => {
    const inc = () => cb('up');
    const dec = () => cb('down');
    ipcRenderer.on('speed:increase', inc);
    ipcRenderer.on('speed:decrease', dec);
    return () => {
      ipcRenderer.removeListener('speed:increase', inc);
      ipcRenderer.removeListener('speed:decrease', dec);
    };
  },
  onRemoteCommand: (cb: (command: string) => void) => {
    const listener = (_: unknown, command: string) => cb(command);
    ipcRenderer.on('remote:command', listener);
    return () => ipcRenderer.removeListener('remote:command', listener);
  },
};

contextBridge.exposeInMainWorld('teleprompter', api);

export type TeleprompterAPI = typeof api;

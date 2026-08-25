import Store from 'electron-store';

export interface PrompterSettings {
  fontSize: number;
  lineHeight: number;
  mirrored: boolean;
  bgOpacity: number;
  speed: number;
}

export const defaultSettings: PrompterSettings = {
  fontSize: 48,
  lineHeight: 1.4,
  mirrored: false,
  bgOpacity: 0.6,
  speed: 60,
};

interface StoreSchema {
  scripts: Record<string, string>;
  // Automatically persisted every time settings change, so the app
  // resumes with the last-used values next launch without any explicit
  // "save" action from the user.
  lastSettings: PrompterSettings;
  // Named presets the user explicitly saves (e.g. "studio lighting",
  // "dim room") to quickly recall later.
  settingsPresets: Record<string, PrompterSettings>;
}

// electron-builder's "portable" Windows target sets this env var to the
// folder the .exe was launched from. When present, we store data there
// instead of the OS's per-machine userData folder — so saved scripts and
// presets travel with the .exe on a USB stick between computers, rather
// than being left behind on whichever PC last ran it. Falls back to the
// normal userData location for the installed/dev build.
const cwd = process.env.PORTABLE_EXECUTABLE_DIR;

export const store = new Store<StoreSchema>({
  cwd,
  defaults: {
    scripts: {},
    lastSettings: defaultSettings,
    settingsPresets: {},
  },
});

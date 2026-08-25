# Teleprompter (Electron + React + TypeScript)
- By Neural Node Labs
- 
A desktop teleprompter for Windows: a control panel window for writing/styling
your script, and a separate always-on-top, transparent, mirrorable prompter
display window — plus a phone-based remote control over your local network.

## Requirements

- Node.js 18+ and npm
- Windows 10/11 (for the packaged build; dev mode runs on any OS)

## Setup

```bash
npm install
```

## Run in development

```bash
npm run dev
```

This starts Vite's dev server and launches Electron. Two windows exist:

- **Control Panel** (opens by default) — write your script, adjust font
  size/line height/opacity/speed, toggle mirror mode.
- **Prompter Window** — click "Open Prompter Window" in the control panel.
  It's frameless, transparent, and always-on-top. Drag it by its top edge
  (a thin invisible drag handle) to reposition, or resize like a normal window.

### Shortcuts (global, work even if the prompter window isn't focused)

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `↑` / `↓` | Speed up / down |
| `R` | Restart scroll |

### Phone remote control

1. Make sure your PC and phone are on the same Wi-Fi network.
2. Find your PC's local IP address (`ipconfig` on Windows, look for IPv4).
3. Open `remote-control/index.html` on your phone's browser — easiest way is
   to serve it locally (e.g. `npx serve remote-control`) and visit that URL
   from your phone, or just copy the file onto the phone and open it.
4. Enter your PC's IP address in the remote page and tap **Connect**.
5. Use Play/Pause, Restart, Slower, Faster from your phone.

The app runs a local WebSocket server on port `8787` for this — no internet
connection or cloud account involved, local network only.

## Build a Windows installer

```bash
npm run build
```

This runs the TypeScript check, builds the Vite bundle, and packages both an
NSIS installer and a portable `.exe` (see below) via `electron-builder` into
`release/`.

## Build a portable EXE (no install, run on any Windows PC)

```bash
npm run build:portable
```

This produces `release/Teleprompter-portable.exe` — a single file with no
installer. Copy it to a USB stick or any folder on any Windows PC and
double-click to run; no admin rights or installation step needed.

**Your saved scripts and presets travel with it.** When run as a portable
build, the app stores its data (`config.json`, containing your saved
scripts and settings presets) in the *same folder as the .exe* rather than
tucked away in Windows' per-user AppData folder. That means if you copy
`Teleprompter-portable.exe` to a USB stick, everything you've saved comes
along too — plug it into a different Windows PC and your scripts/presets
are right there.

> Note: since the exe isn't code-signed, Windows SmartScreen may show an
> "Unknown publisher" warning on first run — click "More info" → "Run
> anyway". Code-signing removes this but requires a paid certificate.

### Troubleshooting: "Cannot create symbolic link" during build

If `npm run build` or `npm run build:portable` fails with errors like
`Cannot create symbolic link: A required privilege is not held by the
client`, electron-builder is downloading a bundled tool archive (used for
Windows exe metadata, not code signing — even for a Windows-only build)
that contains symlinks. Extracting those requires a Windows privilege your
account doesn't have by default.

**Fix — enable Developer Mode (one-time, recommended):**
1. Windows Settings → **Privacy & security → For developers** → turn
   **Developer Mode** ON
2. Close and reopen PowerShell
3. Clear the corrupted partial downloads and retry:
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
   npm run build:portable
   ```

**Alternative — run as Administrator (no settings change, but needed every
build):** right-click PowerShell → "Run as administrator", `cd` into the
project folder, then run the same cleanup + build commands.

## Project structure

```
src/
├── main/            Electron main process (windows, IPC, remote server, storage)
├── preload/          contextBridge-exposed safe API for the renderer
└── renderer/         React app
    ├── components/    ScriptEditor, StylePanel, ScrollControls, PrompterView
    ├── hooks/         useScrollEngine (rAF-driven smooth scroll)
    └── store/         Zustand store for script/style/playback state
remote-control/        Standalone phone remote-control web page
```

## What's implemented (MVP + Phase 2 remote control)

- [x] Script editor with save/load (persisted via `electron-store`)
- [x] Smooth `requestAnimationFrame` auto-scroll, adjustable speed
- [x] Font size, line height, background opacity controls
- [x] Mirror mode (CSS flip, for physical teleprompter glass rigs)
- [x] Play / Pause / Restart controls
- [x] Global keyboard shortcuts
- [x] Frameless, transparent, always-on-top prompter window
- [x] Multi-monitor aware window placement
- [x] Phone remote control over local WebSocket

## What's not yet implemented (see blueprint.md Phase 2/3)

- Camera preview / recording (`getUserMedia` + `MediaRecorder`)
- Countdown timer before start
- Script bookmarks/markers
- Voice-tracking auto-scroll (Web Speech API)
- Bluetooth remote (currently Wi-Fi/WebSocket only)
- Code signing / auto-update for the installer

These are straightforward to add on top of this foundation — ask if you'd
like any of them scaffolded next.

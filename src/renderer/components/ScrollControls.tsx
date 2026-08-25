import { usePrompterStore } from '../store/prompterStore';

export default function ScrollControls() {
  const { isPlaying, togglePlaying, setPlaying } = usePrompterStore();

  const handleOpenPrompter = async () => {
    try {
      console.log('[renderer] Requesting prompter window open...');
      await window.teleprompter.openPrompter();
      console.log('[renderer] openPrompter() resolved.');
    } catch (err) {
      console.error('[renderer] Failed to open prompter window:', err);
    }
  };

  const handleClosePrompter = async () => {
    try {
      console.log('[renderer] Requesting prompter window close...');
      await window.teleprompter.closePrompter();
      console.log('[renderer] closePrompter() resolved.');
    } catch (err) {
      console.error('[renderer] Failed to close prompter window:', err);
    }
  };

  const handleTogglePlay = async () => {
    // Update the control panel's own button label immediately, then relay
    // the actual command to the prompter window — the two windows have
    // separate state, so this second step is what really matters.
    togglePlaying();
    try {
      await window.teleprompter.sendCommand('toggle');
    } catch (err) {
      console.error('[renderer] Failed to send toggle command:', err);
    }
  };

  const handleRestart = async () => {
    setPlaying(false);
    try {
      await window.teleprompter.sendCommand('restart');
    } catch (err) {
      console.error('[renderer] Failed to send restart command:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-black/20 border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white/80">Playback</h3>

      <div className="flex gap-2">
        <button
          onClick={handleTogglePlay}
          className="flex-1 px-4 py-2 rounded-md bg-accent hover:bg-blue-500 text-sm font-medium transition"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleRestart}
          className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium transition"
        >
          Restart
        </button>
      </div>

      <button
        onClick={handleOpenPrompter}
        className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
      >
        Open Prompter Window
      </button>

      <button
        onClick={handleClosePrompter}
        className="px-4 py-2 rounded-md bg-red-900/60 hover:bg-red-900 text-sm font-medium transition"
      >
        Close Prompter Window
      </button>
      <p className="text-xs text-white/40 -mt-1">
        Closing fully destroys the window — reopening creates a fresh one,
        useful if the display ever gets into a stuck or glitchy state.
      </p>

      <p className="text-xs text-white/40 leading-relaxed">
        Shortcuts (work globally, even while the prompter window isn't
        focused): <span className="text-white/70">Space</span> play/pause ·{' '}
        <span className="text-white/70">↑ / ↓</span> speed ·{' '}
        <span className="text-white/70">R</span> restart
      </p>
    </div>
  );
}

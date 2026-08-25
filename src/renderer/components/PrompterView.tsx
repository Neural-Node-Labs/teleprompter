import { useEffect, useRef } from 'react';
import { usePrompterStore } from '../store/prompterStore';
import { useScrollEngine } from '../hooks/useScrollEngine';

export default function PrompterView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    scriptText,
    fontSize,
    lineHeight,
    mirrored,
    speed,
    isPlaying,
    setScriptText,
    setFontSize,
    setLineHeight,
    setMirrored,
    setBgOpacity,
    setSpeed,
    togglePlaying,
    setPlaying,
    nudgeSpeed,
  } = usePrompterStore();

  const { restart } = useScrollEngine({
    isPlaying,
    speed,
    containerRef,
    contentRef,
  });

  // Pull whatever script/settings the control panel currently has as soon
  // as this window mounts. This matters because each Electron window has
  // its own isolated JS context — if the control panel changed anything
  // before this window existed, only a "current state" pull (rather than
  // relying purely on future push events) guarantees we start in sync.
  useEffect(() => {
    let cancelled = false;
    window.teleprompter.getInitialState().then(({ script, settings }) => {
      if (cancelled) return;
      setScriptText(script);
      setFontSize(settings.fontSize);
      setLineHeight(settings.lineHeight);
      setMirrored(settings.mirrored);
      setBgOpacity(settings.bgOpacity);
      setSpeed(settings.speed);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire up main-process events (keyboard shortcuts, remote control,
  // script/settings updates pushed from the control panel).
  useEffect(() => {
    const offScript = window.teleprompter.onScriptUpdate(setScriptText);
    const offSettings = window.teleprompter.onSettingsUpdate((settings) => {
      setFontSize(settings.fontSize);
      setLineHeight(settings.lineHeight);
      setMirrored(settings.mirrored);
      setBgOpacity(settings.bgOpacity);
      setSpeed(settings.speed);
    });
    const offToggle = window.teleprompter.onPlaybackToggle(togglePlaying);
    const offRestart = window.teleprompter.onPlaybackRestart(restart);
    const offSpeed = window.teleprompter.onSpeedChange(nudgeSpeed);
    const offRemote = window.teleprompter.onRemoteCommand((command) => {
      if (command === 'toggle') togglePlaying();
      if (command === 'play') setPlaying(true);
      if (command === 'pause') setPlaying(false);
      if (command === 'restart') restart();
      if (command === 'speed-up') nudgeSpeed('up');
      if (command === 'speed-down') nudgeSpeed('down');
    });

    return () => {
      offScript();
      offSettings();
      offToggle();
      offRestart();
      offSpeed();
      offRemote();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local keyboard shortcuts too, in case the prompter window has focus.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlaying();
      } else if (e.code === 'KeyR') {
        restart();
      } else if (e.code === 'ArrowUp') {
        nudgeSpeed('up');
      } else if (e.code === 'ArrowDown') {
        nudgeSpeed('down');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlaying, restart, nudgeSpeed]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden select-none cursor-default"
      // Background is a fixed solid color for readable contrast — actual
      // "opacity" is handled at the OS window level via setOpacity() in
      // the main process (see prompter:setSettings), since layering a
      // translucent CSS color on top of an equally-dark window background
      // produces no visible change no matter the alpha value.
      style={{ backgroundColor: '#0d0d0f' }}
      // Draggable region so the frameless window can still be moved.
      onDoubleClick={togglePlaying}
    >
      <div
        style={{ ['-webkit-app-region' as string]: 'drag' } as React.CSSProperties}
        className="h-6 w-full absolute top-0 left-0 z-10"
      />
      <div
        ref={contentRef}
        className="px-16 pt-[40vh] pb-[80vh] will-change-transform"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          transform: mirrored ? 'scaleX(-1)' : undefined,
          color: '#ffffff',
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
        }}
      >
        {scriptText}
      </div>
    </div>
  );
}

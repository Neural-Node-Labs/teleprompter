import { useEffect, useState } from 'react';
import ScriptEditor from './components/ScriptEditor';
import StylePanel from './components/StylePanel';
import ScrollControls from './components/ScrollControls';
import PrompterView from './components/PrompterView';
import { usePrompterStore } from './store/prompterStore';

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash.replace('#', '') || '/control');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace('#', '') || '/control');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

function ControlPanel() {
  const { setFontSize, setLineHeight, setMirrored, setBgOpacity, setSpeed } =
    usePrompterStore();

  // Resume whatever style settings were last used (auto-persisted to disk
  // whenever they change), so the control panel doesn't reset to hardcoded
  // defaults every time the app launches.
  useEffect(() => {
    window.teleprompter
      .getInitialState()
      .then(({ settings }) => {
        setFontSize(settings.fontSize);
        setLineHeight(settings.lineHeight);
        setMirrored(settings.mirrored);
        setBgOpacity(settings.bgOpacity);
        setSpeed(settings.speed);
      })
      .catch((err) => console.error('[renderer] Failed to load last settings:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-panel p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold">Teleprompter — Control Panel</h1>
        <p className="text-sm text-white/50">
          Write your script, adjust display settings, then open the prompter window.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <ScriptEditor />
        <div className="flex flex-col gap-4">
          <StylePanel />
          <ScrollControls />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  if (route === '/prompter') return <PrompterView />;
  return <ControlPanel />;
}

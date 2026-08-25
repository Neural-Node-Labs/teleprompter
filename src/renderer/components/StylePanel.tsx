import { useEffect, useState } from 'react';
import { usePrompterStore } from '../store/prompterStore';

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

export default function StylePanel() {
  const {
    fontSize,
    lineHeight,
    mirrored,
    bgOpacity,
    speed,
    setFontSize,
    setLineHeight,
    toggleMirror,
    setMirrored,
    setBgOpacity,
    setSpeed,
  } = usePrompterStore();

  const [presets, setPresets] = useState<string[]>([]);
  const [presetName, setPresetName] = useState('');

  const refreshPresets = async () => {
    try {
      const list = await window.teleprompter.listPresets();
      setPresets(list);
    } catch (err) {
      console.error('[renderer] Failed to list presets:', err);
    }
  };

  useEffect(() => {
    refreshPresets();
  }, []);

  // Relay style changes to the prompter window. Each Electron window has
  // its own isolated state, so sliders in the control panel only affect
  // the prompter once we explicitly push the values over IPC. This also
  // auto-persists as "last used settings" on the main-process side, so
  // whatever you land on is remembered next time you open the app — no
  // explicit save needed for that part.
  useEffect(() => {
    window.teleprompter
      .setPrompterSettings({ fontSize, lineHeight, mirrored, bgOpacity, speed })
      .catch((err) => console.error('[renderer] Failed to push settings:', err));
  }, [fontSize, lineHeight, mirrored, bgOpacity, speed]);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await window.teleprompter.savePreset(presetName.trim(), {
        fontSize,
        lineHeight,
        mirrored,
        bgOpacity,
        speed,
      });
      setPresetName('');
      refreshPresets();
    } catch (err) {
      console.error('[renderer] Failed to save preset:', err);
    }
  };

  const handleLoadPreset = async (name: string) => {
    try {
      const settings = await window.teleprompter.loadPreset(name);
      if (!settings) return;
      setFontSize(settings.fontSize);
      setLineHeight(settings.lineHeight);
      setMirrored(settings.mirrored);
      setBgOpacity(settings.bgOpacity);
      setSpeed(settings.speed);
    } catch (err) {
      console.error('[renderer] Failed to load preset:', err);
    }
  };

  const handleDeletePreset = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.teleprompter.deletePreset(name);
      refreshPresets();
    } catch (err) {
      console.error('[renderer] Failed to delete preset:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-black/20 border border-white/10 p-4">
      <h3 className="text-sm font-semibold text-white/80">Display Settings</h3>

      <Slider label="Font size" value={fontSize} min={20} max={120} suffix="px" onChange={setFontSize} />
      <Slider
        label="Line height"
        value={lineHeight}
        min={1}
        max={2.5}
        step={0.1}
        onChange={setLineHeight}
      />
      <Slider
        label="Window opacity"
        value={Math.round(bgOpacity * 100)}
        min={10}
        max={100}
        suffix="%"
        onChange={(v) => setBgOpacity(v / 100)}
      />
      <p className="text-xs text-white/40 -mt-2">
        Fades the whole prompter window (including text) so you can see
        through it — useful when layering it over a camera app.
      </p>
      <Slider
        label="Scroll speed"
        value={speed}
        min={5}
        max={400}
        suffix=" px/s"
        onChange={setSpeed}
      />

      <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
        <input type="checkbox" checked={mirrored} onChange={toggleMirror} className="accent-accent" />
        Mirror mode (for glass rig)
      </label>

      <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
        <h4 className="text-xs font-semibold text-white/60">Saved presets</h4>
        <div className="flex gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSavePreset}
            className="px-4 py-2 rounded-md bg-accent hover:bg-blue-500 text-sm font-medium transition"
          >
            Save
          </button>
        </div>

        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {presets.map((name) => (
              <button
                key={name}
                onClick={() => handleLoadPreset(name)}
                className="group flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs border border-white/10 transition"
              >
                {name}
                <span
                  onClick={(e) => handleDeletePreset(name, e)}
                  className="text-white/30 group-hover:text-white/70 ml-1"
                  title="Delete preset"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { usePrompterStore } from '../store/prompterStore';

export default function ScriptEditor() {
  const { scriptText, setScriptText } = usePrompterStore();
  const [savedScripts, setSavedScripts] = useState<string[]>([]);
  const [scriptName, setScriptName] = useState('');

  const refreshList = async () => {
    const list = await window.teleprompter.listScripts();
    setSavedScripts(list);
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleChange = (text: string) => {
    setScriptText(text);
    window.teleprompter.setScript(text);
  };

  const handleSave = async () => {
    if (!scriptName.trim()) return;
    await window.teleprompter.saveScript(scriptName.trim(), scriptText);
    setScriptName('');
    refreshList();
  };

  const handleLoad = async (name: string) => {
    const text = await window.teleprompter.loadScript(name);
    handleChange(text);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        value={scriptText}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 min-h-[300px] w-full rounded-lg bg-black/30 border border-white/10 p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Paste or write your script here..."
      />

      <div className="flex gap-2 items-center">
        <input
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
          placeholder="Script name..."
          className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-accent hover:bg-blue-500 text-sm font-medium transition"
        >
          Save
        </button>
      </div>

      {savedScripts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedScripts.map((name) => (
            <button
              key={name}
              onClick={() => handleLoad(name)}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs border border-white/10 transition"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { create } from 'zustand';

interface PrompterState {
  scriptText: string;
  fontSize: number; // px
  lineHeight: number; // multiplier
  mirrored: boolean;
  bgOpacity: number; // 0-1
  speed: number; // px/sec
  isPlaying: boolean;

  setScriptText: (text: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lh: number) => void;
  toggleMirror: () => void;
  setMirrored: (value: boolean) => void;
  setBgOpacity: (opacity: number) => void;
  setSpeed: (speed: number) => void;
  nudgeSpeed: (direction: 'up' | 'down') => void;
  togglePlaying: () => void;
  setPlaying: (playing: boolean) => void;
}

export const usePrompterStore = create<PrompterState>((set) => ({
  scriptText: 'Paste or write your script here...',
  fontSize: 48,
  lineHeight: 1.4,
  mirrored: false,
  bgOpacity: 0.6,
  speed: 60,
  isPlaying: false,

  setScriptText: (text) => set({ scriptText: text }),
  setFontSize: (size) => set({ fontSize: size }),
  setLineHeight: (lh) => set({ lineHeight: lh }),
  toggleMirror: () => set((s) => ({ mirrored: !s.mirrored })),
  setMirrored: (value) => set({ mirrored: value }),
  setBgOpacity: (opacity) => set({ bgOpacity: opacity }),
  setSpeed: (speed) => set({ speed: Math.max(5, Math.min(400, speed)) }),
  nudgeSpeed: (direction) =>
    set((s) => ({
      speed: Math.max(5, Math.min(400, s.speed + (direction === 'up' ? 10 : -10))),
    })),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
}));

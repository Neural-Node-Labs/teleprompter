export {};

declare global {
  interface Window {
    teleprompter: {
      openPrompter: () => Promise<void>;
      closePrompter: () => Promise<void>;
      setScript: (text: string) => Promise<void>;
      listDisplays: () => Promise<
        { id: number; label: string; bounds: { x: number; y: number; width: number; height: number } }[]
      >;
      setPrompterSettings: (settings: {
        fontSize?: number;
        lineHeight?: number;
        mirrored?: boolean;
        bgOpacity?: number;
        speed?: number;
      }) => Promise<void>;
      sendCommand: (command: string) => Promise<void>;
      getInitialState: () => Promise<{
        script: string;
        settings: {
          fontSize: number;
          lineHeight: number;
          mirrored: boolean;
          bgOpacity: number;
          speed: number;
        };
      }>;
      savePreset: (
        name: string,
        settings: {
          fontSize: number;
          lineHeight: number;
          mirrored: boolean;
          bgOpacity: number;
          speed: number;
        }
      ) => Promise<boolean>;
      listPresets: () => Promise<string[]>;
      loadPreset: (name: string) => Promise<{
        fontSize: number;
        lineHeight: number;
        mirrored: boolean;
        bgOpacity: number;
        speed: number;
      } | null>;
      deletePreset: (name: string) => Promise<boolean>;
      saveScript: (name: string, text: string) => Promise<boolean>;
      listScripts: () => Promise<string[]>;
      loadScript: (name: string) => Promise<string>;
      onScriptUpdate: (cb: (text: string) => void) => () => void;
      onSettingsUpdate: (
        cb: (settings: {
          fontSize: number;
          lineHeight: number;
          mirrored: boolean;
          bgOpacity: number;
          speed: number;
        }) => void
      ) => () => void;
      onPlaybackToggle: (cb: () => void) => () => void;
      onPlaybackRestart: (cb: () => void) => () => void;
      onSpeedChange: (cb: (direction: 'up' | 'down') => void) => () => void;
      onRemoteCommand: (cb: (command: string) => void) => () => void;
    };
  }
}

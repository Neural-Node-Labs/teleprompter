import { WebSocketServer } from 'ws';

export type RemoteCommand =
  | 'toggle'
  | 'play'
  | 'pause'
  | 'restart'
  | 'speed-up'
  | 'speed-down';

/**
 * Starts a small WebSocket server on the local network so a phone browser
 * can connect (e.g. via a simple HTML page) and send playback commands.
 * Kept intentionally simple — no auth, local-network only, for personal use.
 */
export function startRemoteServer(onCommand: (cmd: RemoteCommand) => void) {
  const PORT = 8787;
  const wss = new WebSocketServer({ port: PORT });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const { command } = JSON.parse(data.toString());
        if (command) onCommand(command as RemoteCommand);
      } catch {
        // ignore malformed messages
      }
    });
  });

  wss.on('error', (err) => {
    console.error('Remote server error:', err);
  });

  console.log(`Remote control server listening on ws://localhost:${PORT}`);
  return wss;
}

import { ClientConnection, PlayerState, HistoryRecord } from '../types';

export const GRID_SIZE = 10;


export const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => '')
);

// Active SSE clients.  When a client connects to the /events endpoint,
// their response is stored here until the connection closes.
export const clients: ClientConnection[] = [];

// Per‑player metadata.  Keys are client identifiers.  Used to track
// cooldowns between updates.
export const playerState: Record<string, PlayerState> = {};

// History of grid states.  Each entry contains a timestamp and a deep copy
// of the grid at that time. 
export const history: HistoryRecord[] = [];

/*
 * Generate a unique client identifier based on timestamp and random data.
 * Collision risk is negligible for the scale of this application.
*/
export function generateClientId(): string {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8)
  );
}

/*
 * Create a deep copy of the current grid.  Used when recording history to
 * avoid subsequent mutations leaking into snapshots.
*/
export function cloneGrid(): string[][] {
  return grid.map((row) => row.slice());
}

/*
 * Record the current grid state into the history.  If the most recent
 * history record is less than a second old, overwrite it; otherwise push
 * a new record.  This groups rapid updates into a single snapshot.
*/
export function recordHistory(timestamp: number): void {
  if (
    history.length === 0 ||
    timestamp - history[history.length - 1].timestamp > 1000
  ) {
    history.push({ timestamp, grid: cloneGrid() });
  } else {
    history[history.length - 1].grid = cloneGrid();
  }
}
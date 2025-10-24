import type http from 'http';
import { grid, GRID_SIZE, playerState, history, recordHistory } from '../models/store';
import { broadcast } from '../utils/sse';
import { clients } from '../models/store';

/*
 * Handle the `/update` POST endpoint.  Validates the incoming JSON,
 * enforces the per‑player cooldown and cell occupancy rules, updates the
 * grid and records history.  Responds with JSON indicating success or
 * failure.
 */
export function handleUpdateRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  let body = '';
  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    let data: any;
    try {
      data = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
      return;
    }
    const { clientId, row, col, char } = data;
    // Basic validation of input types
    if (
      typeof clientId !== 'string' ||
      typeof row !== 'number' ||
      typeof col !== 'number' ||
      typeof char !== 'string' ||
      char.length === 0
    ) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid data' }));
      return;
    }
    // Ensure the player exists
    const state = playerState[clientId];
    if (!state) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unknown client' }));
      return;
    }
    // Bounds check
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Out of bounds' }));
      return;
    }
    // Occupancy check
    if (grid[row][col] !== '') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Cell already used' }));
      return;
    }
    // Cooldown check
    const now = Date.now();
    if (state.lastUpdate !== null && now - state.lastUpdate < 60000) {
      const secs = Math.ceil((60000 - (now - state.lastUpdate)) / 1000);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: `You must wait ${secs} seconds before updating again`,
        })
      );
      return;
    }
    // Apply the update
    grid[row][col] = char;
    state.lastUpdate = now;
    // Record history
    recordHistory(now);
    // Broadcast the new grid to all clients
    broadcast(clients, 'grid', grid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  });
}
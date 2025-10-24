import type http from 'http';
import { clients, playerState, grid, history, generateClientId } from '../models/store';
import { sendEvent, broadcast } from '../utils/sse';

/*
 * Handle the `/events` endpoint.  Establishes a Server‑Sent Events
 * connection, assigns a unique client ID and sends initial state.  Also
 * cleans up when the client disconnects.
*/
export function handleEventRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Assign a new client ID and register this connection
  const clientId = generateClientId();
  const client = { id: clientId, res };
  clients.push(client);
  playerState[clientId] = { lastUpdate: null };

  // Send the initial payload: ID, current grid, player count and history count
  sendEvent(client, 'init', {
    clientId,
    grid,
    players: clients.length,
    historyCount: history.length,
  });

  // Broadcast the updated player count to everyone
  broadcast(clients, 'players', clients.length);

  // Remove the client when the connection closes
  req.on('close', () => {
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    delete playerState[clientId];
    broadcast(clients, 'players', clients.length);
  });
}
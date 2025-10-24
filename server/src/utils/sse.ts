import type http from 'http';
import { ClientConnection, HistoryRecord } from '../types';

/**
 * Send a named Server‑Sent Event to a particular client.  Data is
 * serialised as JSON.  A blank line signals the end of the event block.
 */
export function sendEvent(
  client: ClientConnection,
  event: string,
  data: any
): void {
  client.res.write(`event: ${event}\n`);
  client.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Broadcast an event to all active SSE clients.
 */
export function broadcast(
  clients: ClientConnection[],
  event: string,
  data: any
): void {
  for (const client of clients) {
    sendEvent(client, event, data);
  }
}
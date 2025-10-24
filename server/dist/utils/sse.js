"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEvent = sendEvent;
exports.broadcast = broadcast;
/**
 * Send a named Server‑Sent Event to a particular client.  Data is
 * serialised as JSON.  A blank line signals the end of the event block.
 */
function sendEvent(client, event, data) {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
}
/**
 * Broadcast an event to all active SSE clients.
 */
function broadcast(clients, event, data) {
    for (const client of clients) {
        sendEvent(client, event, data);
    }
}

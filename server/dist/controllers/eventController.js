"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEventRequest = handleEventRequest;
const store_1 = require("../models/store");
const sse_1 = require("../utils/sse");
/**
 * Handle the `/events` endpoint.  Establishes a Server‑Sent Events
 * connection, assigns a unique client ID and sends initial state.  Also
 * cleans up when the client disconnects.
 */
function handleEventRequest(req, res) {
    // Configure headers for SSE.  CORS is allowed here because the client
    // originates from the same server; adjust as needed for deployments.
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });
    // Assign a new client ID and register this connection
    const clientId = (0, store_1.generateClientId)();
    const client = { id: clientId, res };
    store_1.clients.push(client);
    store_1.playerState[clientId] = { lastUpdate: null };
    // Send the initial payload: ID, current grid, player count and history count
    (0, sse_1.sendEvent)(client, 'init', {
        clientId,
        grid: store_1.grid,
        players: store_1.clients.length,
        historyCount: store_1.history.length,
    });
    // Broadcast the updated player count to everyone
    (0, sse_1.broadcast)(store_1.clients, 'players', store_1.clients.length);
    // Remove the client when the connection closes
    req.on('close', () => {
        const index = store_1.clients.findIndex((c) => c.id === clientId);
        if (index !== -1) {
            store_1.clients.splice(index, 1);
        }
        delete store_1.playerState[clientId];
        (0, sse_1.broadcast)(store_1.clients, 'players', store_1.clients.length);
    });
}

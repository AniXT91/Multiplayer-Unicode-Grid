"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdateRequest = handleUpdateRequest;
const store_1 = require("../models/store");
const sse_1 = require("../utils/sse");
const store_2 = require("../models/store");
/**
 * Handle the `/update` POST endpoint.  Validates the incoming JSON,
 * enforces the per‑player cooldown and cell occupancy rules, updates the
 * grid and records history.  Responds with JSON indicating success or
 * failure.
 */
function handleUpdateRequest(req, res) {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString();
    });
    req.on('end', () => {
        let data;
        try {
            data = JSON.parse(body);
        }
        catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            return;
        }
        const { clientId, row, col, char } = data;
        // Basic validation of input types
        if (typeof clientId !== 'string' ||
            typeof row !== 'number' ||
            typeof col !== 'number' ||
            typeof char !== 'string' ||
            char.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid data' }));
            return;
        }
        // Ensure the player exists
        const state = store_1.playerState[clientId];
        if (!state) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Unknown client' }));
            return;
        }
        // Bounds check
        if (row < 0 || row >= store_1.GRID_SIZE || col < 0 || col >= store_1.GRID_SIZE) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Out of bounds' }));
            return;
        }
        // Occupancy check
        if (store_1.grid[row][col] !== '') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Cell already used' }));
            return;
        }
        // Cooldown check
        const now = Date.now();
        if (state.lastUpdate !== null && now - state.lastUpdate < 60000) {
            const secs = Math.ceil((60000 - (now - state.lastUpdate)) / 1000);
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: `You must wait ${secs} seconds before updating again`,
            }));
            return;
        }
        // Apply the update
        store_1.grid[row][col] = char;
        state.lastUpdate = now;
        // Record history
        (0, store_1.recordHistory)(now);
        // Broadcast the new grid to all clients
        (0, sse_1.broadcast)(store_2.clients, 'grid', store_1.grid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    });
}

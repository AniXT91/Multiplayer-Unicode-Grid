"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.history = exports.playerState = exports.clients = exports.grid = exports.GRID_SIZE = void 0;
exports.generateClientId = generateClientId;
exports.cloneGrid = cloneGrid;
exports.recordHistory = recordHistory;
// Grid dimensions.  All clients share a single GRID_SIZE × GRID_SIZE matrix.
exports.GRID_SIZE = 10;
// The shared grid.  Each cell is a string; empty strings represent unused
// cells.  Exporting this array allows controllers to mutate it directly.
exports.grid = Array.from({ length: exports.GRID_SIZE }, () => Array.from({ length: exports.GRID_SIZE }, () => ''));
// Active SSE clients.  When a client connects to the /events endpoint,
// their response is stored here until the connection closes.
exports.clients = [];
// Per‑player metadata.  Keys are client identifiers.  Used to track
// cooldowns between updates.
exports.playerState = {};
// History of grid states.  Each entry contains a timestamp and a deep copy
// of the grid at that time.  The last entry may be overwritten if a new
// update occurs within one second of it.
exports.history = [];
/**
 * Generate a unique client identifier based on timestamp and random data.
 * Collision risk is negligible for the scale of this application.
 */
function generateClientId() {
    return (Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8));
}
/**
 * Create a deep copy of the current grid.  Used when recording history to
 * avoid subsequent mutations leaking into snapshots.
 */
function cloneGrid() {
    return exports.grid.map((row) => row.slice());
}
/**
 * Record the current grid state into the history.  If the most recent
 * history record is less than a second old, overwrite it; otherwise push
 * a new record.  This groups rapid updates into a single snapshot.
 */
function recordHistory(timestamp) {
    if (exports.history.length === 0 ||
        timestamp - exports.history[exports.history.length - 1].timestamp > 1000) {
        exports.history.push({ timestamp, grid: cloneGrid() });
    }
    else {
        exports.history[exports.history.length - 1].grid = cloneGrid();
    }
}

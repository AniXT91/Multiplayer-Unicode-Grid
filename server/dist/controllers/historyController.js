"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHistoryRequest = handleHistoryRequest;
const store_1 = require("../models/store");
/**
 * Handle the `/history` GET endpoint.  With no query parameters it returns
 * an array of timestamps.  When the `index` query parameter is provided
 * it returns the grid snapshot at that index.
 */
function handleHistoryRequest(req, res, parsedUrl) {
    const indexParam = parsedUrl.query['index'];
    if (typeof indexParam === 'string') {
        const idx = parseInt(indexParam, 10);
        if (Number.isNaN(idx) || idx < 0 || idx >= store_1.history.length) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid history index' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ index: idx, grid: store_1.history[idx].grid }));
        return;
    }
    // No index provided; return an array of timestamps
    const timestamps = store_1.history.map((h) => h.timestamp);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(timestamps));
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const eventController_1 = require("./controllers/eventController");
const updateController_1 = require("./controllers/updateController");
const historyController_1 = require("./controllers/historyController");
const staticController_1 = require("./controllers/staticController");
/**
 * Central request handler.  Routes incoming HTTP requests to the appropriate
 * controller based on the path and method.  All unsupported routes fall
 * back to the static file server.
 */
function requestHandler(req, res) {
    const parsedUrl = url_1.default.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';
    const method = req.method || 'GET';
    if (pathname === '/events' && method === 'GET') {
        (0, eventController_1.handleEventRequest)(req, res);
        return;
    }
    if (pathname === '/update' && method === 'POST') {
        (0, updateController_1.handleUpdateRequest)(req, res);
        return;
    }
    if (pathname === '/history' && method === 'GET') {
        (0, historyController_1.handleHistoryRequest)(req, res, parsedUrl);
        return;
    }
    // Default to static file serving
    (0, staticController_1.serveStaticFile)(req, res);
}
// Create and start the HTTP server
const server = http_1.default.createServer(requestHandler);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

import http from 'http';
import url from 'url';
import { handleEventRequest } from './controllers/eventController';
import { handleUpdateRequest } from './controllers/updateController';
import { handleHistoryRequest } from './controllers/historyController';
import { serveStaticFile } from './controllers/staticController';


function requestHandler(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = parsedUrl.pathname || '/';
  const method = req.method || 'GET';
  if (pathname === '/events' && method === 'GET') {
    handleEventRequest(req, res);
    return;
  }
  if (pathname === '/update' && method === 'POST') {
    handleUpdateRequest(req, res);
    return;
  }
  if (pathname === '/history' && method === 'GET') {
    handleHistoryRequest(req, res, parsedUrl);
    return;
  }
  // Default to static file serving
  serveStaticFile(req, res);
}

// Create and start the HTTP server
const server = http.createServer(requestHandler);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
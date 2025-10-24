import fs from 'fs';
import path from 'path';
import type http from 'http';

export function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse): void {
  const basePath = path.join(__dirname, '..', '..', '..', 'client'); // go up 3 levels
  let pathname = req.url === '/' ? '/index.html' : req.url!;
  const filePath = path.join(basePath, pathname);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType =
      ext === '.html' ? 'text/html' :
      ext === '.js' ? 'text/javascript' :
      ext === '.css' ? 'text/css' : 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
}

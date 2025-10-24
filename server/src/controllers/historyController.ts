import type http from 'http';
import { history } from '../models/store';


export function handleHistoryRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  parsedUrl: { query: { [key: string]: string | string[] | undefined } }
): void {
  const indexParam = parsedUrl.query['index'];
  if (typeof indexParam === 'string') {
    const idx = parseInt(indexParam, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= history.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid history index' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ index: idx, grid: history[idx].grid }));
    return;
  }
  // No index provided; return an array of timestamps
  const timestamps = history.map((h) => h.timestamp);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(timestamps));
}
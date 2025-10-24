import type http from 'http';


export interface ClientConnection {
  id: string;
  res: http.ServerResponse;
}


export interface PlayerState {
  lastUpdate: number | null;
}


export interface HistoryRecord {
  timestamp: number;
  grid: string[][];
}
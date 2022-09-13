import { WebSocket } from "ws";
export = EulerToolClient;
declare class EulerToolClient {
  constructor(opts: any);
  opts: any;
  nextId: number;
  cbs: {};
  timeoutHandles: {};
  subs: {};
  pendingMessagesToSend: any[];
  reconnectTimeout: number;
  heartBeatInterval: NodeJS.Timer;
  connect(): void;
  ws: WebSocket;
  timeoutWatcher: NodeJS.Timeout;
  send(cmd: any, body: any, cb: any, idOverride: any, timeout: any): any;
  sendAsync(cmd: any, body: any, timeout: any): Promise<any>;
  sub(sub: any, cb: any): any;
  unsubscribe(id: any): void;
  clearId(id: any): void;
  shutdown(): void;
  shuttingDown: boolean;
}

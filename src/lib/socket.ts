import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

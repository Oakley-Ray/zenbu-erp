import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000/ws';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return sharedSocket;
}

/** 連線到 WebSocket 並認證 */
export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]!));

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('auth', {
        userId: payload.sub,
        tenantId: payload.tenantId,
      });
    } catch {}

    return () => {
      // 不斷開共用 socket，只在頁面離開時斷開
    };
  }, []);

  const joinProject = useCallback((projectId: string) => {
    socketRef.current.emit('join-project', { projectId });
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    socketRef.current.emit('leave-project', { projectId });
  }, []);

  const emitTaskUpdate = useCallback((projectId: string, taskId: string, changes: Record<string, unknown>) => {
    socketRef.current.emit('task-update', { projectId, taskId, changes });
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current.on(event, handler);
    return () => { socketRef.current.off(event, handler); };
  }, []);

  return { socket: socketRef.current, joinProject, leaveProject, emitTaskUpdate, on };
}

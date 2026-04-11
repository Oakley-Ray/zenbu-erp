import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserSocket extends Socket {
  userId?: string;
  tenantId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  /** userId → Set<socketId> */
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: UserSocket) {
    // 客戶端連線後需 emit 'auth' 事件
  }

  handleDisconnect(client: UserSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(client.userId);
      }
    }
  }

  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { userId: string; tenantId: string },
  ) {
    client.userId = data.userId;
    client.tenantId = data.tenantId;

    // 加入 tenant room 和 user room
    client.join(`tenant:${data.tenantId}`);
    client.join(`user:${data.userId}`);

    // 追蹤 user sockets
    if (!this.userSockets.has(data.userId)) {
      this.userSockets.set(data.userId, new Set());
    }
    this.userSockets.get(data.userId)!.add(client.id);

    return { status: 'authenticated' };
  }

  /** 加入特定專案房間（用於即時協作） */
  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { projectId: string },
  ) {
    client.join(`project:${data.projectId}`);
    // 通知其他人有人加入
    client.to(`project:${data.projectId}`).emit('user-joined', {
      userId: client.userId,
      projectId: data.projectId,
    });
    return { status: 'joined', projectId: data.projectId };
  }

  /** 離開專案房間 */
  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { projectId: string },
  ) {
    client.leave(`project:${data.projectId}`);
    client.to(`project:${data.projectId}`).emit('user-left', {
      userId: client.userId,
      projectId: data.projectId,
    });
  }

  /** 任務更新廣播（即時協作核心） */
  @SubscribeMessage('task-update')
  handleTaskUpdate(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { projectId: string; taskId: string; changes: Record<string, unknown> },
  ) {
    // 廣播給同專案的其他使用者
    client.to(`project:${data.projectId}`).emit('task-updated', {
      taskId: data.taskId,
      changes: data.changes,
      updatedBy: client.userId,
    });
  }

  // ── Server-side emit methods (供其他 service 呼叫) ──

  /** 發送通知給特定使用者 */
  sendNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /** 廣播專案事件給所有在專案房間的人 */
  broadcastProjectEvent(projectId: string, event: string, data: unknown) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  /** 廣播給整個租戶 */
  broadcastToTenant(tenantId: string, event: string, data: unknown) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}

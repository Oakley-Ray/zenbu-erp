import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(params: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
  }): Promise<Notification> {
    const notif = this.notifRepo.create(params);
    return this.notifRepo.save(notif);
  }

  /** 發送通知給多個使用者 */
  async broadcast(params: {
    tenantId: string;
    userIds: string[];
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
  }): Promise<void> {
    const notifications = params.userIds.map((userId) =>
      this.notifRepo.create({
        tenantId: params.tenantId,
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      }),
    );
    await this.notifRepo.save(notifications);
  }

  async findByUser(tenantId: string, userId: string, opts?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.notifRepo
      .createQueryBuilder('n')
      .where('n.tenantId = :tenantId', { tenantId })
      .andWhere('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.unreadOnly) {
      qb.andWhere('n.read = false');
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.notifRepo.count({
      where: { tenantId, userId, read: false },
    });
  }

  async markAsRead(tenantId: string, userId: string, id: string): Promise<void> {
    await this.notifRepo.update({ id, tenantId, userId }, { read: true });
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.notifRepo.update({ tenantId, userId, read: false }, { read: true });
  }
}

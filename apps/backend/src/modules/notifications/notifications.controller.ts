import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtPayload } from '@layerframe/shared-types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findByUser(req.user.tenantId, req.user.sub, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: { user: JwtPayload }) {
    return this.notificationsService.getUnreadCount(req.user.tenantId, req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.notificationsService.markAsRead(req.user.tenantId, req.user.sub, id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: { user: JwtPayload }) {
    return this.notificationsService.markAllAsRead(req.user.tenantId, req.user.sub);
  }
}

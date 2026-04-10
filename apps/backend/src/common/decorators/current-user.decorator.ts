import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@layerframe/shared-types';

/** 從 request.user 取出目前登入的使用者資訊 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

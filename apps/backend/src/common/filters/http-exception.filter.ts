import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 全域例外過濾器 — 統一 API 錯誤回應格式。
 * 所有未捕獲的 HttpException 都會經過這裡。
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();

    const errorBody =
      typeof exceptionResponse === 'string'
        ? { statusCode: status, message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown>);

    response.status(status).json({
      ...errorBody,
      timestamp: new Date().toISOString(),
    });
  }
}

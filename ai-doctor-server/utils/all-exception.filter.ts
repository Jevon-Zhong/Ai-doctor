import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MyLogger } from './no-timestamp-logger';

@Catch() // @Catch() 装饰器：标记这个类为“异常过滤器”
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new MyLogger(); //初始化·
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    // 如果是 HttpException 类型，则使用其提供的状态码和信息
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string' ? res : (res as any)?.message || message;
    }
    // 是标准 JS Error，如：throw new Error('xxx')
    else if (exception instanceof Error) {
      message = exception.message || message;
    }
    // 错误信息
    console.error('【全局异常捕获】', exception);
    this.logger.error(message + request.url);
    response.status(status).json({
      statusCode: status,
      message,
      data: null,
      api: request.url,
    });
  }
}

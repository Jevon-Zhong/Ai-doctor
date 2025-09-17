//启动文件，应用入口
//NestFactory,用于创建应用实例的工厂类
import { NestFactory } from '@nestjs/core';
//根模块，Nest应用的起点，所有功能模块会被注册到该模块中
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionFilter } from '../utils/all-exception.filter'
import { TransformInterceptor } from '../utils/transform.interceptor'
import { MyLogger } from '../utils/no-timestamp-logger'
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,//自动去掉没有定义的字段
      forbidNonWhitelisted: true //如果有多余的字段抛出错误
    })
  )
  //注册全局异常过滤器
  app.useGlobalFilters(new AllExceptionFilter())
  //注册全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor())
  //监听3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

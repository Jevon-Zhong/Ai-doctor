//启动文件，应用入口
//NestFactory,用于创建应用实例的工厂类
import { NestFactory } from '@nestjs/core';
//根模块，Nest应用的起点，所有功能模块会被注册到该模块中
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionFilter } from '../utils/all-exception.filter'
import { TransformInterceptor } from '../utils/transform.interceptor'
import { MyLogger } from '../utils/no-timestamp-logger'
import express from 'express';
import { join } from 'path';
import { MCP_CLIENT_TOKEN } from './mcp/mcp.module'; // 导入令牌
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });
  //访问静态资源
  app.use('/uploadImgs', express.static(join(process.cwd(), 'uploadImgs')))
  //给所有接口后面加上自定义前缀
  // app.setGlobalPrefix('api')
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
  //允许跨域
  app.enableCors({
    origin: '*'
  })
  
  // 从依赖注入容器中获取mcpClient实例（与其他地方的实例一致）
  const mcpClient = app.get(MCP_CLIENT_TOKEN);
  //监听3000
  await app.listen(process.env.PORT ?? 3000, async () => {
    console.log('ai-doctor服务启动成功， 端口号是3000')
    try {
      await mcpClient.connectToServer()
    } catch (error) {
      console.error('mcp服务器连接失败', error)
    }
  });
}
bootstrap();

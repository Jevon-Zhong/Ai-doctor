//应用的根模块，是整个应用的组织核心
import { Module } from '@nestjs/common';
import { UserinfoModule } from './userinfo/userinfo.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { FilemanagementModule } from './filemanagement/filemanagement.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from '@nestjs-modules/ioredis';
@Module({
  //引入模块
  imports: [
    UserinfoModule,
    FilemanagementModule,
    ChatModule,
    //加载环境变量
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //连接mongodb数据库
    MongooseModule.forRootAsync({
      inject: [ConfigService],//注入依赖
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 1000,//超时时间
        connectTimeoutMS: 1000,//超时时间
        socketTimeoutMS: 2000, //socket响应时间
      })
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],//注入依赖
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '10d' },
      })
    }),
    //连接redis数据库
    RedisModule.forRootAsync({
      inject: [ConfigService],//注入依赖
      useFactory: (config: ConfigService) => ({
        type: 'single',
        options: {
          host:config.get('REDIS_HOST'),
          port:config.get('REDIS_PORT')
        }
      }),
    }),
  ],
})
export class AppModule { }

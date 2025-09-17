import { Module } from '@nestjs/common';
import { UserinfoController } from './userinfo.controller';
import { UserinfoService } from './userinfo.service';
import { UserInfo, UserInfoSchema } from '../userinfo/userinfo.schema'
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
    //注册mongodb的数据模型
    imports: [
        MongooseModule.forFeature([ 
            //UserInfo.name获取class名称：USerInfo
            { name: UserInfo.name, schema: UserInfoSchema }
        ])
    ],
    controllers: [UserinfoController],
    providers: [UserinfoService]
})
export class UserinfoModule { }

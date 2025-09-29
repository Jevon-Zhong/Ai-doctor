import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FilemanagementModule } from 'src/filemanagement/filemanagement.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatData, ChatDataSchema } from './chat.schema';

@Module({
    //注册mongodb的数据模型
    imports: [
        FilemanagementModule,
        MongooseModule.forFeature([
            { name: ChatData.name, schema: ChatDataSchema }
        ])
    ],
    controllers: [ChatController],
    providers: [ChatService]
})
export class ChatModule { }

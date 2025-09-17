import { Module } from '@nestjs/common';
import { FilemanagementController } from './filemanagement.controller';
import { FilemanagementService } from './filemanagement.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Filemanagement, FilemanagementSchema } from './filemanegement.schema';

@Module({
    //注册mongodb的数据模型
    imports: [
        MongooseModule.forFeature([
            { name: Filemanagement.name, schema: FilemanagementSchema }
        ])
    ],
    controllers: [FilemanagementController],
    providers: [FilemanagementService]
})
export class FilemanagementModule {

}

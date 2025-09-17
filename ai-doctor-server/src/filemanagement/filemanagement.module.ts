import { Module } from '@nestjs/common';
import { FilemanagementController } from './filemanagement.controller';
import { FilemanagementService } from './filemanagement.service';

@Module({
    controllers: [FilemanagementController],
    providers: [FilemanagementService]
})
export class FilemanagementModule {

}

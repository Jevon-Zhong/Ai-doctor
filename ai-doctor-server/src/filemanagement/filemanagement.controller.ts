import { BadRequestException, Controller, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/auth.guard';
import { Filemanagement } from './filemanegement.schema';
import { Model } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'
import { extname } from 'path';
import { FilemanagementService } from './filemanagement.service';
//处理上传的文件
const uploadFileInterceptor = FileFieldsInterceptor([{ name: 'file', maxCount: 3 }], {
    storage: diskStorage({
        destination: './uploads',//文件存储的目录
        filename: (req, file, callback) => {
            //对文件重新命名
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`
            callback(null, uniqueName)
        },
    }),
    //文件过滤
    fileFilter: (req, file, callback) => {
        //允许上传文件类型
        const allowedType = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ]
        if (!allowedType.includes(file.mimetype)) {
            return callback(new BadRequestException('只允许上传PDF或DOCX文件'), false)
        }
        callback(null, true)
    },
    //文件限制大小
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})


@Controller('filemanagement')
export class FilemanagementController {
    constructor(
        @InjectModel(Filemanagement.name)
        private readonly FilemanagementModel: Model<Filemanagement>,
        private readonly filemanagementService: FilemanagementService
    ) { }
    //上传文件（知识库）
    @Post('uploadkb')
    @UseGuards(AuthGuard)
    @UseInterceptors(uploadFileInterceptor)
    async uploadFile(
        @Req() req: { user: { token: string } },
        @UploadedFiles() files: { file: Express.Multer.File[] }) {
        const userId = req.user.token
        // console.log(req.user.token)
        console.log(files.file)
        //处理上传到文档，
        for (const file of files.file) {
            //1.读取文档
            const {rawText, splitDocument} = await this.filemanagementService.readFile(file, 'UB')
            //2.上传数据库
            const docID = await this.filemanagementService.uploadFile(file, userId, rawText, 'UB')
        }
    }
}


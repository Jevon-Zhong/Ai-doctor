import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from 'src/auth/auth.guard';
import { Filemanagement } from './filemanegement.schema';
import { Model, Types } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'
import { extname } from 'path';
import { FilemanagementService } from './filemanagement.service';
import { DeletefileDto, DeleteImageDto } from './filemanagement.dto';
import { ConfigService } from '@nestjs/config';
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

//处理上传的图片
const uploadImageInterceptor = FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
    storage: diskStorage({
        destination: './uploadImgs',//文件存储的目录
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
            'image/jpg',
            'image/jpeg',
            'image/png',
            'image/webp'
        ]
        if (!allowedType.includes(file.mimetype)) {
            return callback(new BadRequestException('只支持上传jpg、jpeg、png、webp格式的文件'), false)
        }
        callback(null, true)
    },
    //文件限制大小
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})


@Controller('filemanagement')
export class FilemanagementController {
    constructor(
        @InjectModel(Filemanagement.name)
        private readonly FilemanagementModel: Model<Filemanagement>,
        private readonly filemanagementService: FilemanagementService,
        private configService: ConfigService
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
        // console.log(files.file)
        const documentIds: Types.ObjectId[] = []
        //处理上传到文档(for遍历处理多文件，推荐使用队列处理)
        for (const file of files.file) {
            //将字符使用latin1转回buffer，再重新哟高utf-8的方式编码 
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
            //1.读取文档
            const { rawText, splitDocument } = await this.filemanagementService.readFile(file, 'UB')
            //2.上传数据库
            const docID = await this.filemanagementService.uploadFile(file, userId, rawText, 'UB')
            //3.向量，存储向量数据库
            const originalname = await this.filemanagementService.vectorStorage(file, splitDocument, userId, docID)
            console.log(originalname)
            documentIds.push(docID)
        }
        return {
            result: documentIds
        }
    }

    //上传图片
    @Post('uploadimage')
    @UseGuards(AuthGuard)
    @UseInterceptors(uploadImageInterceptor)
    async uploadImage(
        @UploadedFiles() files: { file: Express.Multer.File[] }) {
        //拼接图片地址，返回前端给用户看得到
        const baseUrl = this.configService.get('IP_ADDR')
        const imageUrl = `${baseUrl}/uploadImgs/${files.file[0].filename}`
        return {
            result: {
                imagePath: files.file[0].path.split('uploadImgs/')[1],
                mimeType: files.file[0].mimetype,
                imageUrl
            }
        }
    }

    //删除知识库指定文件
    @Delete('deletefilekb/:docId')
    @UseGuards(AuthGuard)
    async deleteFileKb(
        @Req() req: { user: { token: string } },
        @Param() param: any
    ) {
        const { docId } = param
        const userId = req.user.token
        return await this.filemanagementService.deleteFileKb(userId, docId)
    }

    //获取知识库文件列表
    @Get('kbfilelist')
    @UseGuards(AuthGuard)
    async kbFileList(
        @Req() req: { user: { token: string } }
    ) {
        const userId = req.user.token
        const res = await this.FilemanagementModel.aggregate([
            { $match: { userId, uploadType: 'UB' } },
            {
                $project: {
                    docId: '$_id',
                    fileName: 1,
                    fileType: 1,
                    fileSize: 1,
                    _id: 0
                }
            }
        ])
        return {
            result: res
        }
    }

    //对话框文件上传
    @Post('uploaddialog')
    @UseGuards(AuthGuard)
    @UseInterceptors(uploadFileInterceptor)
    async uploadDialog(
        @Req() req: { user: { token: string } },
        @UploadedFiles() files: { file: Express.Multer.File[] }) {
        const userId = req.user.token
        // const documentIds: Types.ObjectId[] = []
        const uploadfileList: {
            docId: string,
            fileName: string,
            fileType: string,
            fileSize: string,
        }[] = []
        //处理上传到文档(for遍历处理多文件，推荐使用队列处理)
        for (const file of files.file) {
            //将字符使用latin1转回buffer，再重新用utf8的方式编码 
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
            //1.读取文档
            const { rawText } = await this.filemanagementService.readFile(file, 'UB')
            //2.上传数据库
            const docID = await this.filemanagementService.uploadFile(file, userId, rawText, 'UB')
            // documentIds.push(docID)
            uploadfileList.push({
                docId: String(docID),
                fileName: file.originalname,
                fileType: file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX',
                fileSize: `${(file.size / 1024).toFixed(2)}kb`
            })
        }
        return {
            result: uploadfileList
        }
    }

    //对话框删除文件
    @Delete('deletefile/:docId')
    @UseGuards(AuthGuard)
    async deleteFile(
        @Req() req: { user: { token: string } },
        // @Body() body: DeletefileDto
        @Param() param: any
    ) {
        const { docId } = param
        console.log(docId)
        const userId = req.user.token
        return await this.filemanagementService.deleteFile(userId, docId)
    }

    //删除图片
    @Delete('deleteimage/:imagePath')
    @UseGuards(AuthGuard)
    async deleteImage(
        @Param() param: DeleteImageDto
    ) {
        const { imagePath } = param
        console.log(imagePath)
        return this.filemanagementService.deleteImage(imagePath)
    }
}


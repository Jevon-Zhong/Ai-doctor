import { Injectable } from '@nestjs/common';
//读取pdf
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//读取docx
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
//文本拆分
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from '@langchain/core/documents';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Filemanagement } from './filemanegement.schema';
@Injectable()
export class FilemanagementService {
    constructor(
        //注入模型
        @InjectModel(Filemanagement.name)
        private filemanagementModel: Model<Filemanagement>
    ) { }
    //读取文档，知识库需要拆分文档，对话框上传的不拆分, 'UD'对话框, 'UB'知识库
    async readFile(file: Express.Multer.File, uploadFile: 'UD' | 'UB') {
        //判断文件类型
        const fileType = file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX'
        //1.读取文档
        const loader = fileType === 'PDF' ? new PDFLoader(file.path) : new DocxLoader(file.path)
        const docs = await loader.load()
        //2.拆分文档（主要针对知识库上传的才拆分，以及pdf，将pdf合并为一个整串)
        const first = docs[0]
        for (const doc of docs) {
            first.pageContent += '\n' + doc.pageContent
        }
        console.log(first)
        let docOutput: Document<Record<string, any>>[] = []
        //按照字符拆分
        if (uploadFile === 'UB') {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 800, //每段最大字符数
                chunkOverlap: 100,//每段之间的重叠字符数
            });
            docOutput = await splitter.splitDocuments([first]);
        }
        return {
            rawText: first.pageContent,//完整的文本
            splitDocument: docOutput//拆分后的文本
        }
    }

    //上传文件到数据库
    async uploadFile(file: Express.Multer.File, userId: string, fileText: string, uploadType: 'UD' | 'UB') {
        const fileType = file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX'
        const docId = await this.filemanagementModel.create({
            userId,
            fileName: file.originalname,
            filePath: file.path,
            fileType,
            fileSize: `${(file.size / 1024).toFixed(2)}kb`,
            fileText,
            uploadType
        })
        return docId._id
    }
}

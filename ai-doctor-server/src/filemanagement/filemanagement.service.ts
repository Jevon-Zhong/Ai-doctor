import { BadRequestException, Injectable } from '@nestjs/common';
//读取pdf
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//读取docx
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
//文本拆分
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from '@langchain/core/documents';
import { Collection, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Filemanagement } from './filemanegement.schema';
import { ConfigService } from '@nestjs/config';
import { MilvusClient, DataType, WeightedRanker, SearchResultData } from "@zilliz/milvus2-sdk-node";
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs'
import { kwExtractionPrompt } from 'src/chat/roleDefinition';
@Injectable()
export class FilemanagementService {
    private client: MilvusClient
    private openai: OpenAI
    constructor(
        //注入模型
        @InjectModel(Filemanagement.name)
        private filemanagementModel: Model<Filemanagement>,
        private configService: ConfigService,
    ) {
        //向量数据库连接
        this.client = new MilvusClient({
            address: this.configService.get('MILVUS_ADDRESS') as string
        });
        //通义千问
        this.openai = new OpenAI({
            apiKey: this.configService.get('QWEN_API_KEY') as string,
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        })
    }
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

    //创建集合
    async createCollection(collectionName: string) {
        //创建schema
        const fields = [
            {
                name: "id", //字段名称
                data_type: DataType.Int64, //字段类型
                is_primary_key: true, //是否是主键
                autoID: true, //是否自增
                description: '主键id字段'
            },
            {
                name: "docId", //文档id
                data_type: DataType.VarChar,
                description: '文档id',
                max_length: 100
            },
            {
                name: "docTitle", //文档id
                data_type: DataType.VarChar,
                description: '文档标题',
                max_length: 500
            },
            {
                name: "docText", //文档id
                data_type: DataType.VarChar,
                description: '文档切块的片段',
                max_length: 9000
            },
            {
                name: "embedDocTitle",
                data_type: DataType.FloatVector,
                description: '向量的文档标题',
                dim: 1536 //维度
            },
            {
                name: "embedDocText",
                data_type: DataType.FloatVector,
                description: '向量的文档内容片段',
                dim: 1536 //维度
            },
        ]

        // 创建索引
        const index_params = [
            {
                field_name: "id",
                index_type: "AUTOINDEX"
            },
            {
                field_name: "docId",
                index_type: "AUTOINDEX",
            },
            {
                field_name: "docTitle",
                index_type: "AUTOINDEX",
            },
            {
                field_name: "embedDocTitle",
                index_type: "AUTOINDEX",
                metric_type: "COSINE" //余弦相似度
            },
            {
                field_name: "embedDocText",
                index_type: "AUTOINDEX",
                metric_type: "COSINE" //余弦相似度
            },
        ]

        //创建collection
        await this.client.createCollection({
            collection_name: collectionName,//不能以数字开头
            fields,
            index_params,
        })
        //释放集合，以免占用内存
        await this.client.releaseCollection({ collection_name: collectionName })
    }

    // 使用阿里云向量模型将切块文档数组转换成向量数组
    async QwenEmbedding(splitDocument: Document<Record<string, any>>[] | [{ pageContent: string }]) {
        const completion = await this.openai.embeddings.create({
            model: 'text-embedding-v2',
            input: splitDocument.map(item => item.pageContent),
            dimensions: 1536
        })
        return completion.data
    }

    //插入向量数据库
    async insertData(
        collectionName: string,
        originalname: string,
        docId: Types.ObjectId,
        splitDocument: Document<Record<string, any>>[],
        vectorsDocTitle: OpenAI.Embeddings.Embedding[],
        vectorsDocText: OpenAI.Embeddings.Embedding[]
    ) {
        const group = splitDocument.map((item, index) => ({
            docId: docId.toString(),
            docTitle: originalname,
            docText: item.pageContent,
            embedDocTitle: vectorsDocTitle[0].embedding,
            embedDocText: vectorsDocText[index].embedding
        }))
        try {
            const res = await this.client.insert({
                collection_name: collectionName,
                data: group
            })
            if (res.status.error_code === 'Success') {
                return '插入数据成功'
            } else {
                throw new BadRequestException(`插入向量数据库失败:${res}`)
            }
        } catch (error) {
            throw new BadRequestException(`插入向量数据库失败:${error}`)
        }

    }

    //调用上面QwenEmbedding将切块文档转循环转换成向量文档，25块一份打包
    async vectorStorage(
        file: Express.Multer.File,
        splitDocument: Document<Record<string, any>>[] = [],
        userId: string,
        docID: Types.ObjectId
    ) {
        //集合名称
        const collectionName = `_${userId}`
        //1.判断集合是否创建
        const queryCollection = await this.client.hasCollection({ collection_name: collectionName })
        if (!queryCollection.value) {
            //创建集合，每个用户一个集合，集合名词+用户唯一标识
            await this.createCollection(collectionName)
        }
        //2.向量文档的标题
        const vectorsDocTitle = await this.QwenEmbedding([{ pageContent: file.originalname }])
        //3.向量文档被拆分的片段
        //分批处理，千问embedding一次最多25行
        const batchSize = 25
        for (let i = 0; i < splitDocument.length; i += batchSize) {
            const batchDocument = splitDocument.slice(i, i + batchSize)
            const vectorsDocText = await this.QwenEmbedding(batchDocument)
            await this.insertData(collectionName, file.originalname, docID, batchDocument, vectorsDocTitle, vectorsDocText)
        }
        return file.originalname
    }

    //删除知识库指定文件， 删除mongodb，本地，向量数据库
    async deleteFileKb(userId: string, docId: string) {
        //删除mongodb数据库文件和本地
        await this.deleteFile(userId, docId)
        //删除向量数据库文件
        //先加载集合
        const collectionName = `_${userId}`
        await this.client.loadCollection({ collection_name: collectionName })
        //删除向量数据库指定文件
        const res = await this.client.delete({
            collection_name: collectionName,
            filter: `docId == '${docId}'`
        })
        console.log('删除' + res + '个')
        //释放集合，以免占用内存
        await this.client.releaseCollection({ collection_name: collectionName })
    }

    //删除mongodb，本地
    async deleteFile(userId: string, docId: string) {
        //查找文件路径
        console.log('path', userId, docId)
        const fileRecord = await this.filemanagementModel.findOne({ userId, _id: docId })
        if (!fileRecord) throw new BadRequestException('删除失败，找不到该文档')
        //拼接路径
        const filePath = path.join(process.cwd(), fileRecord?.filePath as string)
        //删除服务器上的文件
        fs.unlinkSync(filePath)
        //删除mongodb数据库文件
        await this.filemanagementModel.deleteOne({
            _id: docId,
            userId
        })
    }

    //查询向量数据库
    async searchDatabase(userId: string, userQuestion: string, questionVector: number[]) {
        //集合名称
        const collectionName = `_${userId}`
        //加载集合
        await this.client.loadCollection({ collection_name: collectionName })
        //混合搜索
        const search_param_1 = {
            "data": questionVector,
            "anns_field": "embedDocTitle",
            "param": {
                "metric_type": "COSINE"
            },
            "limit": 9
        }
        const search_param_2 = {
            "data": questionVector,
            "anns_field": "embedDocText",
            "param": {
                "metric_type": "COSINE"
            },
            "limit": 9
        }
        const res = await this.client.search({
            collection_name: collectionName,
            data: [search_param_1, search_param_2],
            limit: 18,
            output_fields: ['docTitle', 'docText'],
            rerank: WeightedRanker([0.3, 0.8])
        });
        //搜索向量数据库结果
        const searchReultArr = res.results
        
        //释放集合
        this.client.releaseCollection({ collection_name: collectionName })
        //提取关键词
        const keywordres = await this.extractKeywords(userQuestion)
        //提取到的关键词
        const keyWordObject = JSON.parse(keywordres.choices[0].message.content as string)
        //关键词数组
        const keyWordList = keyWordObject.keyWord
        if (searchReultArr.length > 0) {
            //过滤后的文档片段
            const filterDocList = this.filterDocsByKeywords(searchReultArr, keyWordList)

            //匹配得到的标题
            let searchDocTitle: string[]
            //匹配得到的内容
            let searchDocText = ''
            if (filterDocList.length > 0) {
                //去重
                searchDocTitle = [...new Set(filterDocList.map(item => item.docTitle))]
                filterDocList.forEach((item, index) => searchDocText += index + 1 + '.' + item.docText)
            } else {
                searchDocTitle = []
                searchDocText = '&没有检索到相关文档&'
            }
            return {
                searchDocTitle,
                searchDocText: `请根据检索到的知识库文档内容回复用户问题，用户问题：${userQuestion};\n文档内容：${searchDocText}`
            }
        } else {
            return {
                searchDocTitle:[],
                searchDocText: `请根据检索到的知识库文档内容回复用户问题，用户问题：${userQuestion};\n文档内容：&没有检索到相关文档&`
            }
        }
    }

    //让模型提取关键词
    async extractKeywords(content: string) {
        const res = await this.openai.chat.completions.create({
            model: "qwen-plus",  //此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages: [
                { role: "system", content: kwExtractionPrompt },
                { role: "user", content }
            ],
            stream: false,
            response_format: { "type": "json_object" }
        })
        return res
    }

    //用关键词取匹配检索到的文档
    filterDocsByKeywords(docList: SearchResultData[], keyWord: string[]) {
        const result: SearchResultData[] = []
        for (const doc of docList) {
            const combinedText = `${doc.docTitle}${doc.docText}`
            const hasKeyword = keyWord.some(item => combinedText.includes(item))
            if (hasKeyword) {
                result.push(doc)
            }
        }
        return result
    }
}

import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MessagesType, UploadFileListType } from './chat';
import { Response } from 'express';
import { Filemanagement } from 'src/filemanagement/filemanegement.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Redis } from 'ioredis'
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ChatData } from './chat.schema';
@Injectable()
export class ChatService {
    constructor(
        //注入模型
        @InjectModel(Filemanagement.name)
        private filemanagementModel: Model<Filemanagement>,

        @InjectModel(ChatData.name)
        private chatDataModel: Model<ChatData>,

        @InjectRedis()
        private readonly redis: Redis,
    ) { }
    //通知流
    notifyStream(stream: Response, streamData: any) {
        //用于将数据分快(chunk)写入到响应体中
        stream.write(JSON.stringify(streamData) + '###ABC###') //用于前端处理重叠
    }

    //根据文档id查询文件管理数据库
    async queryFile(userId: Types.ObjectId, docIds: Types.ObjectId[]) {
        const fileData = await this.filemanagementModel.find({
            userId,
            _id: { $in: docIds }
        }).select('fileText fileName fileSize fileType')
        return {
            //文档的基本内容
            uploadFileList: fileData.map(item => ({
                fileName: item.fileName,
                fileSize: item.fileSize,
                fileType: item.fileType,
                docId: item._id.toString()
            })),
            //文档的文本内容
            documents: fileData.map(item => item.fileText)
        }
    }

    //发送给模型之前需要整合对话结构
    async combineConversation(
        userId: Types.ObjectId,
        content: string,
        stream: Response, //流试响应对象
        sessionId?: Types.ObjectId,
        uploadFileList?: UploadFileListType[],
        isKnowledgeBased?: boolean
    ) {
        //组合对话字段：用户发送给模型的对话类型
        const message: MessagesType = {
            role: 'user',
            content
        }
        //阅读的文件列表：最后需要交给大模型的回复里
        let reddFileList: MessagesType['readFileData']
        //判断用户是否携带文档
        if (uploadFileList && uploadFileList.length > 0) {
            //如果用户上传文档，禁用知识库回答
            isKnowledgeBased = false
            //正在阅读文档
            this.notifyStream(stream, {
                type: 'readDocument',
                statusInfo: 'inProgress',
                promptInfo: '正在阅读文档',
                fileList: []
            })
            //根据文档id查询文档内容
            const docIdArr = uploadFileList.map(item => item.docId)
            const docId = docIdArr.map(id => new Types.ObjectId(id))
            const res = await this.queryFile(userId, docId)
            //拼接文档内容，交给大模型
            const documentContent = res.documents.join('\n\n---\n\n')
            message.content = `用户上传的文档内容如下:\n${documentContent}\n基于文档内容回复用户问题：${content}`
            //取出原始问题
            message.displayContent = content
            //取出文件列表数据
            message.uploadFileList = res.uploadFileList
            //阅读的文件列表：最后需要交给大模型的回复里
            reddFileList = {
                type: 'readDocument',
                statusInfo: 'completed',
                promptInfo: '文档阅读完毕',
                fileList: res.uploadFileList.map(item => item.fileName)
            }
        }
        // -----------请求数据库：获取历史对话，组合上下文，让模型具有记忆里
        //需要发送的模型的对话列表：历史对话 + 当前对话
        let historyConversationList: MessagesType[] = []
        if (!sessionId) {
            historyConversationList.push(message)
        } else {
            //查询redis是否有对话记录, 有就使用redis, 否则使用mongodb
            const redisKey = `chat_history:${userId}:${sessionId}`
            const cacheData = await this.redis.get(redisKey)
            if (cacheData) {
                //redis有对话数据呀，那就直接取出来
                historyConversationList = JSON.parse(cacheData)
            } else {
                //redis没有数据， 那就从mongodb取数据
                const chatData = await this.chatDataModel.find({ userId, _id: sessionId })
                historyConversationList = chatData[0].chatList
                //存储进redis, 3小时过期
                await this.redis.set(redisKey, JSON.stringify(historyConversationList), 'EX', 10800)
            }
            //把当前用户的问题加入历史对话的最后一项
            historyConversationList.push(message)
        }
        //调用模型
        console.log('对话数据')
        console.log(historyConversationList)
    }
}

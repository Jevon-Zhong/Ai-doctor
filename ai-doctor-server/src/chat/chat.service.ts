import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MessagesType, UploadFileListType } from './chat';
import { Response } from 'express';
import { Filemanagement } from 'src/filemanagement/filemanegement.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Redis } from 'ioredis'
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ChatData } from './chat.schema';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { medAssistantDataPrompt } from './roleDefinition';
import { toolsData } from './tools';
import { FilemanagementService } from 'src/filemanagement/filemanagement.service';
import { MyLogger } from 'utils/no-timestamp-logger';
//创建请求对话的终止控制器
const controllerMap = new Map<string, AbortController>()
@Injectable()
export class ChatService {
    private openai: OpenAI
    private readonly logger = new MyLogger(); //初始化·
    constructor(
        //注入模型
        @InjectModel(Filemanagement.name)
        private filemanagementModel: Model<Filemanagement>,

        @InjectModel(ChatData.name)
        private chatDataModel: Model<ChatData>,

        @InjectRedis()
        private readonly redis: Redis,

        private configService: ConfigService,

        private filemanagementService: FilemanagementService
    ) {
        //通义千问
        this.openai = new OpenAI({
            apiKey: this.configService.get('QWEN_API_KEY') as string,
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        })
    }
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
        let historyConversationList: MessagesType[] = [
            // {
            //     role: 'user',
            //     content: '胃癌有哪些症状'
            // },
            // {
            //     role: 'assistant',
            //     content: '胃癌主要xxxx'
            // }
        ]
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
                console.log('ddd', chatData[0])
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
        this.modelResult(
            historyConversationList.slice(-21),//取最近的21条对话数据
            userId.toString(),
            stream,
            sessionId,
            reddFileList,
            uploadFileList,
            isKnowledgeBased
        )
    }

    //模型输出结果
    async modelResult(
        messageList: MessagesType[],
        userId: string,
        stream: Response,
        sessionId?: Types.ObjectId,
        readFileList?: MessagesType['readFileData'],
        uploadFileList?: UploadFileListType[],
        isKnowledgeBased?: boolean
    ) {
        try {
            const controller = new AbortController
            if (sessionId) {
                controllerMap.set(sessionId.toString(), controller)
            }
            const res: any = await this.callingModel(messageList, isKnowledgeBased, controller)
            //如果用户携带文档对话，在此返回给前端
            if (uploadFileList && uploadFileList.length > 0) {
                this.notifyStream(stream, readFileList)
            }

            //存放拼接的新问题
            let toolCallArgsStr = ''
            //标记工具是否开始调用
            let isToolCallStarted = false

            //模型回复的完整内容
            let assistantMessage = ''
            for await (const chunk of res) {
                const chunkObj = chunk.choices[0].delta
                console.log('模型输出---------')
                console.log(JSON.stringify(chunkObj))
                //判断用户是否选择知识库回答，也就是出发工具调用
                if (chunkObj.tool_calls && chunkObj.tool_calls[0].function.arguments) {
                    toolCallArgsStr += chunkObj.tool_calls[0].function.arguments
                    isToolCallStarted = true
                }
                //判断工具回复结束，处理新问题
                if (chunk.choices[0].finish_reason === 'stop' && isToolCallStarted) {
                    //取出新问题
                    const newQuestion = JSON.parse(toolCallArgsStr)
                    if (newQuestion && typeof newQuestion === 'object' && 'clarified_question' in newQuestion && newQuestion.clarified_question.trim() !== '') {
                        console.log('工具生成了新问题-----')
                        console.log(newQuestion.clarified_question)
                        //整理新问题，查询知识库
                        const res = await this.queryKb(stream, newQuestion.clarified_question, userId, messageList, readFileList)
                        assistantMessage = res.assistantMessage
                        readFileList = res.readFileList
                    } else {
                        //整理新问题， 查询知识库
                        //工具没有生成新问题
                        const lastItem = messageList[messageList.length - 1]
                        const res = await this.queryKb(stream, lastItem.content, userId, messageList, readFileList)
                        assistantMessage = res.assistantMessage
                        readFileList = res.readFileList
                        console.log('工具没有生成新问题')
                    }
                }
                //用户没有选择知识库按钮，content就是大模型返回的结果
                if (chunkObj.content) {
                    // console.log('用户没有选择知识库按钮')
                    const sentence = chunk.choices[0].delta.content
                    const returnRes = {
                        role: 'assistant',
                        content: sentence
                    }
                    this.notifyStream(stream, returnRes)
                    //合并模型消息
                    assistantMessage += sentence
                }
            }
            //将完整的模型回复数据存储进数据库
            const assistantMessageObj: MessagesType = {
                role: 'assistant',
                content: assistantMessage,
                ...(readFileList && { readFileData: readFileList })
            }
            //整理一轮新的对话
            const conversationPair: MessagesType[] = [messageList[messageList.length - 1], assistantMessageObj]
            //存储数据库
            if (!sessionId) {
                //新创建的对话
                const newChat = await this.chatDataModel.create({
                    userId,
                    chatList: conversationPair
                })
                //同步更新redis
                const redisKey = `chat_history:${userId}:${newChat._id}`
                await this.redis.set(redisKey, JSON.stringify(conversationPair), 'EX', 10800)
                
                //返回对话id给前端
                this.notifyStream(stream, {
                    role:'sessionId',
                    content: newChat._id,
                    modelPromt: '新会话id已创建，请保存会话id'
                })
            } else {
                //不是新对话，是在历史对话上接着询问的
                await this.chatDataModel.updateOne(
                    {userId, _id: sessionId},
                    {$push: {chatList: {$each: conversationPair}}}
                )
                //同步更新redis
                const redisKey = `chat_history:${userId}:${sessionId}`
                const cacheData = await this.redis.get(redisKey) as string
                const parsedHistory: MessagesType[] = JSON.parse(cacheData)
                const updatedHistory = [...parsedHistory, ...conversationPair]
                await this.redis.set(redisKey, JSON.stringify(updatedHistory), 'EX', 10800)
            }
        } catch (error) {
            console.error('调用模型出错')
            console.log(error)
            this.logger.error('模型回复出错' + error);
            this.notifyStream(stream, {
                role: 'error',
                content: error,
                modelPrompt: '模型回复出错'
            })
        } finally {
            //告知前端通知流结束
            stream.end()
        }
    }

    //调用模型
    async callingModel(
        messageList: MessagesType[],
        isKnowledgeBased?: boolean,
        controller?: AbortController
    ) {
        const res = await this.openai.chat.completions.create({
            model: "qwen-plus",  //此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages: [
                { role: "system", content: medAssistantDataPrompt },
                ...messageList
            ],
            tools: toolsData,
            stream: true,
            tool_choice: isKnowledgeBased ? { "type": "function", "function": { "name": "H300" } } : 'none'
        },
            { signal: controller?.signal } //中断模型输出
        )
        return res
    }

    // 根据用户的问题，检索知识库
    async queryKb(
        stream: Response,
        userQuestion: string,
        userId: string,
        messageList: MessagesType[],
        readFileList?: MessagesType['readFileData']
    ) {
        const readFileData: MessagesType['readFileData'] = {
            type: 'queryKB',
            statusInfo: 'inProgress',
            promptInfo: '正在检索知识库',
            fileList: []
        }
        this.notifyStream(stream, readFileData)

        //将用户问题转换为向量
        const vectorUserQuestion = await this.filemanagementService.QwenEmbedding([{ pageContent: userQuestion }])
        console.log(vectorUserQuestion)
        //查询向量数据库
        const searchResult = await this.filemanagementService.searchDatabase(userId, userQuestion, vectorUserQuestion[0].embedding)
        //取最后一项对话
        const lastItem = messageList[messageList.length - 1]
        lastItem['displayContent'] = lastItem.content
        //用户问题和文档内容
        lastItem.content = searchResult.searchDocText
        //告知前端用户知识库检索完毕
        readFileList = {
            type: 'queryKB',
            statusInfo: 'completed',
            promptInfo: `为您检索${searchResult.searchDocTitle.length}篇知识库`,
            fileList: searchResult.searchDocTitle
        }
        this.notifyStream(stream, readFileList)

        //大模型流式输出的完整拼接字符串
        let assistantMessage = ''
        //再次调用回复用户
        const res = await this.callingModel(messageList)
        for await (const chunk of res) {
            const sentence = chunk.choices[0].delta.content
            const returnRes = {
                role: 'assistant',
                content: sentence
            }
            this.notifyStream(stream, returnRes)
            //合并模型消息
            assistantMessage += sentence
        }
        return {
            assistantMessage,
            readFileList
        }
    }
}

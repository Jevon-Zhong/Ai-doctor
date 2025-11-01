import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MessagesType, toolResultType, UploadFileListType, toolUsingType } from './chat';
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
import { UploadImageDto } from './chat.dto';
import { MCP_CLIENT_TOKEN } from '../mcp/mcp.module'; // 导入令牌
import { readFileSync } from 'fs';
import { MCPClient } from 'utils/mcpClient';

interface ExtendedDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
    reasoning_content?: string
}

interface Qwen3 extends OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming {
    enable_thinking?: boolean
}
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

        @Inject(MCP_CLIENT_TOKEN)
        private readonly mcpClient: MCPClient,

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
        toolChoice?: string,
        sessionId?: Types.ObjectId,
        uploadFileList?: UploadFileListType[],
        isKnowledgeBased?: boolean,
        uploadImage?: MessagesType['uploadImage']
    ) {
        //组合对话字段：用户发送给模型的对话类型
        const message: MessagesType = {
            role: 'user',
            content
        }
        //阅读的文件列表：最后需要交给大模型的回复里
        let readFileList: MessagesType['readFileData']
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
            readFileList = {
                type: 'readDocument',
                statusInfo: 'completed',
                promptInfo: '文档阅读完毕',
                fileList: res.uploadFileList.map(item => item.fileName)
            }
        }

        //如果用户携带图片
        if (uploadImage) {
            //禁用知识库回答
            isKnowledgeBased = false
            message.uploadImage = uploadImage
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
            toolChoice,
            sessionId,
            readFileList,
            uploadFileList,
            isKnowledgeBased,
            uploadImage
        )
    }

    //模型输出结果
    async modelResult(
        messageList: MessagesType[],
        userId: string,
        stream: Response,
        toolChoice?: string,
        sessionId?: Types.ObjectId,
        readFileList?: MessagesType['readFileData'],
        uploadFileList?: UploadFileListType[],
        isKnowledgeBased?: boolean,
        uploadImage?: MessagesType['uploadImage']
    ) {
        try {
            const controller = new AbortController
            //存储模型返回的结果
            let res: any
            if (sessionId) {
                controllerMap.set(sessionId.toString(), controller)
            }
            //如果用户携带图片就调用多模态大模型
            if (uploadImage) {
                //图片转换base64
                const imageUrlObj = this.encodeImage(`uploadImgs/${uploadImage.imagePath}`, uploadImage.mimeType)
                res = await this.callingModelVl(messageList, imageUrlObj, controller)
            } else {
                res = await this.callingModel(messageList, toolChoice, isKnowledgeBased, controller)
            }

            //如果用户携带文档对话，在此返回给前端
            if (uploadFileList && uploadFileList.length > 0) {
                this.notifyStream(stream, readFileList)
            }

            //工具名称
            let toolName = ''
            //存放拼接的新问题
            let toolCallArgsStr = ''
            //标记工具是否开始调用
            let isToolCallStarted = false
            let isAnswering = false

            let toolUsing: toolUsingType | undefined

            //模型回复的完整内容
            let assistantMessage = ''
            for await (const chunk of res) {
                const chunkObj = chunk.choices[0].delta
                console.log('模型输出---------')
                console.log(JSON.stringify(chunk))
                //收集并拼接工具参数
                if (chunkObj.tool_calls && chunkObj.tool_calls[0].function?.name) {
                    toolName = chunkObj.tool_calls[0].function.name
                    toolUsing = {
                        toolStatus: '工具调用中',
                        toolName: toolName,
                        toolResult: ''
                    }
                    console.log('工具调用中', toolUsing)
                    this.notifyStream(stream, toolUsing)
                }
                //判断用户是否选择知识库回答，也就是出发工具调用
                if (chunkObj.tool_calls && chunkObj.tool_calls[0].function.arguments) {
                    toolCallArgsStr += chunkObj.tool_calls[0].function.arguments
                    isToolCallStarted = true
                }
                //判断工具回复结束，处理新问题
                if (chunk.choices[0].finish_reason === 'tool_calls' || chunk.choices[0].finish_reason === 'stop' && isToolCallStarted) {
                    //取出新问题
                    const newQuestion = JSON.parse(toolCallArgsStr)
                    if (newQuestion && typeof newQuestion === 'object' && 'clarified_question' in newQuestion && newQuestion.clarified_question.trim() !== '') {
                        console.log('工具生成了新问题-----')
                        console.log(newQuestion.clarified_question)
                        const result: any = await this.mcpClient.callTool(toolName, toolCallArgsStr);
                        console.log('H300xxx', result)
                        toolUsing = {
                            toolStatus: '工具调用完毕',
                            toolName: toolName,
                            toolResult: result
                        }
                        this.notifyStream(stream, toolUsing)
                        //整理新问题，查询知识库
                        const res = await this.queryKb(stream, newQuestion.clarified_question, userId, messageList, readFileList)
                        assistantMessage = res.assistantMessage
                        readFileList = res.readFileList
                    } else if (toolName === 'crawlWeb') {
                        let assistantMessageByCrawlWeb = ''
                        const result: any = await this.mcpClient.callTool(toolName, toolCallArgsStr);
                        toolUsing = {
                            toolStatus: '工具调用完毕',
                            toolName: toolName,
                            toolResult: result
                        }
                        this.notifyStream(stream, toolUsing)
                        //需要获取模型的最后一项内容，即用户的原始提问，要设置为下一次的displayContent
                        const lastItem = messageList[messageList.length - 1]
                        messageList.push({ role: 'user', content: result.content[0].text as string, displayContent: lastItem.content })
                        const toolStream = await this.openai.chat.completions.create({
                            // 您可以按需更换为其它 Qwen3 模型、QwQ模型或DeepSeek-R1 模型
                            model: 'qwen-plus',
                            messages: messageList,
                            stream: true,
                            enable_thinking: false
                        } as Qwen3)
                        //流式输出
                        for await (const chunk of toolStream) {
                            if (!chunk.choices?.length) {
                                console.log('\nUsage:');
                                console.log(chunk.usage);
                                continue;
                            }
                            const delta: ExtendedDelta = chunk.choices[0].delta;
                            // 收到content，开始进行回复
                            if (delta.content !== undefined && delta.content) {
                                if (!isAnswering) {
                                    console.log('\n' + '='.repeat(20) + '调用工具后的回复' + '='.repeat(20) + '\n');
                                    isAnswering = true;
                                }
                                console.log(JSON.stringify(chunk))
                                const sentence = chunk.choices[0].delta.content
                                assistantMessageByCrawlWeb += sentence
                                const returnRes = {
                                    role: 'assistant',
                                    content: sentence
                                }
                                this.notifyStream(stream, returnRes)
                                // process.stdout.write(delta.content);
                                // answerContent += delta.content;
                            }
                        }
                        assistantMessage = assistantMessageByCrawlWeb
                    }
                    else {
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
                ...(toolUsing && { toolUsing: toolUsing }),
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
                    role: 'sessionId',
                    content: newChat._id,
                    modelPromt: '新会话id已创建，请保存会话id'
                })
            } else {
                //不是新对话，是在历史对话上接着询问的
                await this.chatDataModel.updateOne(
                    { userId, _id: sessionId },
                    { $push: { chatList: { $each: conversationPair } } }
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

    //调用模型：文本
    async callingModel(
        messageList: MessagesType[],
        toolChoice?: string,
        isKnowledgeBased?: boolean,
        controller?: AbortController
    ) {
        let tool: string | object = 'auto'
        if (toolChoice) {
            tool = { "type": "function", "function": { "name": `${toolChoice}` } }
        } else {
            if (isKnowledgeBased) {
                tool = { "type": "function", "function": { "name": "H300" } }
            } else {
                tool = 'none'
            }
        }
        const res = await this.openai.chat.completions.create({
            model: "qwen-plus",  //此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages: [
                { role: "system", content: medAssistantDataPrompt },
                ...messageList
            ],
            tools: this.mcpClient.getTools(),
            enable_thinking: false,
            stream: true,
            tool_choice: tool
        } as Qwen3,
            { signal: controller?.signal } //中断模型输出
        )
        return res
    }

    //调用模型：多模态，图片理解
    async callingModelVl(
        messageList: MessagesType[],
        imageUrlObj: any,
        controller?: AbortController
    ) {
        const res = await this.openai.chat.completions.create({
            model: "qwen3-vl-plus",  // 此处以qwen3-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/models
            messages: [
                {
                    role: 'system',
                    content: ''
                },
                {
                    role: 'user',
                    content: [
                        imageUrlObj,
                        { type: "text", text: messageList[messageList.length - 1].content },
                    ]
                }
            ],
            stream: true

        }, { signal: controller?.signal }) //中断模型输出)
        return res
    }

    //将图片转换base64编码。再交给多模态大模型
    encodeImage(imagePath: string, mimeType: string) {
        const imageFile = readFileSync(imagePath);
        const base64Image = imageFile.toString('base64');
        return {
            type: 'image_url',
            image_url: { "url": `data:${mimeType};base64,${base64Image}` },
        }
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

    //获取对话列表
    async getChatList(userId: string) {
        const res = await this.chatDataModel.aggregate([
            { $match: { userId } },
            {
                $project: {
                    sessionId: '$_id',
                    _id: 0,
                    createTime: 1,
                    chatList: {
                        $map: {
                            input: { $slice: ['$chatList', 1] },
                            as: 'item',
                            in: {
                                content: {
                                    $ifNull: ['$$item.displayContent', '$$item.content']
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { createTime: -1 } },
            { $unwind: '$chatList' },
            {
                $project: {
                    sessionId: 1,
                    content: '$chatList.content'
                }
            }
        ])
        return {
            result: res
        }
    }

    //获取工具列表
    async getToollist() {
        console.log('getTools', this.mcpClient.getTools())
        return {
            result: this.mcpClient.getTools()
        }
    }

    //获取某个会话的对话数据
    async singleChatData(
        userId: string,
        sessionId: string
    ) {
        //存储要返回的对话数据
        let singleChatData: MessagesType[] = []
        //先查询redis是否有
        const redisKey = `chat_history:${userId}:${sessionId}`
        const cacheData = await this.redis.get(redisKey)
        if (cacheData) {
            singleChatData = JSON.parse(cacheData)
        } else {
            //从mongodb请求
            const chatData = await this.chatDataModel.find({ userId, _id: sessionId })
            singleChatData = chatData[0].chatList
            await this.redis.set(redisKey, JSON.stringify(singleChatData), 'EX', 10800)
        }
        return {
            result: singleChatData
        }
    }

    //终止模型的输出
    async stopOutput(sessionId: string) {
        const controller = controllerMap.get(sessionId)
        if (controller) {
            controller.abort()//停止生成
            return {
                message: '会话已终止'
            }
        } else {
            return {
                message: '会话未找到， 停止失败'
            }
        }
    }

    //删除对话
    async deleteDialog(userId: string, sessionId: string) {
        //查找文件路径
        console.log('path', userId, sessionId)
        const fileRecord = await this.chatDataModel.findOne({ userId, _id: sessionId })
        if (!fileRecord) throw new BadRequestException('删除失败，找不到对话')
        //删除mongodb数据库文件
        await this.chatDataModel.deleteMany({
            _id: sessionId,
            userId
        })
    }
}

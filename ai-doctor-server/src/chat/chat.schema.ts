import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { UserInfo } from "src/userinfo/userinfo.schema";
import dayjs from 'dayjs';

//阅读的文档或知识库
@Schema({ _id: false }) //让数组里不要生成_id
class ReadFileData {
    //阅读文档 ｜ 检索知识库
    @Prop({ type: String, enum: ['readDocument', 'queryKB'], required: true })
    type: 'readDocument' | 'queryKB'

    //进行中 ｜ 完毕
    @Prop({ type: String, enum: ['inProgress', 'completed'], required: true })
    statusInfo: 'inProgress' | 'completed'

    //服务器返回的提示
    @Prop({ type: String, required: true })
    promptInfo: string

    //处理的文件列表
    @Prop({ type: [String], required: true })
    fileList: string[]
}

// 携带的图片对象字段结构
@Schema({ _id: false }) //让数组里不要生成_id
class ImageUrlObjType {
    //图片路径
    @Prop({ type: String, required: true })
    imagePath: string

    //图片类型
    @Prop({ type: String, required: true })
    mimeType: string

    //图片地址
    @Prop({ type: String, required: true })
    imageUrl: string
}

//对话结构
@Schema({ _id: false }) //让数组里不要生成_id
class ChatMessage {
    //角色
    @Prop({ type: String, enum: ['user', 'assistant'], required: true })
    role: 'user' | 'assistant'

    //用户或模型消息
    @Prop({ type: String, required: true })
    content: string

    //原始消息
    @Prop({ type: String })
    displayContent?: string

    //携带的文件列表
    @Prop({
        type: [
            {
                fileName: { type: String, require: true },
                fileSize: { type: String, require: true },
                fileType: { type: String, require: true },
                docId: { type: String, require: true }
            }
        ]
    })
    uploadFileList?: {
        fileName: string
        fileSize: string
        fileType: string
        docId: string
    }[]

    //阅读的文档或者阅读知识库
    @Prop({ type: ReadFileData })
    readFileData?: ReadFileData

    //携带的图片对象
    @Prop({type: ImageUrlObjType})
    uploadImage?: ImageUrlObjType

}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage)

// 用户和模型的对话结构
@Schema({ versionKey: false }) //去掉版本号
export class ChatData {
    //用户id
    @Prop({ ref: UserInfo.name, required: true, select: false })
    userId: Types.ObjectId

    //对话创建时间
    @Prop({ default: () => dayjs().format('YYYY-MM-DD') })
    createDate: string

    //创建对话的时间戳
    @Prop({ default: () => dayjs().valueOf() })
    createTime: number

    //对话列表
    @Prop({ type: [ChatMessageSchema], default: [] })
    chatList: ChatMessage[]
}
export const ChatDataSchema = SchemaFactory.createForClass(ChatData)
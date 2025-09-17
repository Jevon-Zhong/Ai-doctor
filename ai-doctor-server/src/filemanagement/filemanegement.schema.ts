import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserInfo } from "src/userinfo/userinfo.schema";

// 文件管理 (知识库+对话框文件上传)
@Schema({ versionKey: false }) //去掉版本号
export class Filemanagement {
    //用户id，关联用户表
    @Prop({ ref: UserInfo.name, required: true })
    userId: string

    //原文件名
    @Prop({ required: true })
    fileName: string

    //文件路径
    @Prop({ required: true })
    filePath: string

    //文件类型
    @Prop({ required: true })
    fileType: string

    //文件大小
    @Prop({ required: true })
    fileSize: string

    //整个文件的文本
    @Prop({ required: true })
    fileText: string

    //存储文件的类型： 对话框或者知识库
    @Prop({ enum: ['UD', 'UB'], required: true })
    uploadType: 'UD' | 'UB'
}
export const FilemanagementSchema = SchemaFactory.createForClass(Filemanagement)
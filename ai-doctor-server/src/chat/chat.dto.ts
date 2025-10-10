import { Type } from 'class-transformer'
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, ValidateNested, IsBoolean } from 'class-validator'
import { Types } from 'mongoose'
//上传的文件列表
export class UploadFileDto {
    //文件名称
    @IsString({ message: 'fileName须是字符串类型' })
    @IsNotEmpty({ message: 'fileName不能为空' })
    fileName: string

    //文件大小
    @IsString({ message: 'fileSize须是字符串类型' })
    @IsNotEmpty({ message: 'fileSize不能为空' })
    fileSize: string

    //文件类型
    @IsString({ message: 'fileType须是字符串类型' })
    @IsNotEmpty({ message: 'fileType不能为空' })
    fileType: string

    //文件id
    @IsString({ message: 'docId须是字符串类型' })
    @IsNotEmpty({ message: 'docId不能为空' })
    docId: string
}

//用户发送的消息字段
export class SendMessageQueryDto {
    //用户发送的纯文本
    @IsString({ message: 'content必须是字符串类型' })
    @IsNotEmpty({ message: '请输入问题' })
    content: string

    //携带的文件列表
    @IsOptional()
    @IsArray({ message: 'uploadFileList必须是数组' })
    // @ArrayNotEmpty({ message: '上传的文件不能为空' })
    @ValidateNested({ each: true })//对数组里的每一项进行校验
    @Type(() => UploadFileDto)//把数组里的一些转换为UploadFileDtio的实例，否则会导致嵌套字段无效
    uploadFileList?: UploadFileDto[]

    //对话id
    // @IsString({ message: 'sessionId必须是字符串类型' })
    // @IsNotEmpty({ message: 'sessionId不能为空' })
    @IsOptional()
    sessionId: Types.ObjectId//创建新对话的时候前端携带null值过来

    //是否基于知识库回答
    @IsOptional()
    @IsBoolean({message: 'isKnowledgeBased必须是布尔值'})
    isKnowledgeBased?: boolean
}

//获取某个会话的对话数据传递的会话id
export class SingleChatDataDto {
    @IsString({message: 'sessionId必须是字符串'})
    @IsNotEmpty({message: '对话id不能为空'})
    sessionId: string
}
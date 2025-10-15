//用户上传的文档
export interface UploadFileListType {
    fileName: string,//文件名称
    fileSize: string,//文件大小
    fileType: string,//文件类型
    docId: string,//文件id
}

//用户和模型对话结构
export interface MessagesType {
    role: 'user' | 'assistant' | 'system',//角色
    content: string,//用户提问或模型回复的内容
    uploadFileList?: UploadFileListType[],//携带的文档列表
    readFileData?: {
        type: 'readDocument' | 'queryKB', //阅读文档 ｜ 检索知识库
        statusInfo: 'inProgress' | 'completed', //进行中 ｜ 完毕
        promptInfo: string, //服务器返回的提示
        fileList: string[]//处理的文件列表
    },
    displayContent?: string//用户原始问题
    //携带的图片
    uploadImage?: {
        imagePath: string,
        mimeType: string,
        imageUrl: string
    }
}
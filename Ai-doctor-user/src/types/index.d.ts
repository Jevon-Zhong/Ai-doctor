//登陆传递的参数
export type UserLoginType = {
    phoneNumber: string
    password: string
}

//注册需要传递的参数
export type UserRegisterType = UserLoginType & {
    confirmPassword: string
}

//所有接口返回的数据格式
export type ApiResponseType<T> = {
    statusCode: number,
    message: string,
    data: T,
    api: string,
}

//错误返回的数据格式
export type ApiResponseErrorType = {
    status: number,
    response: { data: { data: any, message: any } }
}

//登陆接口返回的数据
export type UserInfoResType = {
    token: string,
    phoneNumber: string,
    avatar: string
}

//获取知识库文件列表返回的数据
export type kbFileListType = {
    docId: string,
    fileName: string,
    fileType: 'PDF' | 'DOCX',
    fileSize: string,
}[]

//用户上传的文档
export type UploadFileListType = {
    fileName: string,//文件名称
    fileSize: string,//文件大小
    fileType: 'PDF' | 'DOCX',//文件类型
    docId: string,//文件id
}

//用户和模型的对话睡觉类型
export type MessageListType = {
    role: 'user' | 'assistant',//角色
    content: string,//用户提问或模型回复的内容
    uploadFileList?: UploadFileListType[],//携带的文档列表
    readFileData?: {
        type: 'readDocument' | 'queryKB', //阅读文档 ｜ 检索知识库
        statusInfo: 'inProgress' | 'completed', //进行中 ｜ 完毕
        promptInfo: string, //服务器返回的提示
        fileList: string[]//处理的文件列表
    },
    displayContent?: string,//用户原始问题
    loadingCircle?: boolean//发送时等待模型回复的loading
}

//用户发送消息传递的参数
export type SendMessageType = {
    content: string,
    sessionId: string,
    uploadFileList?: kbFileListType,
    isKnowledgeBased?: boolean
}

//模型返回的数据
export type AiMessageType = {
    role: 'user' | 'assistant' | 'sessionId',
    content: string,//用户提问或者模型回复的内容
    type: 'readDocument' | 'queryKB',
    statusInfo: 'inProgress' | 'completed', //进行中 ｜ 完毕
    promptInfo: string, //服务器返回的提示
    fileList: string[]//处理的文件列表
}

export type GetchatlistType = {
    sessionId: string,
    content: string
}
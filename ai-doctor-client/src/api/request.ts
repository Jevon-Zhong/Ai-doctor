const baseUrl = 'http://127.0.0.1:3000'
import axios from "axios"
import type { UserRegisterType, ApiResponseType, ApiResponseErrorType, UserLoginType, UserInfoResType, kbFileListType, SendMessageType, AiMessageType, GetchatlistType, MessageListType, ImageUploadType } from '@/types/index'
import { useUserStore } from "@/store/user"
import { useChatStore } from "@/store/chat"
import { useAppStore } from "@/store/app"
const userStore = useUserStore()
const chatStore = useChatStore()
const appStore = useAppStore()
//创建一个实例
const axiosInstance = axios.create({
    baseURL: baseUrl
})

//请求拦截器
axiosInstance.interceptors.request.use(
    (config) => {
        config.headers.Authorization = 'Bearer ' + userStore.getUserInfo.token
        return config
    },
    (error: ApiResponseErrorType) => {
        return Promise.reject(error)
    }
)

//响应拦截器
axiosInstance.interceptors.response.use(
    (response) => {
        //响应的正确结果
        return response.data
    },
    (error: ApiResponseErrorType) => {
        console.log(error)
        const status: number = error.status
        switch (status) {
            case 404:
                ElMessage.error('接口不存在或者请求方式不对')
                break;
            case 401:
                appStore.setShowLoginPopup(true)
                ElMessage.error("没有操作权限")
                break;
            case 500:
                ElMessage.error("服务器发生错误")
                break;
            case 501:
                ElMessage.error("服务器发生错误")
                break;
            case 502:
                ElMessage.error("服务器发生错误")
                break;
            default:
                const message = error.response.data.message
                const tip = typeof message === 'string' ? message : message[0]
                ElMessage(tip)
                break;
        }
        return Promise.reject(error)
    }
)

//注册接口
export const userRegisterApi = (params: UserRegisterType): Promise<ApiResponseType<[]>> => {
    return axiosInstance.post('/userinfo/registeruser', params)
}

//登陆接口
export const userLoginApi = (params: UserLoginType): Promise<ApiResponseType<UserInfoResType>> => {
    return axiosInstance.post('/userinfo/loginuser', params)
}

//对话框上传文件
export const uploadDialogApi = (params: FormData): Promise<ApiResponseType<kbFileListType>> => {
    return axiosInstance.post('/filemanagement/uploaddialog', params)
}

//对话框删除文件
export const deletefileApi = (docId: string): Promise<ApiResponseType<[]>> => {
    return axiosInstance.delete(`/filemanagement/deletefile/${docId}`)
}

//知识库文件上传文件
export const uploadkbApi = (params: FormData): Promise<ApiResponseType<kbFileListType>> => {
    return axiosInstance.post('/filemanagement/uploadkb', params)
}

//获取知识库文件列表
export const getKbFileListApi = (): Promise<ApiResponseType<kbFileListType>> => {
    return axiosInstance.get('/filemanagement/kbfilelist')
}

//知识库删除文件
export const deletefilekbApi = (docId: string): Promise<ApiResponseType<[]>> => {
    return axiosInstance.delete(`/filemanagement/deletefilekb/${docId}`)
}

//获取对话列表数据
export const getChatListApi = (): Promise<ApiResponseType<GetchatlistType[]>> => {
    return axiosInstance.get('/chat/getchatlist')
}

//获取某个对话的详细数据
export const singlechatdata = (params: { sessionId: string }): Promise<ApiResponseType<MessageListType[]>> => {
    return axiosInstance.get('/chat/singlechatdata', { params })
}

//终止模型输出
export const stopoutputApi = (params: { sessionId: string }): Promise<ApiResponseType<[]>> => {
    return axiosInstance.post('/chat/stopoutput', params)
}

//用户请求和模型对话，模型流式输出
export const sendMessageApi = async (params: SendMessageType) => {
    const response = await fetch(`${baseUrl}/chat/sendmessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userStore.getUserInfo.token}`
        },
        body: JSON.stringify(params)
    })

    //pinia存储的对话数据中的最后一项，即ai最新回复的数据
    const aiMessageObj = chatStore.getMessageList[chatStore.getMessageList.length - 1]
    if (!response.ok) {
        const errorText = await response.text()
        chatStore.disabledStatus = false
        ElMessage('发送失败，请重试！')
        throw new Error(`发送失败：${errorText}`)
    }

    // 确保响应是可读流
    if (!response.body) {
        throw new Error('Response body is not available')
    }

    const reader = response.body.getReader()
    const textDecoder = new TextDecoder()
    let result = true
    while (result) {
        const { done, value } = await reader.read()

        if (done) {
            console.log('Stream ended')
            console.log(aiMessageObj)
            chatStore.disabledStatus = false
            result = false
            break
        }
        const chunkText = textDecoder.decode(value)
        let parts = chunkText.split('###ABC###')
        for (const part of parts) {
            if (part.trim() === '') continue;
            const aiMessage: AiMessageType = JSON.parse(part)
            console.log(aiMessage)
            //取会话id
            if (aiMessage.role === 'sessionId') {
                chatStore.setSessionId(aiMessage.content)
            }

            //取文档或知识库的提示
            if (aiMessage.type) {
                aiMessageObj.readFileData = aiMessage
            }

            //取工具调用
            if (aiMessage.toolName) {
                aiMessageObj.toolUsing = {
                    toolStatus: aiMessage.toolStatus,
                    toolName: aiMessage.toolName,
                    toolResult: aiMessage.toolResult
                }
            }

            //取模型回复的数据
            if (aiMessage.role === 'assistant') {
                aiMessageObj.loadingCircle = false
                if (aiMessage.content && aiMessage.content.trim()) {
                    aiMessageObj.content += aiMessage.content
                }
            }
        }
    }
}

//图片上传
export const uploadImageApi = (params: FormData): Promise<ApiResponseType<ImageUploadType>> => {
    return axiosInstance.post('/filemanagement/uploadimage', params)
}

//删除图片
export const deleteImageApi = (imagePath: string): Promise<ApiResponseType<[]>> => {
    return axiosInstance.delete(`/filemanagement/deleteimage/${imagePath}`)
}

//删除对话
export const deleteDialogApi = (sessionId: string): Promise<ApiResponseType<[]>> => {
    return axiosInstance.delete(`/chat/deletedialog/${sessionId}`)
}

//获取工具列表
export const getToollistApi = (): Promise<ApiResponseType<MessageListType[]>> => {
    return axiosInstance.get('/chat/gettoollist')
}
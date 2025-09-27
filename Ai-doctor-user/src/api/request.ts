const baseUrl = 'http://127.0.0.1:3000'
import axios from "axios"
import type { UserRegisterType, ApiResponseType, ApiResponseErrorType, UserLoginType, UserInfoResType, kbFileListType } from '@/types/index'
import { useUserStore } from "@/store/user"
const userStore = useUserStore()
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
                console.error("接口不存在或者请求方式不对")
                break;
            case 401:
                console.error("没有操作权限")
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

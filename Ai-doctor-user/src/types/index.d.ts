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
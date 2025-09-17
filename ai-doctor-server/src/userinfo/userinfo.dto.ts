import { IsString, IsNotEmpty, Matches } from 'class-validator'
//登陆
export class LoginUserDto {
    //手机号
    @IsString({ message: 'phoneNumber必须是字符串类型' })
    @IsNotEmpty({ message: '请填写手机号' })
    @Matches(/^1[3-9]\d{9}$/, { message: '请填写正确的手机号' })
    phoneNumber: string

    //密码
    @IsString({ message: 'password必须是字符串类型' })
    @IsNotEmpty({ message: '请填写密码' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/, { message: '密码需要6-8位字母和数字组合' })
    password: string
}

//注册
export class RegisterDto extends LoginUserDto {
    //确认密码
    @IsString({ message: 'confirmPassword必须是字符串类型' })
    @IsNotEmpty({ message: '请填写确认密码' })
    confirmPassword: string
}
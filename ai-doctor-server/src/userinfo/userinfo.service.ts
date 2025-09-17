import { Injectable } from '@nestjs/common';
import { UserInfo } from './userinfo.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac } from 'crypto'
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserinfoService {
    constructor(
        //注入模型
        @InjectModel(UserInfo.name)
        private userInfoModel: Model<UserInfo>,
        //读环境变量
        private configService: ConfigService,
        //jwt服务
        private jwtService: JwtService
    ) { }

    async registerUser(phoneNumber: string, password: string) {
        //查询该手机号是否存在，不存在就存储数据库，存在就提示
        const queryAccount = await this.userInfoModel.find({ phoneNumber })
        //找不到
        if (queryAccount.length <= 0) {
            //对密码加密
            const passwordKey = this.configService.get('PASSWORD_KEY')
            const passwordHash = createHmac('sha256', passwordKey)
                .update(password)
                .digest('hex');
            await this.userInfoModel.create({ phoneNumber: phoneNumber, password: passwordHash })
            return {
                message: 'SUCCESS',
            }
        } else {
            return {
                message: '该账号已存在',
                code: 422
            }
        }
    }

    // 登陆
    async loginUser(phoneNumber: string, password: string) {
        //对密码加密
        const passwordKey = this.configService.get('PASSWORD_KEY')
        const passwordHash = createHmac('sha256', passwordKey)
            .update(password)
            .digest('hex');
        const queryAccount = await this.userInfoModel.find({ phoneNumber: phoneNumber, password: passwordHash })
        if (queryAccount.length > 0) {
            //找到了
            //把_id作为用户身份唯一标识
            const token = this.jwtService.sign({ token: queryAccount[0]._id })
            return {
                result: {
                    token,
                    phoneNumber,
                    avatar: queryAccount[0].avatar
                }
            }
        } else {
            //没找到
            return {
                message: '账号或密码错误',
                code: 422
            }
        }
    }
}

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

//定义数据库字段类型，规则
@Schema({ versionKey: false }) //去掉版本号
export class UserInfo {
    // 头像
    // @Prop：定义mongodb中的字段， 给字段加上类型，规则
    @Prop({
        default: 'https://gw.alicdn.com/imgextra/i2/O1CN01TPyzre1Fv1zAshPR6_!!6000000000548-0-tps-1024-1024.jpg'
    })
    avatar: string

    //手机号
    @Prop({ required: true })
    phoneNumber: string

    //密码, select:false表示查询该表的时候这个字段不会返回
    @Prop({ required: true, select: false })
    password: string
}

//生成mongodb需要的数据模型结构对象
export const UserInfoSchema = SchemaFactory.createForClass(UserInfo)


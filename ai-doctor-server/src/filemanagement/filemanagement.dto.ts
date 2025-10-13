import { IsString, IsNotEmpty, Matches } from 'class-validator'
//删除文件
export class DeletefileDto {
    //文件id
    @IsString({ message: 'docId必须是字符串类型' })
    @IsNotEmpty({ message: 'docId不能为空' })
    docId: string
}

//删除图片需要传递的参数
export class DeleteImageDto {
    //图片路径
    @IsString({ message: 'imagePath必须是字符串' })
    @IsNotEmpty({ message: 'imagePath不能为空' })
    imagePath: string
}
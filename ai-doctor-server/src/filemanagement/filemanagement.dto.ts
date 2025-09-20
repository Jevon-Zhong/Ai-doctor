import { IsString, IsNotEmpty, Matches } from 'class-validator'
//删除文件
export class DeletefileDto {
    //文件id
    @IsString({ message: 'docId必须是字符串类型' })
    @IsNotEmpty({ message: 'docId不能为空' })
    docId: string
}
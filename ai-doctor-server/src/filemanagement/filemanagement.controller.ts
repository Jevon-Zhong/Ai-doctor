import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
@Controller('filemanagement')
export class FilemanagementController {
    //上传文件（知识库）
    @Post('uploadkb')
    @UseGuards(AuthGuard)
    uploadFile(@Req() req: {user: {token: string}}) {
        console.log('123')
        console.log(req.user.token)
    }
}

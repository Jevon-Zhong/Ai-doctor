import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { SendMessageQueryDto, SingleChatDataDto } from './chat.dto';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';
import type { Response } from 'express';
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService
    ) { }
    //用户发送消息
    @Post('sendmessage')
    @UseGuards(AuthGuard)
    async sendMessage(
        @Req() req: { user: { token: string } },
        @Body() body: SendMessageQueryDto,
        @Res() stream: Response
    ) {
        const { content, uploadFileList, sessionId, isKnowledgeBased, uploadImage } = body
        const userId = new Types.ObjectId(req.user.token)
        await this.chatService.combineConversation(
            userId,
            content,
            stream,
            sessionId,
            uploadFileList,
            isKnowledgeBased,
            uploadImage
        )
    }

    //获取对话列表
    @Get('getchatlist')
    @UseGuards(AuthGuard)
    async getChatList(
        @Req() req: { user: { token: string } }
    ) {
        return await this.chatService.getChatList(req.user.token)
    }

    //获取某个会话的对话数据
    @Get('singlechatdata')
    @UseGuards(AuthGuard)
    async singleChatData(
        @Req() req: { user: { token: string } },
        @Query() query: SingleChatDataDto
    ) {
        const { sessionId } = query
        return await this.chatService.singleChatData(req.user.token, sessionId)
    }

    //终止模型的输出
    @Post('stopoutput')
    @UseGuards(AuthGuard)
    async stopOutput(
        @Req() req: { user: { token: string } },
        @Body() Body: SingleChatDataDto
    ) {
        const { sessionId } = Body
        return await this.chatService.stopOutput(sessionId)
    }

//对话框删除文件
    @Delete('deletedialog/:sessionId')
    @UseGuards(AuthGuard)
    async deleteDialog(
        @Req() req: { user: { token: string } },
        // @Body() body: DeletefileDto
        @Param() param: any
    ) {
        const { sessionId } = param
        console.log(sessionId)
        const userId = req.user.token
        return await this.chatService.deleteDialog(userId, sessionId)
    }

}

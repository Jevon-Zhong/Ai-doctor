import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { SendMessageQueryDto } from './chat.dto';
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
        const { content, uploadFileList, sessionId, isKnowledgeBased } = body
        const userId = new Types.ObjectId(req.user.token)
        await this.chatService.combineConversation(
            userId,
            content,
            stream,
            sessionId,
            uploadFileList,
            isKnowledgeBased
        )
    }
}

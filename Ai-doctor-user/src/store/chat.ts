import type { MessageListType } from '@/types'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
    state: () => ({
        sessionId: '',
        messageList: [] as MessageListType[],
        disabledStatus: false, //发送后消息时禁止点击其他按钮
    }),
    getters: {
        getSessionId(): string {
            return this.sessionId
        },
        getMessageList(): MessageListType[] {
            return this.messageList
        },
        getDisabledStatus(): boolean {
            return this.disabledStatus
        }
    },
    actions: {
        setSessionId(sessionId: string) {
            this.sessionId = sessionId
        },
        addMessageList(messageObj: MessageListType) {
            this.messageList.push(messageObj)
        },
        setDisabledStatus(disabledStatus: boolean) {
            this.disabledStatus = disabledStatus
        }
    },
    persist: {
        key: 'chat-store',
        storage: localStorage,
        pick: ['sessionId']
    }
})
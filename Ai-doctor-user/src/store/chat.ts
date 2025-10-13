import type { MessageListType, GetchatlistType } from '@/types'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
    state: () => ({
        sessionId: '',
        messageList: [] as MessageListType[],
        chatListDataArr: [] as GetchatlistType[],//对话列表
        disabledStatus: false, //发送后消息时禁止点击其他按钮
        chatWelcome: false,//是否显示欢迎界面
    }),
    getters: {
        getSessionId(): string {
            return this.sessionId
        },
        getMessageList(): MessageListType[] {
            return this.messageList
        },
        getChatListData(): GetchatlistType[] {
            return this.chatListDataArr
        },
        getDisabledStatus(): boolean {
            return this.disabledStatus
        },
        getChatWelcome(): boolean {
            return this.chatWelcome
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
        },
        setChatListData(chatListDataArr: GetchatlistType[]) {
            this.chatListDataArr = chatListDataArr
        },
        unshiftChatListData(chatListData: GetchatlistType) {
            this.chatListDataArr.unshift(chatListData)
        },
        setMessageList(messageList: MessageListType[]) {
            this.messageList = messageList
        },
        setChatWelcome(chatWelcome: boolean) {
            this.chatWelcome = chatWelcome
        },
    },
    persist: {
        key: 'chat-store',
        storage: localStorage,
        pick: ['sessionId', 'chatWelcome']
    }
})
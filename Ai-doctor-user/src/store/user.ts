import type { UserInfoResType } from '@/types'
import { defineStore } from 'pinia'
import { useChatStore } from './chat'
const chatStore = useChatStore()
export const useUserStore = defineStore('user', {
    state: () => ({
        userInfo: {
            token: '',
            phoneNumber: '',
            avatar: ''
        }
    }),
    getters: {
        getUserInfo(): UserInfoResType {
            return this.userInfo
        },
    },
    actions: {
        setUserInfo(userInfo: UserInfoResType) {
            this.userInfo = userInfo
        },
        logOut() {
            this.userInfo = {
                token: '',
                phoneNumber: '',
                avatar: ''
            }
            chatStore.setChatWelcome(true)
            chatStore.setChatListData([])
            chatStore.setMessageList([])
        }
    },
    persist: true
})
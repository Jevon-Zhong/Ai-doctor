// stores/index.js
import type { UserInfoResType } from '@/types'
import { defineStore } from 'pinia'

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
    },
    persist: true
})
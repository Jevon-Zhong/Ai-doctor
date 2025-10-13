<template>
    <div class="chat-history-view">
        <div class="new-dialog">
            <el-button type="primary" :disabled="chatStore.getDisabledStatus" @click="createSession">新建对话</el-button>
        </div>
        <div class="dialog-outer">
            <div class="dialog-list"
                :style="{ backgroundColor: item.sessionId === chatStore.getSessionId ? '#f3f2ff' : '' }"
                @click="handleSessionClick(item.sessionId)" v-for="(item, index) in chatStore.getChatListData"
                :key="index">
                <div class="dialog-list-item hidden-text"
                    :style="{ color: item.sessionId === chatStore.getSessionId ? '#615ced' : '' }">
                    {{ item.content }}
                </div>
            </div>
        </div>
        <!-- 个人信息 -->
        <div class="user-profile">
            <div class="avatar-username" v-if="userStore.getUserInfo.token">
                <img :src="userStore.getUserInfo.avatar" alt="">
                <span>{{ userStore.getUserInfo.phoneNumber }}</span>
            </div>
            <el-button v-else type="primary" @click="appStore.setShowLoginPopup(true)">登陆</el-button>
            <el-button v-if="userStore.getUserInfo.token" type="primary"
                @click="appStore.setKnowledgePopup(true)">知识库管理</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { useChatStore } from "@/store/chat";
import { getChatListApi, singlechatdata } from "@/api/request";
import { onMounted } from "vue";
const appStore = useAppStore()
const userStore = useUserStore()
const chatStore = useChatStore()

onMounted(async () => {
    const res = await getChatListApi()
    chatStore.setChatListData(res.data)
    //如果pinia的sessionId有值，就获取当前对话下的数据
    if (chatStore.sessionId) {
        await getSinglechatdata()
    }
})

const getSinglechatdata = async () => {
    const loading = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.8)',
    })
    const res = await singlechatdata({ sessionId: chatStore.getSessionId })
    console.log(res)
    chatStore.setMessageList(res.data)
    loading.close()
}

const handleSessionClick = async (sessionId: string) => {
    if (chatStore.disabledStatus) return
    chatStore.setChatWelcome(false)
    chatStore.sessionId = sessionId
    await getSinglechatdata()

}

//新建对话
const createSession = () => {
    chatStore.setChatWelcome(true)
    chatStore.setSessionId('')
    chatStore.setMessageList([])
}
</script>

<style scoped lang="less">
.chat-history-view {
    background-color: #fff;
    width: 230px;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    // overflow-y: auto;

    .new-dialog {
        position: relative;
        top: 0;
        left: 0;
        width: 230px;
        height: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .dialog-outer {
        height: 75vh;
        overflow-y: auto;
        .dialog-list {
            margin: 10px;
            padding: 8px;
            border-radius: 8px;
            .dialog-list-item {}
        }
    }

    .dialog-list:hover {
        background-color: #f3f2ff;
        cursor: pointer;

        .dialog-list-item {
            color: #615ced;
        }
    }

    .user-profile {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 230px;
        height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .avatar-username {
            display: flex;
            align-items: center;
            padding-bottom: 20px;

            img {
                width: 30px;
                height: 30px;
                object-fit: cover;
                border-radius: 50%;
                margin-right: 7px;
            }
        }
    }
}
</style>

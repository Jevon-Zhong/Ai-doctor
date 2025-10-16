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
                <div class="dialog-list-item"
                    :style="{ color: item.sessionId === chatStore.getSessionId ? '#615ced' : '' }">
                    <span class="hidden-text">{{ item.content }}</span>
                    <el-icon class="delete-dialog" @click.stop="deleteDialog(item.sessionId)">
                        <CloseBold />
                    </el-icon>
                </div>
            </div>
        </div>
        <!-- 个人信息 -->
        <div class="user-profile">
            <el-dropdown trigger="click" placement="top-start" v-if="userStore.getUserInfo.token">
                <div class="avatar-username">
                    <img :src="userStore.getUserInfo.avatar" alt="">
                    <span>{{ userStore.getUserInfo.phoneNumber }}</span>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="logOut">退出登陆</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
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
import { deleteDialogApi, getChatListApi, singlechatdata } from "@/api/request";
import { CloseBold } from "@element-plus/icons-vue";
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

//删除对话
const deleteDialog = (sessionId: string) => {
    console.log(sessionId)
    ElMessageBox.confirm(
        '删除后，聊天记录将不可恢复?',
        '确定删除对话？',
        {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            await deleteDialogApi(sessionId)
            ElMessage({
                type: 'success',
                message: 'Delete completed',
            })
            if (sessionId === chatStore.getSessionId) {
                chatStore.setSessionId('')
                chatStore.setChatWelcome(true)
            }
            const res = await getChatListApi()
            chatStore.setChatListData(res.data)
        })
        .catch(() => {
            ElMessage({
                type: 'info',
                message: 'Delete canceled',
            })
        })
}

const logOut = async () => {
    userStore.logOut()
    const res = await getChatListApi()
    chatStore.setChatListData(res.data)
    //如果pinia的sessionId有值，就获取当前对话下的数据
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

            .dialog-list-item {
                display: flex;
                align-items: center;
                justify-content: space-between;

                .delete-dialog {
                    opacity: 0;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
            }
        }
    }

    .dialog-list:hover {
        background-color: #f3f2ff;
        cursor: pointer;

        .dialog-list-item {
            color: #615ced;
        }

        .dialog-list-item:hover {
            .delete-dialog {
                opacity: 1;
            }
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
            cursor: pointer;

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

<template>
    <div class="chat-history-view">
        <div class="new-dialog">
            <el-button type="primary">新建对话</el-button>
        </div>
        <div class="dialog-list">
            <div class="dialog-list-item hidden-text">
                hellohellohellohellohellohello
            </div>
        </div>
        <!-- 个人信息 -->
        <div class="user-profile">
            <div class="avatar-username" v-if="userStore.getUserInfo.token">
                <img :src="userStore.getUserInfo.avatar" alt="">
                <span>{{ userStore.getUserInfo.phoneNumber }}</span>
            </div>
            <el-button v-else type="primary" @click="appStore.setShowLoginPopup(true)">登陆</el-button>
            <el-button v-if="userStore.getUserInfo.token" type="primary" @click="appStore.setKnowledgePopup(true)">知识库管理</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
const appStore = useAppStore()
const userStore = useUserStore()
</script>

<style scoped lang="less">
.chat-history-view {
    background-color: #fff;
    width: 230px;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    overflow-y: auto;

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

    .dialog-list {
        margin: 10px;
        padding: 8px;
        border-radius: 8px;

        .dialog-list-item {}
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

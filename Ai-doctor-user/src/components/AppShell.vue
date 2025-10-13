<template>
    <div class="chat-layout">
        <ChatHistory />
        <ChatWelcome v-if="chatStore.getChatWelcome"/>
        <ChatWindow v-else/>
    </div>
    <ChatInput />
    <Knowledge />
    <UserLogin />
</template>

<script setup lang="ts">
import ChatHistory from './ChatHistory.vue';
import ChatWindow from './ChatWindow.vue';
import ChatWelcome from './ChatWelcome.vue';
import ChatInput from './ChatInput.vue';
import Knowledge from './Knowledge.vue';
import UserLogin from './UserLogin.vue';
import { useChatStore } from '@/store/chat';
const chatStore = useChatStore()
</script>

<style scoped lang="less">
.chat-layout {
    display: flex;
    height: 100vh;
}
</style>
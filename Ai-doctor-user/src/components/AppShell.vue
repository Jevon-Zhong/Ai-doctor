<template>
    <div class="chat-layout">
        <ChatHistory />
        <ChatWindow />
        <!-- <ChatWelcome /> -->
    </div>
    <ChatInput />
    <Knowledge />
</template>

<script setup lang="ts">
import ChatHistory from './ChatHistory.vue';
import ChatWindow from './ChatWindow.vue';
import ChatWelcome from './ChatWelcome.vue';
import ChatInput from './ChatInput.vue';
import Knowledge from './Knowledge.vue';
</script>

<style scoped lang="less">
.chat-layout {
    display: flex;
    height: 100vh;
}
</style>
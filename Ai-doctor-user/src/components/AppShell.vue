<template>
    <div class="chat-layout">
        <ChatHistory />
        <!-- <ChatWindow /> -->
        <ChatWelcome />
    </div>
</template>

<script setup lang="ts">
import ChatHistory from './ChatHistory.vue';
import ChatWindow from './ChatWindow.vue';
import ChatWelcome from './ChatWelcome.vue';
</script>

<style scoped lang="less">
.chat-layout {
    display: flex;
    height: 100vh;
}
</style>
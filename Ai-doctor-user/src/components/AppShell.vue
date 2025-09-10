<template>
    <div class="chat-layout">
        <ChatHistory />
        <ChatWindow />
    </div>
</template>

<script setup lang="ts">
import ChatHistory from './ChatHistory.vue';
import ChatWindow from './ChatWindow.vue';
</script>

<style scoped lang="less">
.chat-layout {
    display: flex;
    height: 100vh;
}
</style>
<template>
<div class="chat-window">
    <div class="chat-message">
        <img src="../assets/zhanshi.png" alt="">
        <span class="title">我是Ai医生助手，很高兴见到你!</span>
        <span class="subtitle">无论你想了解什么疾病的症状、治疗方法，还是关系日常养生，我都能为你提供科学的解答和建议</span>
    </div>
</div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="less">
.chat-window {
    width: 100%;
    margin-left: 230px;
    display: flex;
    .chat-message {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        max-width: 1000px;
        margin: 0 auto;
        padding-bottom: 90px;
        img {
            width: 280px;
        }
        .title {
            font-size: 25px;
            padding-top: 15px;
        }
        .subtitle {
            padding-top: 15px;
        }
    }
}
</style>
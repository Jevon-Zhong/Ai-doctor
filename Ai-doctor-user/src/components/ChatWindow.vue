<template>
    <div class="chat-window">
        <div class="chat-message" v-for="(item, index) in chatStore.getMessageList" :key="index">
            <!-- 用户消息 -->
            <div class="user-message" v-if="item.role === 'user'">
                <p>{{ item.displayContent || item.content }}</p>
            </div>
            <!-- 展示文件 -->
            <div class="file-view">
                <div class="file-item" v-for="(fileItem, fileIndex) in item.uploadFileList" :key="fileIndex">
                    <div class="file-icon">
                        <img :src="fileItem.fileType === 'PDF' ? pdfIcon : docxIcon" alt="">
                    </div>
                    <div class="file-name">
                        <span class="title hidden-text">{{ fileItem.fileName }}</span>
                        <span class="size">{{ fileItem.fileSize }}</span>
                    </div>
                </div>
            </div>
            <!-- 模型消息 -->
            <div class="ai-message" v-if="item.role === 'assistant'">
                <el-collapse v-if="item.readFileData">
                    <el-collapse-item :title="item.readFileData.promptInfo">
                        <div v-for="(listItem, listIndex) in item.readFileData.fileList" :key="listIndex">
                            {{ `${listIndex + 1}.${listItem}` }}
                        </div>
                    </el-collapse-item>
                </el-collapse>
                <div v-html="marked(item.content)" />
                <!-- 动画效果 -->
                <div class="loading-circle" v-if="item.loadingCircle"></div>
            </div>
        </div>
        <div style="height: 250px;"></div>
    </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/store/chat';
import docxIcon from '@/assets/docx-icon.png'
import pdfIcon from '@/assets/pdf-icon.png'
import { marked } from 'marked';
const chatStore = useChatStore()

</script>

<style scoped lang="less">
.chat-window {
    margin-left: 230px;
    width: 100%;
    height: 100vh;
}

.chat-message {
    display: flex;
    flex-direction: column;
    max-width: 1000px;
    margin: 0 auto;
    overflow: hidden;

    .user-message {
        margin-top: 15px;
        max-width: 70%;
        align-self: flex-end;

        p {
            line-height: 1.5;
            background-color: #3a71e8;
            border-radius: 10px;
            color: #fff;
            padding: 10px;
        }
    }

    .file-view {
        display: flex;
        align-items: center;
        align-self: flex-end;
        flex-wrap: wrap;
        margin-top: 15px;

        .file-item {
            display: inline-flex;
            border: 1px solid #f3f3f3;
            padding: 5px;
            border-radius: 10px;
            align-self: flex-end;
            background-color: #fff;
            max-width: 200px;
            margin-left: 5px;

            .file-icon {
                display: flex;
                align-self: center;

                img {
                    width: 30px;
                    height: 30px;
                }
            }

            .file-name {
                display: flex;
                flex-direction: column;
                margin-left: 10px;

                .title {
                    font-size: 14px;
                }

                .size {
                    font-size: 12px;
                    color: #8d8ea5;
                }
            }
        }
    }

    .ai-message {
        margin-top: 15px;
        background-color: #fff;
        padding: 10px;
        border-radius: 10px;

        :deep(.el-collapse-item__title) {
            color: blue;
            font-size: 15px;
        }

        :deep(.el-collapse-item__content) {
            background-color: #f7f8fc;
            padding-bottom: 0 !important;
            padding-left: 5px;
        }

        .el-collapse {
            margin-bottom: 10px;
        }

        .loading-circle {
            width: 12px;
            height: 12px;
            background-color: #3a71e8;
            border-radius: 50%;
            margin: 5px 0;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {

            0%,
            100% {
                transform: scale(1);
                opacity: 1;
            }

            50% {
                transform: scale(1.5);
                opacity: 0.7;
            }
        }
    }
}
</style>
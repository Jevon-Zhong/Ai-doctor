<template>
    <div class="chat-window">
        <div class="chat-message">
            <!-- 用户消息 -->
            <div class="user-message">
                <p>hello</p>
            </div>
            <!-- 展示文件 -->
            <div class="file-view">
                <div class="file-item">
                    <div class="file-icon">
                        <img src="../assets/docx-icon.png" alt="">
                    </div>
                    <div class="file-name">
                        <span class="title">文档标题</span>
                        <span class="size">32kb</span>
                    </div>
                </div>
            </div>
            <!-- 模型消息 -->
            <div class="ai-message">
                <el-collapse>
                    <el-collapse-item title="为你检索到......">
                        <div>
                            Consistent with real life: in line with the process and logic of real
                            life, and comply with languages and habits that the users are used to;
                        </div>
                    </el-collapse-item>
                </el-collapse>
                <div>模型回复纯文本</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// import { ref } from "vue"
</script>

<style scoped lang="less">
.chat-window {
    margin-left: 230px;
    width: 100%;
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
            max-width: 270px;
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
        /deep/.el-collapse-item__title {
            color: blue;
            font-size: 15px;
        }
        /deep/.el-collapse-item__content {
            background-color: #f7f8fc;
            padding-bottom: 0 !important;
            padding-left: 5px;
        }
        .el-collapse {
            margin-bottom: 10px;
        }
    }
}
</style>
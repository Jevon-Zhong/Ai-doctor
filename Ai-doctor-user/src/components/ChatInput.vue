<template>
    <div class="chat-input">
        <div class="chat-input-flex">
            <el-button @click="queryKb">
                <img src="../assets/zhishiku.png" alt="">
                <span>知识库问答</span>
            </el-button>
            <div class="upload-file-list">
                <div class="upload-file-item">
                    <img src="../assets/docx-icon.png" alt="">
                    <div class="box">
                        <span class="title hidden-text">文档标题文档标题文档标题文档标题</span>
                        <span class="size">32kb</span>
                    </div>
                    <el-icon :size="11" class="delete-file">
                        <CloseBold />
                    </el-icon>
                </div>
            </div>
            <div class="chat-input-content">
                <input type="file" multiple :accept="uploadFileType" style="display: none;">
                <el-tooltip placement="top" effect="customized" content="每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型">
                    <div class="upload-icon-box">
                        <img src="../assets/upload-icon.png" alt="">
                    </div>
                </el-tooltip>
                <el-input @keydown="handleKeyDown" resize="none" :autosize="{ minRows: 1, maxRows: 4 }" v-model="userMessage" type="textarea"
                    placeholder="任何健康问题都可以问我，Shift + Enter换行" />
                <el-button>
                    <img src="../assets/send-icon.png" alt="">
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CloseBold } from "@element-plus/icons-vue";
import { ref, reactive } from 'vue'
const uploadFileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'
// 用户输入内容
let userMessage = ref('')
//键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
    //阻止回车
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
    }
}

const queryKbStyle = reactive({
    border: '#eceff3',
    backgroundColor: '#fff',
    color: '#d783af'
})

const isKnowledgeBased = ref(false)
//点击知识库按钮
const queryKb = () => {
    isKnowledgeBased.value = !isKnowledgeBased.value
    if (isKnowledgeBased.value) {
        //选中
        queryKbStyle.backgroundColor = '#597CEE'
        queryKbStyle.border = '#597cEE'
        queryKbStyle.color = '#fff'
    } else {
        //取消选中
        queryKbStyle.backgroundColor = '#fff'
        queryKbStyle.border = '#eceff3'
        queryKbStyle.color = '#d783af'
    }
}
</script>

<style scoped lang="less">
.chat-input {
    // background-color: red;
    position: fixed;
    left: 230px;
    bottom: 0;
    right: 0;
    padding-bottom: 30px;

    .chat-input-flex {
        display: flex;
        flex-direction: column;
        max-width: 1000px;
        margin: 0 auto;
        box-sizing: border-box;
        background-color: #fff;
        border: 1px solid #615ced;
        padding: 15px;
        border-radius: 20px;
        box-shadow: 0 1px 11px 7px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        // 知识库问答
        .el-button {
            width: fit-content;
            padding: initial;
            height: auto;
            border: 1px solid v-bind('queryKbStyle.border');
            border-radius: 20px;
            background-color: v-bind('queryKbStyle.backgroundColor');
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            padding: 7px;

            span {
                font-size: 14px;
                padding-left: 6px;
                color: v-bind('queryKbStyle.color');
            }

            img {
                width: 15px;
            }
        }

        // 文件列表
        .upload-file-list {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            padding-bottom: 15px;

            .upload-file-item {
                display: flex;
                align-items: center;
                border: 1px solid #cecfdd;
                border-radius: 10px;
                max-width: 200px;
                padding: 5px;
                margin-right: 5px;
                position: relative;

                img {
                    width: 30px;
                    height: 30px;
                }

                .box {
                    .title {
                        font-size: 14px;
                    }

                    .size {
                        font-size: 10px;
                        color: #cecfdd;
                    }
                }

                .delete-file {
                    position: absolute;
                    bottom: 2px;
                    right: 4px;
                }

            }
        }

        // 输入框
        .chat-input-content {
            display: flex;
            align-items: flex-end;

            .upload-icon-box {
                width: 34px;
                height: 34px;
                display: flex;
                align-items: center;
                cursor: pointer;

                img {
                    width: 20px;
                    height: 20px;
                }
            }

            .el-button {
                width: 34px;
                height: 34px;
                border-radius: 50%;
                margin-left: 10px;
                background: none;
                border: none;

                img {
                    width: 34px;
                }
            }

            /deep/.el-textarea__inner:focus {
                box-shadow: none;
                border: none;
            }

            /deep/.el-textarea__inner {
                box-shadow: none;
                border: none;
                font-size: 16px;
            }
        }

    }
}
</style>
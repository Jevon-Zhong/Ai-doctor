<template>
    <div class="chat-input">
        <div class="chat-input-flex">
            <el-button @click="queryKb" v-if="uploadfileList.length <= 0">
                <img src="../assets/zhishiku.png" alt="">
                <span>知识库问答</span>
            </el-button>
            <div class="upload-file-list" v-if="uploadfileList.length > 0">
                <div class="upload-file-item" v-for="(item, index) in uploadfileList" :key="index">
                    <img :src="item.fileType === 'PDF' ? pdfIcon : docxIcon" alt="">
                    <div class="box">
                        <span class="title hidden-text">{{ item.fileName }}</span>
                        <span class="size">{{ item.fileSize }}</span>
                    </div>
                    <el-icon :size="11" class="delete-file" @click="deleteFile(item.docId)">
                        <CloseBold />
                    </el-icon>
                </div>
            </div>
            <div class="chat-input-content">
                <input @change="handleFileChange" ref="fileInputRef" type="file" multiple :accept="uploadFileType"
                    style="display: none;">
                <el-tooltip placement="top" effect="customized" content="每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型">
                    <div class="upload-icon-box">
                        <img src="../assets/upload-icon.png" alt="" @click="triggerFileInput">
                    </div>
                </el-tooltip>
                <el-input @keydown="handleKeyDown" resize="none" :autosize="{ minRows: 1, maxRows: 4 }"
                    v-model="userMessage" type="textarea" placeholder="任何健康问题都可以问我，Shift + Enter换行" />
                <el-button @click="sendMessage" v-show="!chatStore.getDisabledStatus">
                    <img src="../assets/send-icon.png" alt="">
                </el-button>
                <el-button @click="stopOutput" v-show="chatStore.getDisabledStatus">
                    <img src="../assets/stop-icon.png" alt="">
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CloseBold } from "@element-plus/icons-vue";
import { ref, reactive } from 'vue'
import { uploadDialogApi, deletefileApi, sendMessageApi, stopoutputApi } from '@/api/request'
import type { kbFileListType } from "@/types";
import { useUserStore } from "@/store/user";
import { useChatStore } from "@/store/chat";
import { validators } from '@/utils/validators'
import docxIcon from '@/assets/docx-icon.png'
import pdfIcon from '@/assets/pdf-icon.png'
const userStore = useUserStore()
const chatStore = useChatStore()
const uploadFileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'
// 用户输入内容
let userMessage = ref('')
//键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
    //阻止回车
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
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

//临时存储上传的文件
const uploadfileList = ref<kbFileListType>([])
//调用input上传
const fileInputRef = ref<HTMLInputElement>()
const triggerFileInput = () => {
    fileInputRef.value?.click()
}

//监听文件上传
const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const files = input.files as FileList
    if (files.length <= 0) return;
    //如果没有登陆，禁止上传
    if (!userStore.getUserInfo.token) {
        ElMessage('请先登陆！')
    }
    //每次最多选择三个文件
    if (files.length > 3) {
        ElMessage('每次最多选择三个文件')
        return
    }
    //对话框上传文件，最多上传三个
    if (uploadfileList.value.length >= 3) {
        ElMessage('最多只能上传三个文件！')
        return
    }
    const loading = ElLoading.service({
        lock: true,
        text: '文件上传中...',
        background: 'rgba(0, 0, 0, 0.8)',
    })
    //过滤掉文件不是pdf和docx的，并且大于5mb的
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf']
    const formData = new FormData
    const maxSize = 5 * 1024 * 1024
    for (const file of files) {
        if (allowedTypes.includes(file.type) && file.size <= maxSize) {
            formData.append('file', file)
        }
    }
    try {
        const res = await uploadDialogApi(formData)
        uploadfileList.value = res.data
        loading.close()
    } catch (error) {
        loading.close()
        ElMessage('上传出错')
    }
}

const deleteFile = async (docId: string) => {
    const loading = ElLoading.service({
        lock: true,
        text: '删除中...',
        background: 'rgba(0, 0, 0, 0.8)',
    })
    try {
        await deletefileApi(docId)
        uploadfileList.value = uploadfileList.value.filter(item => (item.docId !== docId))
        loading.close()
    } catch (error) {
        loading.close()
    }
}

const sendMessage = () => {
    //校验
    validators.isNotEmpty(userMessage.value, '请输入内容')
    chatStore.addMessageList({
        role: 'user',
        content: userMessage.value.trim(),
        ...(uploadfileList.value.length > 0 && { uploadFileList: uploadfileList.value }),
        ...(uploadfileList.value.length > 0 && { displayContent: userMessage.value.trim() })
    })
    chatStore.addMessageList({
        role: 'assistant',
        content: '',
        loadingCircle: true
    })
    chatStore.setDisabledStatus(true)
    chatStore.setChatWelcome(false)
    //如果是新建对话，需要把问题加入对话列表的第一项
    if (!chatStore.getSessionId) {
        chatStore.unshiftChatListData({ sessionId: '', content: userMessage.value.trim() })
    }
    sendMessageApi({
        content: userMessage.value.trim(),
        sessionId: chatStore.getSessionId,
        uploadFileList: uploadfileList.value,
        isKnowledgeBased: isKnowledgeBased.value
    })

    //清空输入框和临时文件
    userMessage.value = ''
    uploadfileList.value.length = 0
}

//终止模型输出
const stopOutput = async () => {
    await stopoutputApi({ sessionId: chatStore.sessionId })
}
</script>

<style scoped lang="less">
.chat-input {
    background-color: #f6f7fb;
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
                    margin-left: 10px;

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

            :deep(.el-textarea__inner:focus) {
                box-shadow: none;
                border: none;
            }

            :deep(.el-textarea__inner) {
                box-shadow: none;
                border: none;
                font-size: 16px;
            }
        }

    }
}
</style>
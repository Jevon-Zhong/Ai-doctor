<template>
    <el-drawer @open="onOpen" @close="appStore.setKnowledgePopup(false)" v-model="appStore.getKnowledgePopup"
        title="个人知识库管理" size="600">
        <div class="file-data-list">
            <div class="file-data-item" v-for="item in uploadfileList">
                <img :src="item.fileType === 'PDF' ? pdfIcon : docxIcon" alt="">
                <span class="hidden-text">{{ item.fileName }}</span>
                <el-icon class="delete-file" @click="deletefilekb(item.docId)">
                    <CloseBold />
                </el-icon>
            </div>
        </div>
        <div class="file-upload">
            <input @change="handleFileChange" ref="fileInputRef" type="file" multiple :accept="uploadFileType"
                style="display: none;">
            <el-tooltip placement="top" effect="customized" content="每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型">
                <el-button type="primary" @click="triggerFileInput">上传文件</el-button>
            </el-tooltip>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { CloseBold } from "@element-plus/icons-vue";
import { useAppStore } from "@/store/app"
import type { kbFileListType } from "@/types";
import { ref } from "vue";
import { uploadkbApi, getKbFileListApi, deletefilekbApi } from "@/api/request";
import { useUserStore } from "@/store/user";
import docxIcon from '@/assets/docx-icon.png'
import pdfIcon from '@/assets/pdf-icon.png'
const userStore = useUserStore()
const appStore = useAppStore()
const uploadFileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'

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
        await uploadkbApi(formData)
        const res = await getKbFileListApi()
        uploadfileList.value = res.data
        loading.close()
    } catch (error) {
        loading.close()
        ElMessage('上传出错')
    }
}

//监听知识库侧边栏打开
const onOpen = async () => {
    const res = await getKbFileListApi()
    uploadfileList.value = res.data
}

const deletefilekb = async (docId: string) => {
    const loading = ElLoading.service({
        lock: true,
        text: '删除中...',
        background: 'rgba(0, 0, 0, 0.8)',
    })
    try {
        console.log(docId)
        await deletefilekbApi(docId)
        const res = await getKbFileListApi()
        uploadfileList.value = res.data
        loading.close()
    } catch (error) {
        loading.close()
    }
}
</script>

<style scoped lang="less">
.file-data-list {
    margin-bottom: 70px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 20px;

    .file-data-item {
        border: 1px solid #888;
        padding: 7px;
        border-radius: 10px;
        position: relative;

        img {
            width: 70px;
            height: 70px;
        }

        .delete-file {
            position: absolute;
            right: 4px;
            top: 4px;
            opacity: 0;
            cursor: pointer;
            transition: opacity 0.2s;
        }
    }

    .file-data-item:hover {
        .delete-file {
            opacity: 1;
        }
    }
}

.file-upload {
    background-color: #fff;
    position: fixed;
    bottom: 0;
    right: 0;
    width: 600px;
    height: 70px;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
<template>
    <el-drawer v-model="knowledgePopup" title="个人知识库管理" size="600">
        <div class="file-data-list">
            <div class="file-data-item" v-for="item in 30">
                <img src="../assets/docx-icon.png" alt="">
                <span>文档标题</span>
                <el-icon class="delete-file">
                    <CloseBold />
                </el-icon>
            </div>
        </div>
        <div class="file-upload">
            <input type="file" multiple :accept="uploadFileType" style="display: none;">
            <el-tooltip placement="top" effect="customized" content="每次最多上传3个文件(每个5MB),仅支持PDF,DOCX文件类型">
                <el-button type="primary">上传文件</el-button>
            </el-tooltip>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CloseBold } from "@element-plus/icons-vue";
const uploadFileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf'
const knowledgePopup = ref(false)
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
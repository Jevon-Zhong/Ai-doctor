<template>
    <el-dialog v-model="showLoginPopup" width="400" :close-on-click-modal="false" :close-on-press-escape="false"
        align-center>
        <el-tabs v-model="activeName" class="login-tabs">
            <el-tab-pane label="登陆" name="login">
                <el-input v-model="phoneNumber" placeholder="手机号" />
                <el-input v-model="password" placeholder="密码" type="password" />
                <el-button type="primary">登陆</el-button>
            </el-tab-pane>
            <el-tab-pane label="注册" name="register">
                <el-input v-model="phoneNumber" placeholder="手机号" />
                <el-input v-model="password" placeholder="密码" type="password" />
                <el-input v-model="confirmPassword" placeholder="确认密码" type="password" />
                <el-button type="primary">注册</el-button>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const showLoginPopup = ref(true)
const activeName = ref('login')
const phoneNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
</script>

<style scoped lang="less">
.login-tabs {
    /deep/.el-tabs__item {
        font-size: 16px;
    }

    .el-tab-pane {
        display: flex;
        flex-direction: column;
        align-items: center;
        .el-input {
            margin-bottom: 20px; 
        }
        .el-button {
            width: 100px;
            align-self: flex-end;
        }
    }

}
</style>
<template>
  <el-dialog @close="appStore.setShowLoginPopup(false)" v-model="appStore.getShowLoginPopup" width="400"
    :close-on-click-modal="false" :close-on-press-escape="false" align-center>
    <el-tabs v-model="activeName" class="login-tabs">
      <el-tab-pane label="登陆" name="login">
        <el-input v-model="phoneNumber" placeholder="手机号" />
        <el-input v-model="password" placeholder="密码" type="password" />
        <el-button type="primary" @click="userLogin">登陆</el-button>
      </el-tab-pane>
      <el-tab-pane label="注册" name="register">
        <el-input v-model="phoneNumber" placeholder="手机号" />
        <el-input v-model="password" placeholder="密码" type="password" />
        <el-input v-model="confirmPassword" placeholder="确认密码" type="password" />
        <el-button type="primary" @click="userRegister">注册</el-button>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { validators } from "@/utils/validators";
import { userRegisterApi, userLoginApi, getChatListApi } from '@/api/request'
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import { useChatStore } from "@/store/chat";
const userStore = useUserStore()
const appStore = useAppStore()
const chatStore = useChatStore()
const activeName = ref("login");
const phoneNumber = ref("");
const password = ref("");
const confirmPassword = ref("");

//注册
const userRegister = async () => {
  //校验
  validators.isPhoneNumber(phoneNumber.value)
  validators.isPasswordValid(password.value)
  validators.isEqual(password.value, confirmPassword.value)
  await userRegisterApi({
    phoneNumber: phoneNumber.value,
    password: password.value,
    confirmPassword: confirmPassword.value
  })
  activeName.value = 'login'
};

//登陆
const userLogin = async () => {
  //校验
  validators.isPhoneNumber(phoneNumber.value)
  validators.isPasswordValid(password.value)
  const res = await userLoginApi({
    phoneNumber: phoneNumber.value,
    password: password.value,
  })
  console.log(res)
  //存入pinia
  userStore.setUserInfo(res.data)
  //登陆成功立马获取对话列表数据
  const res1 = await getChatListApi()
  chatStore.setChatListData(res1.data)
  appStore.setShowLoginPopup(false)
  chatStore.setChatWelcome(true)
};
</script>

<style scoped lang="less">
.login-tabs {
  :deep(.el-tabs__item) {
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
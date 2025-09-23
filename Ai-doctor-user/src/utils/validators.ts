export const validators = {
    // 空值校验
    isNotEmpty(value: string, message = '不能为空') {
        if (value.trim() === '') {
            ElMessage(message)
            throw message
        }
    },

    // 手机号校验
    isPhoneNumber(value: string, message = '手机号格式不对') {
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(value)) {
            ElMessage(message)
            throw message
        }
    },

    //密码校验
    isPasswordValid(value: string, message = '密码需要6-8位字母和数字结合') {
        const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/
        if (!pwdRegex.test(value)) {
            ElMessage(message)
            throw message
        }
    },

    //两次密码校验
    isEqual(value1: string, value2: string, message = '两次密码输入不一致') {
        if (value1.trim() !== value2.trim()) {
            ElMessage(message)
            throw message
        }
    }

}
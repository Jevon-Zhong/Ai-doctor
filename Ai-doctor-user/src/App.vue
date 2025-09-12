<script setup lang="ts">

</script>

<template>
  <RouterView></RouterView>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f6f7fb;
}

p,
div,
span {
  font-size: 16px;
  margin: 0;
  padding: 0;
  display: block;
}
/* 文字提示 */
.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: #876aff;
  color: #fff;
}

.el-popper.is-customized .el-popper__arrow::before {
  background: #876aff;
  right: 0;
}
</style>

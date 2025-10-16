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

body::-webkit-scrollbar {
  width: 0;
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

.hidden-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  box-sizing: border-box;
}

/* 媒体查询 */
@media (max-width: 1460px) {
  .chat-message {
    max-width: 900px !important;
  }

  .chat-input-flex {
    max-width: 900px !important;
  }
}

@media (max-width: 1160px) {
  .chat-message {
    max-width: 700px !important;
  }

  .chat-input-flex {
    max-width: 700px !important;
  }
}

@media (max-width: 1060px) {
  .chat-message {
    width: 700px !important;
  }

  .chat-input-flex {
    width: 700px !important;
  }
}
</style>

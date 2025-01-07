<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 重置浏览器默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
}

.el-menu {
  border-right: none;
  background-color: #304156;
}

.el-menu-item {
  color: #fff;
}

.el-menu-item:hover {
  background-color: #263445;
}
</style>

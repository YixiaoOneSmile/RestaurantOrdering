<template>
  <el-container class="admin-layout">
    <el-aside width="200px">
      <div class="logo">{{ $t('menu.title') }}</div>
      <el-menu :router="true" :default-active="$route.path" background-color="#304156" text-color="#fff"
        active-text-color="#409EFF">
        <el-menu-item index="/admin/tables">
          <i class="el-icon-s-grid"></i>
          <span>{{ $t('menu.tables') }}</span>
        </el-menu-item>
        <el-menu-item index="/admin/table-settings">
          <i class="el-icon-setting"></i>
          <span>{{ $t('menu.tableSettings') }}</span>
        </el-menu-item>
        <el-menu-item index="/admin/menu">
          <i class="el-icon-dish"></i>
          <span>{{ $t('menu.dishes') }}</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <i class="el-icon-s-order"></i>
          <span>{{ $t('menu.orders') }}</span>
        </el-menu-item>
        <el-menu-item index="/admin/printers">
          <i class="el-icon-printer"></i>
          <span>{{ $t('menu.printers') }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header height="60px">
        <div class="header-right">
          <div class="user-info">
            <i class="el-icon-user"></i>
            <span>Admin</span>
          </div>
          <div class="divider"></div>
          <lang-switch />
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import LangSwitch from '@/views/components/base/LangSwitch.vue'

export default {
  name: 'AdminLayout',
  components: {
    LangSwitch
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  background: #2b2f3a;
}

.el-aside {
  background-color: #304156;
}

.el-menu {
  border: none;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #dcdfe6;
}
</style> 
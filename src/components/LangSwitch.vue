<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <span class="lang-switch">
      <i class="el-icon-globe"></i>
      {{ getCurrentLangLabel }}<i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="zh">中文</el-dropdown-item>
      <el-dropdown-item command="en">English</el-dropdown-item>
      <el-dropdown-item command="ja">日本語</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  name: 'LangSwitch',
  computed: {
    getCurrentLangLabel() {
      const labels = {
        zh: '中文',
        en: 'English',
        ja: '日本語'
      }
      return labels[this.$i18n.locale]
    }
  },
  methods: {
    handleCommand(lang) {
      this.$i18n.locale = lang
      localStorage.setItem('language', lang)
      this.$message.success(this.$t('common.languageChanged'))
    }
  }
}
</script>

<style scoped>
.lang-switch {
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.lang-switch:hover {
  color: #409EFF;
}
</style> 
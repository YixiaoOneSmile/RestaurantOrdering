<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <span class="lang-switch">
      <i class="el-icon-globe"></i>
      {{ getCurrentLangLabel }}<i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-for="(config, lang) in languages" 
                       :key="lang" 
                       :command="lang">
        {{ config.label }}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import { LANGUAGE_CONFIG } from '@/utils/i18n/language'
export default {
  name: 'LangSwitch',
  data() {
    return {
      languages: LANGUAGE_CONFIG
    }
  },
  computed: {
    getCurrentLangLabel() {
      return this.languages[this.$i18n.locale]?.label
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
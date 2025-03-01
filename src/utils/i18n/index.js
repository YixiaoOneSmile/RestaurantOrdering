import Vue from 'vue'
import VueI18n from 'vue-i18n'
import enLocale from './lang/en'
import zhLocale from './lang/zh'
import jaLocale from './lang/ja'
import elementEnLocale from 'element-ui/lib/locale/lang/en'
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN'
import elementJaLocale from 'element-ui/lib/locale/lang/ja'

Vue.use(VueI18n)

const messages = {
  en: {
    ...enLocale,
    ...elementEnLocale
  },
  zh: {
    ...zhLocale,
    ...elementZhLocale
  },
  ja: {
    ...jaLocale,
    ...elementJaLocale
  }
}

// 获取浏览器语言设置
const getBrowserLang = () => {
  const lang = navigator.language || navigator.browserLanguage
  return lang.toLowerCase().split('-')[0]
}

const i18n = new VueI18n({
  locale: localStorage.getItem('language') || getBrowserLang() || 'zh',
  messages,
  silentTranslationWarn: true
})

export default i18n 
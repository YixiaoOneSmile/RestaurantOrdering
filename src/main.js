import Vue from "vue";
import App from "./App.vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import i18n from "./utils/i18n";
import router from "./router/router";

Vue.use(ElementUI, {
  i18n: (key, value) => i18n.t(key, value),
});

new Vue({
  router,
  i18n,
  render: (h) => h(App),
}).$mount("#app");

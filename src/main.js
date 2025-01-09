import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueRouter from 'vue-router'
import i18n from './i18n'
import TableManagement from './pages/TableManagement.vue'

Vue.use(ElementUI, {
  i18n: (key, value) => i18n.t(key, value)
})
Vue.use(VueRouter)

const routes = [
  { 
    path: '/admin', 
    component: () => import('./layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: 'tables' },
      { path: 'tables', component: TableManagement },
      { path: 'table-settings', component: () => import('./pages/admin/TableSettings.vue') },
      { path: 'menu', component: () => import('./pages/admin/MenuManagement.vue') },
      { path: 'orders', component: () => import('./pages/admin/OrderHistory.vue') }
    ]
  },
  { 
    path: '/table', 
    component: () => import('./layouts/OrderLayout.vue'),
    children: [
      { path: ':tableId', component: () => import('./pages/OrderMenu.vue'), props: true }
    ]
  },
  { path: '/', redirect: '/table/1' }
]

const router = new VueRouter({
  mode: 'history',
  routes
})


new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount('#app')

import Vue from "vue";
import VueRouter from "vue-router";
import TableManagement from "../views/pages/admin/TableManagement.vue";
import TableSettings from "../views/pages/admin/TableSettings.vue";
import MenuManagement from "../views/pages/admin/MenuManagement.vue";
import OrderHistory from "../views/pages/admin/OrderHistory.vue";
import AdminLayout from "../views/layouts/AdminLayout.vue";
import OrderLayout from "../views/layouts/OrderLayout.vue";
import UserMenu from "../views/pages/user/UserMenu.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      { path: "", redirect: "tables" },
      { path: "tables", component: TableManagement },
      { path: "table-settings", component: TableSettings },
      { path: "menu", component: MenuManagement },
      { path: "orders", component: OrderHistory },
    ],
  },
  {
    path: "/table",
    component: OrderLayout,
    children: [{ path: ":tableId", component: UserMenu, props: true }],
  },
  { path: "/", redirect: "/table/1" },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
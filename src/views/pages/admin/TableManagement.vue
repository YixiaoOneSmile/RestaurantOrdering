<template>
  <div class="table-management">
    <!-- admin页面头部 -->
    <div class="tables-container">
      <!-- 桌台列表头部 -->
      <div class="tables-header">
        <h2>{{ $t("table.status") }}</h2>
        <div>
          <!-- 添加桌台 -->
          <el-button type="primary" size="small" @click="showAddTableDialog">
            {{ $t("table.addTable") }}
          </el-button>
          <!-- 刷新桌台 -->
          <el-button type="primary" size="small" @click="refreshTables" :loading="loading">
            {{ $t("common.refresh") }}
          </el-button>
          <!-- 查看点餐码 -->
          <el-button type="success" size="small" @click="showQRCode">
            {{ $t("table.viewQRCode") }}
          </el-button>
        </div>
      </div>
      <!-- 桌台列表 -->
      <div class="tables-grid">
        <div v-for="table in tables" :key="table.id" class="table-item" :class="[table.status]"
          @click="showTableDetail(table)">
          <div class="table-content">
            <!-- 桌号 -->
            <div class="table-number">
              {{ $t("table.numberFormat", { number: table.number }) }}
            </div>
            <!-- 状态 -->
            <div class="table-status">
              <el-tag :type="getTableStatusType(table.status)">
                {{ getTableStatusText(table.status) }}
              </el-tag>
            </div>
            <!-- 订单信息 -->
            <div class="table-info" v-if="table.currentOrder">
              <!-- 开始时间 -->
              <div>
                {{ $t("order.startTime") }}:
                {{ formatTime(table.currentOrder.createdAt) }}
              </div>
              <!-- 总金额 -->
              <div>
                {{ $t("order.amount") }}:
                <span v-if="table.currentOrder && table.currentOrder.items">
                  <span v-for="(amount, currency) in getOrderTotalsByCurrency(
                      table.currentOrder.items
                    )" :key="currency">
                    {{ amount }} {{ formatPrice({ currency: currency }) }}&nbsp;
                  </span>
                </span>
              </div>
              <!-- 结账按钮 -->
              <el-button type="danger" size="small" @click.stop="handleCheckout(table)"
                v-if="table.status === 'dining'">
                {{ $t("order.checkout") }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 结账弹窗 -->
    <CheckoutDialog :visible.sync="checkoutVisible" :order="currentOrder" :paymentMethod.sync="paymentMethod"
      :checkoutLoading="checkoutLoading" @checkout="handleCheckoutWithDialog" />
    <!-- 点餐二维码弹窗 -->
    <el-dialog :title="$t('table.qrCode')" :visible.sync="qrCodeVisible" width="300px">
      <div class="qr-code-content">
        <div v-if="selectedTable">
          <div class="qr-code-table">
            {{ $t("table.numberFormat", { number: selectedTable.number }) }}
          </div>
          <div class="qr-code-image">
            <img :src="getQRCodeUrl(selectedTable.id)" :alt="$t('table.qrCode')" />
          </div>
          <div class="qr-code-tip">
            {{ $t("table.scanToOrder") }}
          </div>
        </div>
        <div v-else>
          {{ $t("table.selectTableFirst") }}
        </div>
      </div>
    </el-dialog>
    <!-- 订单详情弹窗 -->
    <el-dialog :title="$t('order.details')" :visible.sync="orderDetailVisible" width="600px">
      <div v-if="currentOrder" class="order-detail">
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="table-info">
            <span class="label">{{ $t("table.number") }}:</span>
            <span class="value">{{
              $t("table.numberFormat", { number: selectedTable?.number })
              }}</span>
          </div>
          <div class="order-status">
            <el-tag :type="getOrderStatusType(currentOrder.status)">
              {{ getOrderStatusText(currentOrder.status) }}
            </el-tag>
          </div>
        </div>
        <!-- 原始订单菜品 -->
        <div class="order-section">
          <h3 class="section-title">{{ $t("order.originalItems") }}</h3>
          <el-table :data="originalItems" style="width: 100%">
            <!-- 菜品名称 -->
            <el-table-column prop="name" :label="$t('dishes.name')"></el-table-column>
            <!-- 数量 -->
            <el-table-column prop="quantity" :label="$t('order.quantity')" width="100">
              <template #default="{ row }">
                <span class="quantity">x{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <!-- 金额 -->
            <el-table-column :label="$t('order.amount')" width="120">
              <template #default="{ row }">
                <span class="amount">{{ row.price * row.quantity }}
                  {{ formatPrice({ currency: row.currency }) }}</span>
              </template>
            </el-table-column>
            <!-- 操作 -->
            <el-table-column :label="$t('common.action')" width="80" align="center">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeItem(row)">{{ $t("common.remove") }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- 追加的菜品 -->
        <div v-if="appendedItems.length" class="order-section appended-section">
          <h3 class="section-title">{{ $t("order.appendedItems") }}</h3>
          <el-table :data="appendedItems" style="width: 100%">
            <!-- 菜品名称 -->
            <el-table-column prop="name" :label="$t('dishes.name')"></el-table-column>
            <!-- 数量 -->
            <el-table-column prop="quantity" :label="$t('order.quantity')" width="100">
              <template #default="{ row }">
                <span class="quantity">x{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <!-- 金额 -->
            <el-table-column :label="$t('order.amount')" width="120">
              <template #default="{ row }">
                <span class="amount">{{ row.price * row.quantity }}
                  {{ formatPrice({ currency: row.currency }) }}</span>
              </template>
            </el-table-column>
            <!-- 操作 -->
            <el-table-column :label="$t('common.action')" width="80" align="center">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeItem(row)">{{ $t("common.remove") }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- 订单详情底部 -->
        <div class="order-footer">
          <div class="order-time">
            <div>
              {{ $t("order.orderTime") }}:
              {{ formatTime(currentOrder.createdAt) }}
            </div>
            <div v-if="currentOrder.completedAt">
              {{ $t("order.completedTime") }}:
              {{ formatTime(currentOrder.completedAt) }}
            </div>
          </div>
          <div class="order-total">
            <span class="label">{{ $t("order.total") }}:</span>
            <span class="total-amount"><span v-for="(amount, currency) in orderTotalsByCurrency" :key="currency">
                {{ amount }} {{ formatPrice({ currency: currency }) }}&nbsp;
              </span></span>
          </div>
        </div>
        <!-- 操作按钮 -->
        <div class="order-actions">
          <el-button-group>
            <!-- 删除菜品 -->
            <el-button @click="removeOrder()">
              {{ $t("common.remove") }}
            </el-button>
            <!-- 完成订单 -->
            <el-button type="success" :disabled="currentOrder.status === 'completed'" @click="completeOrder">
              {{ $t("order.complete") }}
            </el-button>
          </el-button-group>
        </div>
      </div>
      <!-- 订单详情空状态 -->
      <div v-else class="empty-order">
        {{ $t("order.noOrderInfo") }}
      </div>
    </el-dialog>
    <!-- 添加桌台弹窗 -->
    <el-dialog :title="$t('table.addTable')" :visible.sync="addTableVisible" width="400px">
      <el-form :model="newTable" ref="tableForm" :rules="tableRules" label-width="100px">
        <el-form-item :label="$t('table.number')" prop="number">
          <el-input-number v-model="newTable.number" :min="1" controls-position="right"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('table.capacity')" prop="capacity">
          <el-input-number v-model="newTable.capacity" :min="1" :max="20" controls-position="right"></el-input-number>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addTableVisible = false">{{
          $t("common.cancel")
          }}</el-button>
        <el-button type="primary" @click="addTable" :loading="addingTable">
          {{ $t("common.confirm") }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import { formatTime } from "@/utils/helpers/time";
import { formatPrice } from "@/utils/helpers/Price";
import CheckoutDialog from "@/views/components/business/admin/CheckoutDialog";

export default {
  name: "TableManagement",
  data() {
    return {
      tables: [],
      selectedTable: null,
      currentOrder: null,
      loading: false,
      checkoutVisible: false,
      checkoutLoading: false,
      qrCodeVisible: false,
      paymentMethod: "cash",
      refreshTimer: null,
      orderDetailVisible: false,
      addTableVisible: false,
      addingTable: false,
      newTable: {
        number: 1,
        capacity: 4,
      },
      tableRules: {
        number: [
          { required: true, message: "请输入桌号", trigger: "blur" },
          { type: "number", min: 1, message: "桌号必须大于0", trigger: "blur" },
        ],
        capacity: [
          { required: true, message: "请输入容纳人数", trigger: "blur" },
          {
            type: "number",
            min: 1,
            message: "容纳人数必须大于0",
            trigger: "blur",
          },
        ],
      },
    };
  },
  components: {
    CheckoutDialog
  },
  created() {
    this.loadTables();
    this.refreshTimer = setInterval(this.loadTables, 5000);
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },
  methods: {
    formatPrice,
    formatTime,
    // 加载桌台数据
    async loadTables() {
      this.loading = true;
      try {
        const res = await request.get("/api/admin/tables");
        this.tables = res.data;
      } catch (error) {
        this.$message.error("加载桌台失败");
      } finally {
        this.loading = false;
      }
    },
    // 获取桌台状态样式
    getTableStatusType(status) {
      const typeMap = {
        empty: "success", // 空闲
        ordering: "warning", // 点餐中
        dining: "danger", // 就餐中
      };
      return typeMap[status] || "info";
    },
    // 获取订单状态文本
    getTableStatusText(status) {
      const textMap = {
        empty: "空闲",
        ordering: "点餐中",
        dining: "就餐中",
      };
      return textMap[status] || "未知状态";
    },
    // 显示桌台详情
    async showTableDetail(table) {
      this.selectedTable = table;
      try {
        const res = await request.get(
          `/api/admin/tables/${table.id}/current-order`
        );
        this.currentOrder = res.data;

        if (this.currentOrder) {
          this.currentOrder.items = Array.isArray(this.currentOrder.items)
            ? this.currentOrder.items
            : [];

          // 根据不同状态显示不同操作
          if (table.status === "ordering") {
            // 点餐中状态 - 显示订单详情,可以点击完成订单
            this.orderDetailVisible = true;
          } else if (table.status === "dining") {
            // 就餐中状态 - 直接显示结账弹窗
            this.showCheckout();
          }
        } else {
          this.$message.info("该桌台暂无订单");
        }
      } catch (error) {
        this.$message.error("加载订单失败");
      }
    },
    // 完成订单
    async completeOrder() {
      try {
        await request.put(
          `/api/admin/orders/${this.currentOrder.id}/complete`,
          {
            tableId: this.selectedTable.id,
            status: "dining", // 完成订单后状态改为就餐中
          }
        );
        this.$message.success("订单已完成,状态更新为就餐中");
        this.orderDetailVisible = false; // 关闭订单详情弹窗
        this.loadTables(); // 刷新桌台状态
      } catch (error) {
        this.$message.error("操作失败");
      }
    },
    // 删除订单
    async removeOrder() {
      try {
        await this.$confirm(
          this.$t("order.deleteConfirm"),
          this.$t("common.tip"),
          {
            confirmButtonText: this.$t("common.confirm"),
            cancelButtonText: this.$t("common.cancel"),
            type: "warning",
          }
        );

        await request.delete(
          `/api/admin/orders/${this.currentOrder.id}/remove`
        );
        this.$message.success(this.$t("order.deleteSuccess"));
        this.orderDetailVisible = false;
        await this.loadTables();
      } catch (error) {
        if (error !== "cancel") {
          console.error("Delete order error:", error);
          this.$message.error(this.$t("order.deleteFailed"));
        }
      }
    },
    showCheckout() {
      this.checkoutVisible = true;
      this.paymentMethod = "cash";
    },
    // 处理结账
    async handleCheckoutWithDialog() {
      if (this.checkoutLoading) return;
      this.checkoutLoading = true;

      try {
        await request.post(
          `/api/admin/orders/${this.currentOrder.id}/checkout`,
          {
            paymentMethod: this.paymentMethod,
          }
        );
        this.$message.success("结账成功");
        this.checkoutVisible = false;
        this.loadTables();
      } catch (error) {
        this.$message.error("结账失败");
      } finally {
        this.checkoutLoading = false;
      }
    },
    // 生成点餐二维码URL
    showQRCode() {
      if (!this.selectedTable) {
        this.$message.warning("请先选择桌台");
        return;
      }
      this.qrCodeVisible = true;
    },
    getQRCodeUrl(tableId) {
      const baseUrl = process.env.VUE_APP_ORDER_URL || window.location.origin;
      return `${baseUrl}/table/${tableId}`;
    },
    refreshTables() {
      this.loadTables();
    },
    async handleCheckout(table) {
      if (!table.currentOrder) return;

      try {
        await request.post(
          `/api/admin/orders/${table.currentOrder.id}/checkout`,
          {
            paymentMethod: "cash",
            tableId: table.id,
          }
        );
        this.$message.success("结账成功");
        this.loadTables();
      } catch (error) {
        this.$message.error("结账失败");
      }
    },
    getOrderStatusType(status) {
      const typeMap = {
        empty: "success", // 空闲
        ordering: "warning", // 点餐中
        dining: "danger", // 就餐中
      };
      return typeMap[status] || "info";
    },
    getOrderStatusText(status) {
      const textMap = {
        empty: "空闲",
        ordering: "点餐中",
        dining: "就餐中",
      };
      return textMap[status] || "未知状态";
    },
    // 显示添加桌台对话框
    showAddTableDialog() {
      this.addTableVisible = true;
      this.newTable = {
        number: Math.max(...this.tables.map((t) => t.number), 0) + 1,
        capacity: 4,
      };
    },
    // 添加桌台
    async addTable() {
      try {
        await this.$refs.tableForm.validate();
        this.addingTable = true;

        await request.post("/api/admin/tables", this.newTable);

        this.$message.success("添加桌台成功");
        this.addTableVisible = false;
        this.loadTables();
      } catch (error) {
        if (error === false) return; // 表单验证失败
        this.$message.error(error.response?.data?.message || "添加桌台失败");
      } finally {
        this.addingTable = false;
      }
    },
    // 删除菜单单项
    async removeItem(item) {
      try {
        await this.$confirm(
          this.$t("order.deleteConfirm"),
          this.$t("common.tip"),
          {
            confirmButtonText: this.$t("common.confirm"),
            cancelButtonText: this.$t("common.cancel"),
            type: "warning",
          }
        );

        await request.delete(
          `/api/admin/orders/${this.currentOrder.id}/delete-item`,
          {
            data: {
              itemIndex: item.index, // 传递菜品在数组中的索引
            },
          }
        );

        // 刷新订单详情
        const response = await request.get(
          `/api/admin/tables/${this.selectedTable.id}/current-order`
        );
        this.currentOrder = response.data; // 更新当前订单数据

        // 如果订单为空，则关闭订单详情弹窗
        if (!this.currentOrder) {
          this.orderDetailVisible = false;
        }

        // 刷新桌台列表
        await this.loadTables();

        this.$message.success(this.$t("order.deleteSuccess"));
      } catch (error) {
        if (error !== "cancel") {
          console.error("Delete item error:", error);
          this.$message.error(this.$t("order.deleteFailed"));
        }
      }
    },
    getOrderTotalsByCurrency(items) {
      return items.reduce((acc, item) => {
        const curr = item.currency;
        if (!acc[curr]) {
          acc[curr] = 0;
        }
        acc[curr] += item.price * item.quantity;
        return acc;
      }, {});
    },
  },
  computed: {
    // 原始菜品
    originalItems() {
      if (!this.currentOrder?.items) return [];
      return this.currentOrder.items
        .filter((item) => !item.isAppended)
        .map((item, index) => ({ ...item, index }));
    },
    // 追加的菜品
    appendedItems() {
      if (!this.currentOrder?.items) return [];
      return this.currentOrder.items
        .filter((item) => item.isAppended)
        .map((item, index) => ({
          ...item,
          index: index + this.originalItems.length,
        }));
    },
    orderTotalsByCurrency() {
      if (!this.currentOrder || !this.currentOrder.items) return {};
      return this.currentOrder.items.reduce((acc, item) => {
        const curr = item.currency || "CNY";
        if (!acc[curr]) {
          acc[curr] = 0;
        }
        acc[curr] += item.price * item.quantity;
        return acc;
      }, {});
    },
  },
};
</script>

<style scoped>
.table-management {
  padding: 20px;
}
.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-card {
  margin-bottom: 20px;
  padding: 20px;
  transition: all 0.3s;
}
.table-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.table-card.empty {
  background-color: #f0f9eb;
}
.table-card.ordering {
  background-color: #f4f4f5;
}
.table-card.dining {
  background-color: #fef0f0;
}
.table-number {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}
.table-info {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}
.order-details {
  margin-top: 20px;
}
.order-summary {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.time-info {
  color: #666;
  font-size: 14px;
}
.total-amount {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}
.empty-tip {
  text-align: center;
  color: #999;
  padding: 30px 0;
}
.checkout-content {
  padding: 20px 0;
}
.checkout-item {
  margin-bottom: 20px;
}
.checkout-item .amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}
.qr-code-content {
  text-align: center;
}
.qr-code-table {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}
.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  background: #f5f5f5;
}
.qr-code-tip {
  margin-top: 20px;
  color: #666;
}
.order-detail {
  padding: 20px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.table-info {
  font-size: 18px;
}
.table-info .label {
  color: #666;
}
.table-info .value {
  font-weight: bold;
  margin-left: 5px;
}
.order-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.order-time {
  color: #666;
  font-size: 14px;
}
.order-total {
  text-align: right;
}
.order-total .label {
  font-size: 16px;
}
.total-amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
  margin-left: 10px;
}
.order-actions {
  margin-top: 20px;
  text-align: right;
}
.quantity {
  color: #666;
}
.amount {
  color: #f56c6c;
}
.empty-order {
  text-align: center;
  padding: 40px;
  color: #999;
}
.tables-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.tables-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 10px;
}
.table-item {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #eee;
}
.table-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.table-content {
  height: 100%;
}
.table-item.empty {
  background-color: #f0f9eb;
}
.table-item.ordering {
  background-color: #f4f4f5;
}
.table-item.dining {
  background-color: #fef0f0;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 15px 0;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}
.appended-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #eee;
}
.order-section {
  margin-bottom: 20px;
}
.payment-methods {
  margin-top: 15px;
}
.payment-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.payment-row .el-radio {
  flex: 1;
  margin-right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  font-size: 16px;
}
.payment-row .el-radio.is-bordered {
  padding: 0 15px;
}
.payment-row .el-radio i {
  margin-right: 5px;
  font-size: 18px;
}
.payment-row .el-radio.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}
.el-dialog {
  min-width: 500px;
}
</style>

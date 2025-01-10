<template>
  <div class="table-management">
    <div class="tables-container">
      <div class="tables-header">
        <h2>{{ $t('table.status') }}</h2>
        <div>
          <el-button type="primary" size="small" @click="refreshTables" :loading="loading">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button type="success" size="small" @click="showQRCode">
            {{ $t('table.viewQRCode') }}
          </el-button>
        </div>
      </div>
      
      <div class="tables-grid">
        <div 
          v-for="table in tables" 
          :key="table.id"
          class="table-item"
          :class="[table.status]"
          @click="showTableDetail(table)"
        >
          <div class="table-content">
            <div class="table-number">{{ $t('table.numberFormat', { number: table.number }) }}</div>
            <div class="table-status">
              <el-tag :type="getTableStatusType(table.status)">
                {{ getTableStatusText(table.status) }}
              </el-tag>
            </div>
            <div class="table-info" v-if="table.currentOrder">
              <div>{{ $t('order.startTime') }}: {{ formatTime(table.currentOrder.createdAt) }}</div>
              <div>{{ $t('order.amount') }}: ¥{{ table.currentOrder.totalAmount }}</div>
              <el-button 
                type="danger" 
                size="small" 
                @click.stop="handleCheckout(table)"
                v-if="table.status === 'dining'"
              >
                {{ $t('order.checkout') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      :title="$t('order.checkoutTitle')"
      :visible.sync="checkoutVisible"
      width="400px"
    >
      <div class="checkout-content">
        <div class="checkout-item">
          <span>{{ $t('order.consumptionAmount') }}:</span>
          <span class="amount">¥{{ currentOrder?.totalAmount || 0 }}</span>
        </div>
        <div class="checkout-item">
          <span>{{ $t('order.paymentMethod') }}:</span>
          <el-radio-group v-model="paymentMethod">
            <el-radio label="cash">{{ $t('payment.cash') }}</el-radio>
            <el-radio label="wechat">{{ $t('payment.wechat') }}</el-radio>
            <el-radio label="alipay">{{ $t('payment.alipay') }}</el-radio>
          </el-radio-group>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="checkoutVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button 
          type="primary" 
          @click="handleCheckoutWithDialog"
          :loading="checkoutLoading"
        >
          {{ $t('order.confirmCheckout') }}
        </el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="$t('table.qrCode')"
      :visible.sync="qrCodeVisible"
      width="300px"
    >
      <div class="qr-code-content">
        <div v-if="selectedTable">
          <div class="qr-code-table">{{ $t('table.numberFormat', { number: selectedTable.number }) }}</div>
          <div class="qr-code-image">
            <img :src="getQRCodeUrl(selectedTable.id)" :alt="$t('table.qrCode')">
          </div>
          <div class="qr-code-tip">
            {{ $t('table.scanToOrder') }}
          </div>
        </div>
        <div v-else>
          {{ $t('table.selectTableFirst') }}
        </div>
      </div>
    </el-dialog>

    <el-dialog
      :title="$t('order.details')"
      :visible.sync="orderDetailVisible"
      width="600px"
    >
      <div v-if="currentOrder" class="order-detail">
        <div class="order-header">
          <div class="table-info">
            <span class="label">{{ $t('table.number') }}:</span>
            <span class="value">{{ $t('table.numberFormat', { number: selectedTable?.number }) }}</span>
          </div>
          <div class="order-status">
            <el-tag :type="getOrderStatusType(currentOrder.status)">
              {{ getOrderStatusText(currentOrder.status) }}
            </el-tag>
          </div>
        </div>
        
        <el-table :data="currentOrder.items" style="width: 100%; margin-top: 20px;">
          <el-table-column prop="name" :label="$t('dishes.name')"></el-table-column>
          <el-table-column prop="quantity" :label="$t('order.quantity')" width="100">
            <template #default="{ row }">
              <span class="quantity">x{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('order.amount')" width="120">
            <template #default="{ row }">
              <span class="amount">¥{{ row.price * row.quantity }}</span>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="order-footer">
          <div class="order-time">
            <div>{{ $t('order.orderTime') }}: {{ formatTime(currentOrder.createdAt) }}</div>
            <div v-if="currentOrder.completedAt">
              {{ $t('order.completedTime') }}: {{ formatTime(currentOrder.completedAt) }}
            </div>
          </div>
          <div class="order-total">
            <span class="label">{{ $t('order.total') }}:</span>
            <span class="total-amount">¥{{ currentOrder.totalAmount }}</span>
          </div>
        </div>
        
        <div class="order-actions">
          <el-button-group>
            <el-button 
              type="success" 
              :disabled="currentOrder.status === 'completed'"
              @click="completeOrder"
            >
              {{ $t('order.complete') }}
            </el-button>
            <el-button 
              type="danger"
              @click="showCheckout"
            >
              {{ $t('order.checkout') }}
            </el-button>
          </el-button-group>
        </div>
      </div>
      <div v-else class="empty-order">
        {{ $t('order.noOrderInfo') }}
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
import { formatTime } from '@/utils/time'

export default {
  name: 'TableManagement',
  data() {
    return {
      tables: [],
      selectedTable: null,
      currentOrder: null,
      loading: false,
      checkoutVisible: false,
      checkoutLoading: false,
      qrCodeVisible: false,
      paymentMethod: 'cash',
      refreshTimer: null,
      orderDetailVisible: false,
    }
  },
  created() {
    this.loadTables()
    this.refreshTimer = setInterval(this.loadTables, 5000)
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
  },
  methods: {
    formatTime,
    // 加载桌台数据
    async loadTables() {
      this.loading = true
      try {
        const res = await request.get('/api/admin/tables')
        this.tables = res.data
      } catch (error) {
        this.$message.error('加载桌台失败')
      } finally {
        this.loading = false
      }
    },
    // 获取桌台状态样式
    getTableStatusType(status) {
      const typeMap = {
        'empty': 'success',    // 空闲
        'ordering': 'warning', // 点餐中
        'dining': 'danger',    // 就餐中
      }
      return typeMap[status] || 'info'
    },
    // 获取订单状态文本
    getTableStatusText(status) {
      const textMap = {
        'empty': '空闲',
        'ordering': '点餐中',
        'dining': '就餐中'
      }
      return textMap[status] || '未知状态'
    },
    // 显示桌台详情
    async showTableDetail(table) {
      this.selectedTable = table;
      try {
        const res = await request.get(`/api/admin/tables/${table.id}/current-order`);
        this.currentOrder = res.data;
        
        if (this.currentOrder) {
          this.currentOrder.items = Array.isArray(this.currentOrder.items) ? this.currentOrder.items : [];
          
          // 根据不同状态显示不同操作
          if (table.status === 'ordering') {
            // 点餐中状态 - 显示订单详情,可以点击完成订单
            this.orderDetailVisible = true;
          } else if (table.status === 'dining') {
            // 就餐中状态 - 直接显示结账弹窗
            this.showCheckout();
          }
        } else {
          this.$message.info('该桌台暂无订单');
        }
      } catch (error) {
        this.$message.error('加载订单失败');
      }
    },
    async completeOrder() {
      try {
        await request.put(`/api/admin/orders/${this.currentOrder.id}/complete`, {
          tableId: this.selectedTable.id,
          status: 'dining'  // 完成订单后状态改为就餐中
        })
        this.$message.success('订单已完成,状态更新为就餐中')
        this.orderDetailVisible = false  // 关闭订单详情弹窗
        this.loadTables()  // 刷新桌台状态
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    showCheckout() {
      this.checkoutVisible = true
      this.paymentMethod = 'cash'
    },
    // 处理结账
    async handleCheckoutWithDialog() {
      if (this.checkoutLoading) return
      this.checkoutLoading = true
      
      try {
        await request.post(`/api/admin/orders/${this.currentOrder.id}/checkout`, {
          paymentMethod: this.paymentMethod
        })
        this.$message.success('结账成功')
        this.checkoutVisible = false
        this.loadTables()
      } catch (error) {
        this.$message.error('结账失败')
      } finally {
        this.checkoutLoading = false
      }
    },
    // 生成点餐二维码URL
    showQRCode() {
      if (!this.selectedTable) {
        this.$message.warning('请先选择桌台')
        return
      }
      this.qrCodeVisible = true
    },
    getQRCodeUrl(tableId) {
      const baseUrl = process.env.VUE_APP_ORDER_URL || window.location.origin
      return `${baseUrl}/table/${tableId}`
    },
    refreshTables() {
      this.loadTables()
    },
    async handleCheckout(table) {
      if (!table.currentOrder) return
      
      try {
        await request.post(`/api/admin/orders/${table.currentOrder.id}/checkout`, {
          paymentMethod: 'cash',
          tableId: table.id
        })
        this.$message.success('结账成功')
        this.loadTables()
      } catch (error) {
        this.$message.error('结账失败')
      }
    },
    getOrderStatusType(status) {
      const typeMap = {
        'empty': 'success',    // 空闲
        'ordering': 'warning', // 点餐中
        'dining': 'danger',    // 就餐中
      }
      return typeMap[status] || 'info'
    },
    getOrderStatusText(status) {
      const textMap = {
        'empty': '空闲',
        'ordering': '点餐中',
        'dining': '就餐中'
      }
      return textMap[status] || '未知状态'
    },
  },
}
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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
</style> 
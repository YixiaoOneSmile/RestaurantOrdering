<template>
  <div class="order-history">
    <div class="page-header">
      <h2>{{ $t('menu.orders') }}</h2>
      <div class="filters">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          :range-separator="$t('common.to')"
          :start-placeholder="$t('common.startDate')"
          :end-placeholder="$t('common.endDate')"
          :picker-options="pickerOptions"
        ></el-date-picker>
        <el-select v-model="status" :placeholder="$t('order.status')" clearable>
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="$t(`order.statusTypes.${item.value}`)"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-button type="primary" @click="search">{{ $t('common.search') }}</el-button>
      </div>
    </div>

    <el-table :data="orders" v-loading="loading">
      <el-table-column prop="id" :label="$t('order.orderNo')" width="100"></el-table-column>
      <el-table-column prop="tableId" :label="$t('order.tableNo')" width="100">
        <template #default="{ row }">
          {{ $t('table.numberFormat', { number: row.tableId }) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('order.items')">
        <template #default="{ row }">
          <div class="order-items">
            <span v-for="item in row.items" :key="item.dishId">
              {{ item.name }} x{{ item.quantity }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" :label="$t('order.amount')" width="120">
        <template #default="{ row }">
          ¥{{ row.totalAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('order.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ $t(`order.statusTypes.${row.status}`) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" :label="$t('order.orderTime')" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.operations')" width="120">
        <template #default="{ row }">
          <el-button type="text" @click="showOrderDetail(row)">{{ $t('order.details') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订单详情弹窗 -->
    <el-dialog
      title="订单详情"
      :visible.sync="detailVisible"
      width="600px"
    >
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-header">
          <div class="basic-info">
            <div>订单号：{{ currentOrder.id }}</div>
            <div>{{ currentOrder.tableId }}号桌</div>
            <div>{{ formatTime(currentOrder.createdAt) }}</div>
          </div>
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </div>

        <el-table :data="currentOrder.items">
          <el-table-column prop="name" label="菜品"></el-table-column>
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100"></el-table-column>
          <el-table-column label="小计" width="100">
            <template #default="{ row }">
              ¥{{ row.price * row.quantity }}
            </template>
          </el-table-column>
        </el-table>

        <div class="detail-footer">
          <div class="time-info">
            <div v-if="currentOrder.paidAt">
              支付时间：{{ formatTime(currentOrder.paidAt) }}
            </div>
            <div v-if="currentOrder.paymentMethod">
              支付方式：{{ getPaymentMethodText(currentOrder.paymentMethod) }}
            </div>
          </div>
          <div class="total">
            合计：<span class="amount">¥{{ currentOrder.totalAmount }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
import { formatTime } from '@/utils/time'

export default {
  name: 'OrderHistory',
  data() {
    return {
      orders: [],
      loading: false,
      dateRange: [],
      status: '',
      detailVisible: false,
      currentOrder: null,
      statusOptions: [
        { value: 'ordering', label: '已下单' },
        { value: 'processing', label: '处理中' },
        { value: 'dining', label: '就餐中' },
        { value: 'completed', label: '已完成' }
      ],
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }]
      }
    }
  },
  created() {
    this.loadOrders()
  },
  methods: {
    formatTime,
    async loadOrders() {
      this.loading = true
      try {
        const params = {}
        if (this.dateRange?.length === 2) {
          params.startDate = this.dateRange[0].toISOString()
          params.endDate = this.dateRange[1].toISOString()
        }
        if (this.status) {
          params.status = this.status
        }
        
        const res = await request.get('/api/admin/orders', { params })
        this.orders = res.data
      } catch (error) {
        this.$message.error('加载订单失败')
      } finally {
        this.loading = false
      }
    },
    search() {
      this.loadOrders()
    },
    getStatusType(status) {
      const typeMap = {
        'ordering': 'info',
        'processing': 'warning',
        'dining': 'success',
        'completed': 'success'
      }
      return typeMap[status] || 'info'
    },
    getStatusText(status) {
      const textMap = {
        'ordering': '已下单',
        'processing': '处理中',
        'dining': '就餐中',
        'completed': '已完成'
      }
      return textMap[status] || '未知状态'
    },
    getPaymentMethodText(method) {
      const methodMap = {
        'cash': '现金',
        'wechat': '微信',
        'alipay': '支付宝'
      }
      return methodMap[method] || '未知方式'
    },
    showOrderDetail(order) {
      this.currentOrder = order
      this.detailVisible = true
    }
  }
}
</script>

<style scoped>
.order-history {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 15px;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.order-items span {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.basic-info {
  line-height: 1.8;
  color: #666;
}

.detail-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.time-info {
  color: #666;
  line-height: 1.8;
}

.amount {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}
</style> 
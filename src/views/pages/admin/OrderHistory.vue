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

    <!-- 订单历史记录列表 -->
    <OrderHistoryList
      :orders="orders"
      :loading="loading"
      @show-detail="showOrderDetail"
    />

    <!-- 订单详情弹窗 -->
    <OrderHistoryDialog
      :order="currentOrder"
      :visible.sync="detailVisible"
    />

  </div>
</template>

<script>
import request from '@/utils/request'
import { formatTime } from '@/utils/helpers/time'
import { getStatusType, getStatusText, getPaymentMethodText } from '@/utils/models/orderStatus'
import OrderHistoryList from '@/views/components/business/admin/OrderHistoryList.vue'
import OrderHistoryDialog from '@/views/components/business/admin/OrderHistoryDialog.vue'
export default {
  name: 'OrderHistory',
  components: {
    OrderHistoryList,
    OrderHistoryDialog
  },
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
    getStatusType,
    getStatusText,
    getPaymentMethodText,

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
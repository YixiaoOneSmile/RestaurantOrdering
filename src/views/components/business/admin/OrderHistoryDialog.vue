<template>
  <el-dialog title="订单详情" :visible.sync="localVisible" width="600px">
    <div v-if="order" class="order-detail">
      <div class="detail-header">
        <div class="basic-info">
          <div>订单号：{{ order.id }}</div>
          <div>{{ order.tableId }}号桌</div>
          <div>{{ formatTime(order.createdAt) }}</div>
        </div>
        <el-tag :type="getStatusType(order.status)">
          {{ getStatusText(order.status) }}
        </el-tag>
      </div>

      <OrderItemsTable :items="order.items" />

      <OrderDetailFooter :order="order" />

    </div>
  </el-dialog>
</template>

<script>
import { formatTime } from '@/utils/helpers/time'
import { getStatusType, getStatusText, getPaymentMethodText } from '@/utils/models/orderStatus'
import { getDishName as dishNameHelper } from '@/utils/helpers/dishName'
import { formatPrice } from '@/utils/helpers/Price'
import OrderItemsTable from "@/views/components/business/admin/OrderListTable.vue";
import OrderDetailFooter from "@/views/components/business/admin/OrderDetailFooter.vue";


export default {
  name: 'OrderHistoryDialog',
  props: {
    order: {
      type: Object,
      default: null
    },
    visible: {
      type: Boolean,
      required: true
    }
  },
  components: {
    OrderItemsTable,
    OrderDetailFooter,
  },
  computed: {
    localVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      },
    },
    orderTotals() {
      if (!this.order || !this.order.items) return {}
      return this.order.items.reduce((acc, item) => {
        const curr = item.currency
        acc[curr] = (acc[curr] || 0) + item.price * item.quantity
        return acc
      }, {})
    }
  },
  methods: {
    formatTime,
    formatPrice,
    getStatusType,
    getStatusText,
    getPaymentMethodText,
    getDishName(item) {
      return dishNameHelper(item, this.$i18n.locale)
    }
  }
}
</script>

<style scoped>
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
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

      <el-table :data="order.items">
        <el-table-column :label="$t('dishes.name')">
          <template #default="{ row }">
            {{ getDishName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">
            {{ row.price }} {{ formatPrice({ currency: row.currency }) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column label="小计" width="100">
          <template #default="{ row }">
            {{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="detail-footer">
        <div class="time-info">
          <div v-if="order.paidAt">
            支付时间：{{ formatTime(order.paidAt) }}
          </div>
          <div v-if="order.paymentMethod">
            支付方式：{{ getPaymentMethodText(order.paymentMethod) }}
          </div>
        </div>
        <div class="total">
          合计：
          <span v-for="(amount, currency) in orderTotals" :key="currency" class="amount">
            {{ amount }} {{ formatPrice({ currency: currency }) }}&nbsp;
          </span>
        </div>
      </div>

    </div>
  </el-dialog>
</template>

<script>
import { formatTime } from '@/utils/helpers/time'
import { getStatusType, getStatusText, getPaymentMethodText } from '@/utils/models/orderStatus'
import { getDishName as dishNameHelper } from '@/utils/helpers/dishName'
import { formatPrice } from '@/utils/helpers/Price'
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
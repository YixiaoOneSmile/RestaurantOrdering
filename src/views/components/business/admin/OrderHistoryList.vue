<template>
  <el-table :data="orders" v-loading="loading">
    <el-table-column
      prop="id"
      :label="$t('order.orderNo')"
      width="100"
    ></el-table-column>
    <el-table-column prop="tableId" :label="$t('order.tableNo')" width="100">
      <template #default="{ row }">
        {{ $t("table.numberFormat", { number: row.tableId }) }}
      </template>
    </el-table-column>
    <el-table-column :label="$t('order.items')">
      <template #default="{ row }">
        <div class="order-items">
          <span v-for="item in row.items" :key="item.dishId" >
            {{ getDishName(item) }} x{{ item.quantity }}
          </span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="totalAmount" :label="$t('order.amount')" width="120">
      <template #default="{ row }">
        <div v-if="row.items && row.items.length">
          <!-- 按货币单位显示各自的合计 -->
          <div v-for="(amount, currency) in getOrderTotals(row.items)" :key="currency">
            {{ amount }} {{ formatPrice({ currency: currency }) }}
          </div>
        </div>
        <div v-else>非法单位</div>
      </template>
    </el-table-column>
    <el-table-column prop="status" :label="$t('order.status')" width="120">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)">
          {{ $t(`order.statusTypes.${row.status}`) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      prop="createdAt"
      :label="$t('order.orderTime')"
      width="180"
    >
      <template #default="{ row }">
        {{ formatTime(row.createdAt) }}
      </template>
    </el-table-column>
    <el-table-column :label="$t('table.operations')" width="120">
      <template #default="{ row }">
        <el-button type="text" @click="$emit('show-detail', row)">{{
          $t("order.details")
        }}</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { formatTime } from "@/utils/helpers/time";
import {
  getStatusType,
  getStatusText,
  getPaymentMethodText,
} from "@/utils/models/orderStatus";
import { getDishName } from "@/utils/helpers/dishName";
const { formatPrice }   = require('@/utils/helpers/Price');

export default {
  name: "OrderHistoryList",
  props: {
    orders: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    formatTime,
    formatPrice,
    getStatusType,
    getStatusText,
    getPaymentMethodText,
    getDishName(item) {
      return getDishName(item, this.$i18n.locale);
    },
    getOrderTotals(items) {
      return items.reduce((acc, item) => {
        const curr = item.currency;
        acc[curr] = (acc[curr] || 0) + item.price * item.quantity;
        return acc;
      }, {});
    },
  },

};
</script>

<style scoped>
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
</style>

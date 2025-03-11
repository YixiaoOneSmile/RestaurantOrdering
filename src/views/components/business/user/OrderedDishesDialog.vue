<template>
  <el-dialog :title="$t('order.viewOrdered')" :visible.sync="localVisible" width="90%">

    <!-- 待提交的菜品 -->
    <template v-if="newItems.length">
      <h3>{{ $t('order.pendingOrder') }}</h3>
      <el-table :data="newItems" style="width: 100%">
        <!-- 菜品名称 -->
        <el-table-column :label="$t('dishes.name')">
          <template #default="{ row }">
            {{ getDishName(row) }}
          </template>
        </el-table-column>
        <!-- 数量 -->
        <el-table-column prop="quantity" :label="$t('order.quantity')" width="100">
          <template #default="{ row }">
            <span class="quantity">x{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <!-- 金额 -->
        <el-table-column :label="$t('order.amount')" width="120">
          <template #default="{ row }">
            <span class="amount">
              {{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 已提交的菜品 -->
    <template v-if="items.length">
      <h3>{{ $t('order.submittedOrder') }}</h3>
      <el-table :data="items" style="width: 100%">
        <!-- 菜品名称 -->
        <el-table-column :label="$t('dishes.name')">
          <template #default="{ row }">
            {{ getDishName(row) }}
          </template>
        </el-table-column>
        <!-- 数量 -->
        <el-table-column prop="quantity" :label="$t('order.quantity')" width="100">
          <template #default="{ row }">
            <span class="quantity">x{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <!-- 金额 -->
        <el-table-column :label="$t('order.amount')" width="120">
          <template #default="{ row }">
            <span class="amount">
              {{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 合计 -->
    <div class="order-total">
      <span>{{ $t('order.total') }}</span>
      <span class="total-amount">
        <span v-for="(amount, currency) in totals" :key="currency">
          {{ amount }} {{ formatPrice({ currency: currency }) }}&nbsp;
        </span>
      </span>
    </div>
  </el-dialog>
</template>

<script>
import { getDishName } from "@/utils/helpers/dishName";
export default {
  name: 'OrderedDishesDialog',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    },
    newItems: {
      type: Array,
      default: () => []
    },
    totals: {
      type: Object,
      default: () => ({})
    },
    formatPrice: {
      type: Function,
      required: true
    }
  },
  methods: {
    getDishName(row) {
      return getDishName(row, this.$i18n.locale);
    },
  },
  computed: {
    localVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  }
}
</script>

<style scoped>
.order-total {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
}

.total-amount {
  color: #f56c6c;
  font-weight: bold;
  margin-left: 5px;
}

.empty-message {
  text-align: center;
  color: #999;
  margin-bottom: 10px;
}
</style>
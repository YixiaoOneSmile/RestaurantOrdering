<template>
  <el-dialog title="已点菜品" :visible.sync="localVisible" width="90%">
    <!-- 已点菜品列表 -->
    <el-table :data="items" style="width: 100%">
      <!-- 菜品名称 -->
      <el-table-column :label="$t('dishes.name')">
      <template #default="{ row }">
        {{ getDishName(row) }}
      </template>
    </el-table-column>
      <!-- 数量 -->
      <el-table-column prop="quantity" label="数量" width="100">
        <template #default="{ row }">
          <span class="quantity">x{{ row.quantity }}</span>
        </template>
      </el-table-column>
      <!-- 金额 -->
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span class="amount">
            {{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 合计 -->
    <div class="order-total">
      <span>合计：</span>
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
</style>
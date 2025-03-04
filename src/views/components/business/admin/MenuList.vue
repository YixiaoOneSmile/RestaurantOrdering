<template>
  <el-table :data="dishes" v-loading="loading">
    <!-- 菜品名称列，根据当前语言显示相应的名称 -->
    <el-table-column :label="$t('dishes.name')">
      <template #default="{ row }">
        {{ getDishName(row) }}
      </template>
    </el-table-column>
    <!-- 菜品价格列 -->
    <el-table-column prop="price" :label="$t('dishes.price')" width="120">
      <template #default="{ row }">
        {{ row.price }} {{ formatPrice(row) }}
      </template>
    </el-table-column>
    <!-- 菜品分类列 -->
    <el-table-column prop="categoryId" :label="$t('dishes.category')" width="120">
      <template #default="{ row }">
        {{ getCategoryName(row.categoryId) }}
      </template>
    </el-table-column>
    <!-- 菜品图片列 -->
    <el-table-column :label="$t('dishes.image')" width="120">
      <template #default="{ row }">
        <el-image
          :src="row.image"
          style="width: 50px; height: 50px"
          fit="cover"
        ></el-image>
      </template>
    </el-table-column>
    <!-- 操作列 -->
    <el-table-column :label="$t('table.operations')" width="200">
      <template #default="{ row }">
        <el-button type="text" @click="$emit('edit-dish', row)">
          {{ $t("common.edit") }}
        </el-button>
        <el-button type="text" class="danger" @click="$emit('delete-dish', row)">
          {{ $t("common.delete") }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { getDishName } from "@/utils/helpers/dishName";
import { formatPrice } from "@/utils/helpers/Price";

export default {
  name: "MenuList",
  props: {
    dishes: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    // 根据当前语言返回对应的菜品名称
    getDishName(row) {
      return getDishName(row, this.$i18n.locale);
    },
    // 格式化价格
    formatPrice(row) {
      return formatPrice(row);
    },
    // 根据分类ID获取分类名称
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : this.$t("unknown.category");
    }
  }
};
</script>

<style scoped>
.danger {
  color: #f56c6c;
}
</style>
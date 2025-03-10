<template>
    <el-table :data="items" style="width: 100%">
        <el-table-column :label="$t('dishes.name')">
            <template #default="{ row }">
                {{ getDishName(row) }}
            </template>
        </el-table-column>
        <el-table-column prop="price" :label="$t('order.unitPrice')" width="100">
            <template #default="{ row }">
                {{ row.price }} {{ formatPrice({ currency: row.currency }) }}
            </template>
        </el-table-column>
        <el-table-column prop="quantity" :label="$t('order.quantity')" width="100" />
        <el-table-column :label="$t('order.subtotal')" width="100">
            <template #default="{ row }">
                {{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
import { getDishName } from "@/utils/helpers/dishName";
import { formatPrice } from "@/utils/helpers/Price";

export default {
    name: "OrderListTable",
    props: {
        items: {
            type: Array,
            required: true
        }
    },
    methods: {
        getDishName(row) {
            return getDishName(row, this.$i18n.locale);
        },
        formatPrice,
        
    },
};
</script>

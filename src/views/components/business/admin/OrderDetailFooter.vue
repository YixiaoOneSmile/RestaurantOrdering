<template>
    <div class="detail-footer">
        <div class="time-info">
            <div v-if="order?.paidAt">
                {{ $t('order.paymentTime') }}：{{ formatTime(order.paidAt) }}
            </div>
            <div v-if="order?.paymentMethod">
                {{ $t('order.paymentMethod') }}：{{ getPaymentMethodText(order.paymentMethod) }}
            </div>
        </div>
        <div class="total">
            {{ $t('order.total') }}：
            <span v-for="(amount, currency) in orderTotals" :key="currency" class="amount">
                {{ amount }} {{ formatPrice({ currency }) }}
            </span>
        </div>
    </div>
</template>

<script>
import { formatTime } from "@/utils/helpers/time";
import { formatPrice } from "@/utils/helpers/Price";
import { getPaymentMethodText } from "@/utils/models/orderStatus";

export default {
    name: "OrderDetailFooter",
    props: {
        order: {
            type: Object,
            required: true
        }
    },
    computed: {
        orderTotals() {
            if (!this.order || !this.order.items) return {};
            return this.order.items.reduce((acc, item) => {
                const curr = item.currency;
                acc[curr] = (acc[curr] || 0) + item.price * item.quantity;
                return acc;
            }, {});
        }
    },
    methods: {
        formatTime,
        formatPrice,
        getPaymentMethodText
    }
};
</script>

<style scoped>
.detail-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 20px;
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
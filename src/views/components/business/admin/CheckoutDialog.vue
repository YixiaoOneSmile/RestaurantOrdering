<template>
    <el-dialog :title="$t('order.checkoutTitle')" :visible.sync="localVisible" width="450px">
        <!-- 结账内容：支付方式 -->
        <div class="checkout-content">
            <div class="checkout-item">
                <span>{{ $t("order.paymentMethod") }}:</span>
                <div class="payment-methods">
                    <el-radio-group v-model="localPaymentMethod" size="large">
                        <div class="payment-row">
                            <el-radio label="cash" border>
                                <i class="el-icon-money"></i>
                                {{ $t("payment.cash") }}
                            </el-radio>
                            <el-radio label="wechat" border>
                                <i class="el-icon-chat-dot-square"></i>
                                {{ $t("payment.wechat") }}
                            </el-radio>
                            <el-radio label="alipay" border>
                                <i class="el-icon-wallet"></i>
                                {{ $t("payment.alipay") }}
                            </el-radio>
                        </div>
                    </el-radio-group>
                </div>
            </div>
        </div>
        <!-- 如有订单详情，可以在此处显示 -->
        <div v-if="order" class="order-detail">
            <div class="order-header">
                <div>
                    {{ $t("order.orderTime") }}: {{ formatTime(order.createdAt) }}
                </div>
            </div>
            <OrderListTable :items="order.items" />
        </div>
        <!-- 底部操作按钮 -->
        <span slot="footer" class="dialog-footer">
            <el-button @click="localVisible = false">{{ $t("common.cancel") }}</el-button>
            <el-button type="primary" @click="handleCheckout" :loading="checkoutLoading">
                {{ $t("order.confirmCheckout") }}
            </el-button>
        </span>
    </el-dialog>
</template>

<script>
import { formatTime } from "@/utils/helpers/time";
import OrderListTable from "@/views/components/business/admin/OrderListTable.vue";

export default {
    name: "CheckoutDialog",
    components: {
        OrderListTable
    },
    props: {
        visible: {
            type: Boolean,
            required: true
        },
        order: {
            type: Object,
            default: null
        },
        paymentMethod: {
            type: String,
            default: "cash"
        },
        checkoutLoading: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        localVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit("update:visible", val);
            }
        },
        localPaymentMethod: {
            get() {
                return this.paymentMethod;
            },
            set(val) {
                this.$emit("update:paymentMethod", val);
            }
        }
    },
    methods: {
        formatTime,
        handleCheckout() {
            // 触发结账操作，父组件需监听 checkout 事件
            this.$emit("checkout");
        }
    }
};
</script>

<style scoped>
.checkout-content {
    padding: 20px 0;
}

.checkout-item {
    margin-bottom: 20px;
}

.payment-methods {
    margin-top: 15px;
}

.payment-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.payment-row .el-radio {
    flex: 1;
    margin-right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-width: 2px;
    font-size: 16px;
}

.payment-row .el-radio.is-bordered {
    padding: 0 15px;
}

.payment-row .el-radio i {
    margin-right: 5px;
    font-size: 18px;
}

.dialog-footer {
    text-align: right;
}
</style>
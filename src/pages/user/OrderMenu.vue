<template>
  <div class="order-menu">
    <!-- 顶部信息 -->
    <div class="header">
      <div class="table-info">{{ $t('table.numberFormat', { number: tableId }) }}</div>
      <div class="order-status" v-if="currentOrder">
        <el-tag :type="getOrderStatusType(currentOrder.status)">
          {{ $t(`order.statusTypes.${currentOrder.status}`) }}
        </el-tag>
      </div>
    </div>

    <!-- 菜品列表区域 -->
    <div class="menu-content">
      <el-container>
        <!-- 左侧分类 -->
        <el-aside width="100px">
          <div 
            v-for="category in categories" 
            :key="category.id"
            :class="['category-item', { active: activeCategory === category.id }]"
            @click="activeCategory = category.id"
          >
            {{ $t(`dishes.categories.${category.key}`) }}
          </div>
        </el-aside>

        <!-- 右侧菜品 -->
        <el-main>
          <div class="dishes-grid">
            <div 
              v-for="dish in currentCategoryDishes" 
              :key="dish.id" 
              class="dish-card"
            >
              <img :src="dish.image" class="dish-image">
              <div class="dish-info">
                <div class="dish-name">{{ dish.name }}</div>
                <div class="dish-price">{{ dish.price }} {{formatPrice(dish)}}</div>
              </div>
              <div class="dish-action">
                <template v-if="getCartQuantity(dish.id) > 0">
                  <el-button 
                    type="text" 
                    icon="el-icon-minus"
                    @click="updateCart(dish, -1)"
                  />
                  <span class="quantity">{{ getCartQuantity(dish.id) }}</span>
                </template>
                <el-button 
                  type="primary" 
                  icon="el-icon-plus"
                  circle
                  @click="updateCart(dish, 1)"
                />
              </div>
            </div>
          </div>
        </el-main>
      </el-container>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <!-- 购物车信息 -->
      <div class="cart-info">
        <!-- 购物车数量和金额 -->
        <template v-if="cartItems.length">
          <span class="total-count">{{ $t('order.selectedItems', { count: getTotalCount() }) }}</span>
          <div class="total-amount">
            <div v-for="(amount, currency) in cartTotalsByCurrency" :key="currency">
               {{ amount }} {{ formatPrice({ currency: currency }) }}
           </div>
          </div>
        </template>
        <!-- 查看已点菜品 -->
        <el-button 
          v-if="currentOrder"
          type="text"
          @click="showOrderDetail"
        >
          {{ $t('order.viewOrdered') }} <i class="el-icon-arrow-right"></i>
        </el-button>
      </div>
      <!-- 结账 -->
      <el-button 
        type="danger"
        size="large" 
        @click="showCheckoutDialog"
        :loading="checkoutLoading"
        v-if="currentOrder && currentOrder.status === 'dining'"
      >
        {{ $t('order.checkout') }}
      </el-button>
      <!-- 提交订单 -->
      <el-button 
        type="primary" 
        size="large" 
        :disabled="!cartItems.length"
        @click="submitOrder"
        :loading="loading"
      >
        {{ currentOrder ? $t('order.addDish') : $t('order.submit') }}
      </el-button>
    </div>
    <!-- 已点菜品弹窗 -->
    <el-dialog
      title="已点菜品"
      :visible.sync="orderDetailVisible"
      width="90%"
    >
      <!-- 已点菜品列表 -->
      <el-table :data="currentOrder?.items" style="width: 100%">
        <!-- 菜品名称 --> 
        <el-table-column prop="name" label="菜品"></el-table-column>
        <!-- 数量 -->
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            <span class="quantity">x{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <!-- 金额 -->
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="amount">{{ row.price * row.quantity }} {{ formatPrice({ currency: row.currency }) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <!-- 合计 -->
      <div class="order-total">
        <span>合计：</span>
        <span class="total-amount"><span v-for="(amount, currency) in orderTotalsByCurrency" :key="currency">
          {{ amount }} {{ formatPrice({ currency: currency }) }}&nbsp;
          </span>
        </span>
      </div>
    </el-dialog>
    <!-- 结账弹窗 -->
    <el-dialog
      :title="$t('order.checkoutTitle')"
      :visible.sync="checkoutVisible"
      :append-to-body="false"
      :destroy-on-close="false"
      width="90%"
    >
      <!-- 结账内容 -->
      <div class="checkout-content">
        <!-- 支付方式 -->
        <div class="payment-method">
          <div class="label">{{ $t('order.paymentMethod') }}:</div>
          <el-radio-group v-model="paymentMethod" size="large">
            <el-radio label="wechat" border>
              <i class="el-icon-money"></i>
              {{ $t('payment.wechat') }}
            </el-radio>
            <el-radio label="alipay" border>
              <i class="el-icon-wallet"></i>
              {{ $t('payment.alipay') }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>
      <!-- 已点菜品列表 -->
      <el-table :data="currentOrder?.items" style="width: 100%">
        <!-- 菜品名称 --> 
        <el-table-column prop="name" label="菜品"></el-table-column>
        <!-- 数量 -->
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            <span class="quantity">x{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <!-- 金额 -->
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.price * row.quantity }}</span>
          </template>
        </el-table-column>
      </el-table>
      <!-- 合计 -->
      <div class="order-total">
        <span>合计：</span>
        <span class="total-amount">¥{{ currentOrder?.totalAmount }}</span>
      </div>
      <!-- 结账按钮 -->
      <span slot="footer" class="dialog-footer">
        <el-button size="large" @click="checkoutVisible = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button 
          type="primary"
          size="large"
          @click="handleCheckout"
          :loading="checkoutLoading"
          :disabled="!paymentMethod"
        >
          {{ $t('order.confirmCheckout') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'
import { formatPrice} from '@/utils/Price.js' 

export default {
  name: 'OrderMenu',
  data() {
    return {
      tableId: this.$route.params.tableId,
      activeCategory: null,
      categories: [
        { id: 1, key: 'hot' },
        { id: 2, key: 'cold' },
        { id: 3, key: 'staple' },
        { id: 4, key: 'beverage' }
      ],
      dishes: [],
      cartItems: [],
      currentOrder: null,
      loading: false,
      peopleCountVisible: false,
      peopleCount: 1,
      orderDetailVisible: false,
      checkoutVisible: false,
      checkoutLoading: false,
      paymentMethod: 'cash'
    }
  },
  computed: {
    currentCategoryDishes() {
      return this.dishes.filter(dish => dish.categoryId === this.activeCategory)
    },
    // 计算当前购物车中所有菜品的总金额
    totalAmount() {
      return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    // 根据货币计算购物车中菜品的总金额
    cartTotalsByCurrency() {
    return this.cartItems.reduce((acc, item) => {
      const curr = item.currency
      if (!acc[curr]) {
        acc[curr] = 0
      }
      acc[curr] += item.price * item.quantity
      return acc
    }, {})
    },
    // 根据货币计算订单中总计的总金额
    orderTotalsByCurrency() {
    if (!this.currentOrder || !this.currentOrder.items) return {}
    return this.currentOrder.items.reduce((acc, item) => {
      const curr = item.currency
      acc[curr] = (acc[curr] || 0) + item.price * item.quantity
      return acc
    }, {})
    },
  },
  async created() {
    await this.loadCurrentOrder()
    // 如果没有订单，显示选择人数弹窗
    if (!this.currentOrder) {
      this.peopleCountVisible = true
    }
    this.loadInitialData()
    this.startAutoRefresh()
  },
  beforeDestroy() {
    this.stopAutoRefresh()
  },
  methods: {
    // 引入价格函数
    formatPrice,
    // 开始自动刷新
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.loadCurrentOrder()
      }, 10000) // 每10秒刷新一次
    },
    // 停止自动刷新
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
      }
    },
    // 加载初始数据
    async loadInitialData() {
      await Promise.all([
        this.loadDishes(),
        this.loadCurrentOrder()
      ])
    },
    // 加载菜品
    async loadDishes() {
      try {
        const res = await request.get('/api/dishes')
        this.dishes = res.data
      } catch (error) {
        this.$message.error('加载菜品失败')
      }
    },
    // 加载当前订单
    async loadCurrentOrder() {
      try {
        const res = await request.get(`/api/tables/${this.tableId}/current-order`)
        this.currentOrder = res.data
      } catch (error) {
        console.error('加载当前订单失败:', error)
      }
    },
    // 获取购物车中菜品数量
    getCartQuantity(dishId) {
      const item = this.cartItems.find(item => item.id === dishId)
      return item ? item.quantity : 0
    },
    // 更新购物车
    updateCart(dish, delta) {
      const item = this.cartItems.find(item => item.id === dish.id)
      if (item) {
        item.quantity += delta
        if (item.quantity <= 0) {
          this.cartItems = this.cartItems.filter(i => i.id !== dish.id)
        }
      } else if (delta > 0) {
        this.cartItems.push({
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: delta,
          currency: dish.currency
        })
      }
    },
    // 获取订单状态类型
    getOrderStatusType(status) {
      const typeMap = {
        'ordering': 'info',
        'processing': 'warning',
        'dining': 'success',
        'completed': 'success'
      }
      return typeMap[status] || 'info'
    },
    // 获取订单状态文本
    getOrderStatusText(status) {
      const textMap = {
        'ordering': '已下单',
        'processing': '处理中',
        'dining': '就餐中',
        'completed': '已完成'
      }
      return textMap[status] || '未知状态'
    },
    // 获取提交订单按钮文本
    getSubmitButtonText() {
      if (!this.cartItems.length) return '请选择菜品'
      if (this.currentOrder?.status === 'processing') return '订单处理中'
      return '提交订单'
    },
    // 确认人数
    async confirmPeopleCount() {
      this.peopleCountVisible = false
      this.showMenuSection = true
    },
    // 提交订单
    async submitOrder() {
      if (this.loading) return
      this.loading = true
      try {
        const orderData = {
          tableId: parseInt(this.tableId),
          items: this.cartItems.map(item => ({
            dishId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            currency: item.currency
          })),
          totalAmount: this.totalAmount
        }
        // 追加菜品
        if (this.currentOrder) {
          await request.post(`/api/orders/${this.currentOrder.id}/append`, orderData)
          this.$message.success('加菜成功')
        } else {
          // 新建订单
          orderData.peopleCount = this.peopleCount
          await request.post('/api/orders', orderData)
          this.$message.success('下单成功')
        }
        await this.loadCurrentOrder()
        this.cartItems = [] // 清空购物车
        this.orderDetailVisible = true  // 提交后显示订单详情
      } catch (error) {
        console.error('Submit order error:', error)
        this.$message.error(this.currentOrder ? '加菜失败' : '下单失败')
      } finally {
        this.loading = false
      }
    },
    // 获取购物车中菜品总数
    getTotalCount() {
      return this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    },
    // 显示已点菜品详情
    showOrderDetail() {
      this.orderDetailVisible = true
    },
    // 显示结账弹窗
    showCheckoutDialog() {
      if (!this.currentOrder || this.currentOrder.status !== 'dining') return
      this.checkoutVisible = true
      this.paymentMethod = 'cash'
    },
    // 处理结账
    async handleCheckout() {
      if (!this.currentOrder || this.checkoutLoading) return
      this.checkoutLoading = true
      
      try {
        await request.post(`/api/orders/${this.currentOrder.id}/checkout`, {
          paymentMethod: this.paymentMethod,
          tableId: this.tableId
        })
        
        this.$message.success('结账成功')
        this.checkoutVisible = false
        await this.loadCurrentOrder()
        setTimeout(() => {
          this.$router.push('/')
        }, 1500)
      } catch (error) {
        console.error('Checkout error:', error)
        this.$message.error('结账失败')
      } finally {
        this.checkoutLoading = false
      }
    },


    test(data) {
    console.log('当前行数据：:::::::', data)
  },
  }
}
</script>

<style scoped>
.order-menu {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-info {
  font-size: 20px;
  font-weight: bold;
}

.menu-content {
  flex: 1;
  overflow: hidden;
}

.category-item {
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.category-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.category-item.active {
  background-color: #fff;
  color: #409EFF;
  font-weight: bold;
  position: relative;
}

.category-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #409EFF;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
  padding: 15px;
}

.dish-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.dish-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.dish-info {
  padding: 10px;
}

.dish-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.dish-price {
  color: #f56c6c;
}

.dish-action {
  padding: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.quantity {
  margin: 0 10px;
}

.cart-panel {
  border-top: 1px solid #eee;
  background: #fff;
  padding: 15px;
}

.cart-items {
  max-height: 300px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.item-controls {
  display: flex;
  align-items: center;
}

.item-price {
  margin-left: 15px;
  color: #f56c6c;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.ordered-items {
  padding: 20px;
  margin-bottom: 20px;
  background: #f8f8f8;
  border-radius: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.order-total {
  margin-top: 15px;
  text-align: right;
  font-size: 16px;
}

.total-amount {
  color: #f56c6c;
  font-weight: bold;
  margin-left: 5px;
}

.order-status {
  margin-left: 15px;
}

.people-count-content {
  text-align: center;
  padding: 20px 0;
}

.ordered-section {
  margin-bottom: 20px;
}

.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.append-button {
  margin-top: 15px;
  width: 100%;
}

.total-amount {
  color: #f56c6c;
  font-weight: bold;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 10px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.total-count {
  color: #666;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.el-aside {
  background-color: #fafafa;
  border-right: 1px solid #f0f0f0;
}

.payment-method {
  padding: 20px 0;
}

.payment-method .label {
  font-size: 16px;
  margin-bottom: 15px;
  color: #606266;
}

.payment-method .el-radio {
  margin-right: 30px;
  padding: 15px 25px;
  border-radius: 4px;
  font-size: 16px;
}

.payment-method .el-radio.is-bordered {
  height: auto;
  margin-bottom: 15px;
}

.payment-method .el-radio i {
  margin-right: 8px;
  font-size: 20px;
}

.dialog-footer .el-button {
  padding: 12px 30px;
  font-size: 16px;
}

/* 支付方式选中状态样式 */
.payment-method .el-radio.is-bordered.is-checked {
  border-color: #409EFF;
  background-color: #ecf5ff;
}
</style> 
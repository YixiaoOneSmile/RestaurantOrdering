<template>
  <div class="menu-container">
    <h1 class="page-title">餐厅菜单 - 桌号 {{ tableId }}</h1>
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-spinner">
      加载中...
    </div>
    <!-- 重新设计的分类导航 -->
    <nav v-if="!loading" class="category-nav">
      <div class="category-scroll">
        <button 
          v-for="category in categories" 
          :key="category"
          :class="['category-item', { active: currentCategory === category }]"
          @click="currentCategory = category"
        >
          <span class="category-icon">{{ getCategoryIcon(category) }}</span>
          <span class="category-name">{{ categoryNames[category] }}</span>
        </button>
      </div>
    </nav>
    <!-- 菜单项 -->
    <div class="menu-items">
      <div 
        v-for="item in filteredMenuItems" 
        :key="item.id" 
        class="menu-item"
      >
        <div class="menu-item-image">
          <img :src="item.imageUrl" :alt="item.name" />
        </div>
        <div class="menu-item-content">
          <h3>{{ item.name }}</h3>
          <p class="description">{{ item.description }}</p>
          <p class="price">￥{{ item.price }}</p>
          <button class="add-button" @click="addToOrder(item)">
            <span class="button-icon">+</span>
            添加到订单
          </button>
        </div>
      </div>
    </div>  
    <!-- 订单汇总 -->
    <div class="order-summary">
      <div class="order-content">
        <h2>当前订单</h2>
        <!-- 订单项 -->
        <div class="order-items">
          <div v-for="(item, index) in currentOrder.items" :key="index" class="order-item">
            <span class="item-name">{{ item.menuItem.name }}</span>
            <div class="item-controls">
              <button class="quantity-btn" @click="decreaseQuantity(item.menuItem)">-</button>
              <span class="item-quantity">{{ item.quantity }}</span>
              <button class="quantity-btn" @click="addToOrder(item.menuItem)">+</button>
            </div>
            <span class="item-price">￥{{ item.subtotal }}</span>
            <button class="delete-btn" @click="removeFromOrder(item.menuItem.id)">
              ×
            </button>
          </div>
        </div>
        <!-- 订单总计 -->
        <div class="order-total">
          <h3>总计: <span>￥{{ currentOrder.totalAmount }}</span></h3>
          <button 
            class="submit-button" 
            @click="submitOrder"
            :disabled="currentOrder.items.length === 0"
          >
            提交订单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MenuItem from '../models/MenuItem'
import Order from '../models/Order'
import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api'

export default {
  name: 'MenuPage',
  props: {
    tableId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      menuItems: [],
      currentOrder: new Order(this.tableId),
      currentCategory: 'all', // 默认显示全部
      categoryNames: {
        all: '全部',
        appetizer: '前菜',
        mainCourse: '主菜',
        soup: '汤类',
        dessert: '甜点',
        beverage: '饮品'
      },
      loading: false,
      error: null
    }
  },
  computed: {
    categories() {
      return ['all', 'appetizer', 'mainCourse', 'soup', 'dessert', 'beverage']
    },
    filteredMenuItems() {
      if (this.currentCategory === 'all') {
        return this.menuItems
      }
      return this.menuItems.filter(item => item.category === this.currentCategory)
    }
  },
  created() {
    this.fetchMenuItems()
  },
  methods: {
    async fetchMenuItems() {
      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/menu`)
        this.menuItems = response.data.map(item => new MenuItem(
          item._id,
          item.name,
          item.price,
          item.description,
          item.imageUrl,
          item.category
        ))
      } catch (error) {
        console.error('获取菜单失败:', error)
        this.error = '获取菜单失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    async addToOrder(menuItem) {
      this.currentOrder.addItem(menuItem, 1)
      const newOrder = new Order(this.tableId)
      newOrder.items = [...this.currentOrder.items]
      newOrder.totalAmount = this.currentOrder.totalAmount
      this.currentOrder = newOrder
    },
    async submitOrder() {
      try {
        const orderData = {
          tableId: this.tableId,
          items: this.currentOrder.items.map(item => ({
            menuItem: item.menuItem.id,
            quantity: item.quantity,
            subtotal: item.subtotal
          })),
          totalAmount: this.currentOrder.totalAmount
        }

        await axios.post(`${API_BASE_URL}/orders`, orderData)
        
        // 清空当前订单
        this.currentOrder = new Order(this.tableId)
        
        this.$message.success('订单提交成功！')
      } catch (error) {
        console.error('提交订单失败:', error)
        this.$message.error('订单提交失败，请重试')
      }
    },
    removeFromOrder(menuItemId) {
      this.currentOrder.removeItem(menuItemId)
      const newOrder = new Order(this.tableId)
      newOrder.items = [...this.currentOrder.items]
      newOrder.totalAmount = this.currentOrder.totalAmount
      this.currentOrder = newOrder
    },
    decreaseQuantity(menuItem) {
      const existingItem = this.currentOrder.items.find(
        item => item.menuItem.id === menuItem.id
      )
      
      if (existingItem) {
        if (existingItem.quantity > 1) {
          this.currentOrder.addItem(menuItem, -1)
        } else {
          this.removeFromOrder(menuItem.id)
        }
        
        const newOrder = new Order(this.tableId)
        newOrder.items = [...this.currentOrder.items]
        newOrder.totalAmount = this.currentOrder.totalAmount
        this.currentOrder = newOrder
      }
    },
    getCategoryIcon(category) {
      const icons = {
        all: '🍽️',
        appetizer: '🥗',
        mainCourse: '🍜',
        soup: '🥣',
        dessert: '🍰',
        beverage: '🥤'
      }
      return icons[category]
    }
  }
}
</script>

<style scoped>
.menu-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 200px;
}

.page-title {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 40px;
  font-size: 2.2em;
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.menu-item {
  border: none;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.menu-item:hover {
  transform: translateY(-5px);
}

.menu-item-image {
  height: 200px;
  overflow: hidden;
}

.menu-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.menu-item:hover img {
  transform: scale(1.05);
}

.menu-item-content {
  padding: 20px;
}

.menu-item h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.4em;
}

.description {
  color: #666;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.price {
  color: #e74c3c;
  font-size: 1.3em;
  font-weight: bold;
  margin: 15px 0;
}

.add-button {
  width: 100%;
  padding: 12px;
  border: none;
  background: #2ecc71;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.add-button:hover {
  background: #27ae60;
}

.button-icon {
  margin-right: 8px;
  font-size: 1.2em;
}

.order-summary {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  z-index: 1000;
}

.order-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.order-items {
  max-height: 200px;
  overflow-y: auto;
  margin: 15px 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.item-name {
  flex: 2;
  color: #2c3e50;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 15px;
}

.quantity-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.3s ease;
}

.quantity-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ff4757;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
  margin-left: 10px;
}

.delete-btn:hover {
  background: #ff6b81;
}

.item-quantity {
  color: #666;
  min-width: 20px;
  text-align: center;
}

.item-price {
  flex: 1;
  text-align: right;
  color: #e74c3c;
  font-weight: bold;
  margin-right: 10px;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.order-total h3 {
  color: #2c3e50;
}

.order-total span {
  color: #e74c3c;
  font-size: 1.2em;
}

.submit-button {
  padding: 12px 40px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s ease;
}

.submit-button:hover {
  background: #2980b9;
}

.category-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 15px 0;
  margin: -20px -20px 30px -20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.category-scroll {
  display: flex;
  gap: 15px;
  padding: 0 20px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scroll-behavior: smooth;
}

.category-scroll::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  padding: 12px 8px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 8px;
  color: #666;
  position: relative;
}

.category-item::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: #3498db;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.category-item.active {
  color: #3498db;
}

.category-item.active::after {
  width: 30px;
}

.category-icon {
  font-size: 1.8em;
  margin-bottom: 4px;
}

.category-name {
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
}

.category-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .category-nav {
    padding: 10px 0;
  }

  .category-item {
    min-width: 70px;
    padding: 8px 6px;
  }

  .category-icon {
    font-size: 1.5em;
  }

  .category-name {
    font-size: 0.8em;
  }
}

/* 添加新的样式 */
.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.loading-spinner {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.2em;
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style> 
<template>
  <div class="dishes-grid">
    <div 
      v-for="dish in dishes" 
      :key="dish.id" 
      class="dish-card"
    >
      <img :src="dish.image" class="dish-image">
      <div class="dish-info">
        <div class="dish-name" @click="test(dish)">{{ getDishName(dish) }}</div>
        <div class="dish-price">
          {{ dish.price }} {{ formatPrice(dish) }}
        </div>
      </div>
      <div class="dish-action">
        <template v-if="getCartQuantity(dish.id) > 0">
          <el-button 
            type="text" 
            icon="el-icon-minus"
            @click="$emit('update-cart', dish, -1)"
          />
          <span class="quantity">{{ getCartQuantity(dish.id) }}</span>
        </template>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          circle
          @click="$emit('update-cart', dish, 1)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DishesGrid',
  props: {
    dishes: {
      type: Array,
      required: true
    },
    getCartQuantity: {
      type: Function,
      required: true
    },
    formatPrice: {
      type: Function,
      required: true
    }
    },
    methods: {
    getDishName(dish) {
      const locale = this.$i18n.locale;
      if (locale.startsWith('zh')) {
        return dish.nameCN;
      } else if (locale.startsWith('ja')) {
        return dish.nameJP;
      } else {
        return dish.name;
      }
    },
    test(dish) {
      console.log('测试:::::::::::',dish)
    }
  }
}
</script>

<style scoped>
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
</style>
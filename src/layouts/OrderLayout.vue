<template>
  <div class="order-layout">
    <div class="header">
      <div class="left">
        <span class="restaurant-name">{{ $t('restaurant.name') }}</span>
      </div>
      <div class="right">
        <lang-switch />
      </div>
    </div>
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import LangSwitch from '@/components/LangSwitch.vue'

export default {
  name: 'OrderLayout',
  components: {
    LangSwitch
  }
}
</script>

<style scoped>
.order-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #333;
}

.left {
  display: flex;
  align-items: center;
}

.restaurant-name {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style> 
export default class Order {
  constructor(tableId) {
    this.tableId = tableId;
    this.items = [];
    this.totalAmount = 0;
  }

  addItem(menuItem, quantity) {
    // 检查是否已经存在该商品
    const existingItem = this.items.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      // 如果存在，增加数量
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * menuItem.price;
    } else {
      // 如果不存在，添加新项目
      this.items.push({
        menuItem,
        quantity,
        subtotal: quantity * menuItem.price
      });
    }

    // 重新计算总金额
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  removeItem(menuItemId) {
    // 找到要删除的项目索引
    const index = this.items.findIndex(item => item.menuItem.id === menuItemId);
    
    if (index !== -1) {
      // 从数组中删除该项目
      this.items.splice(index, 1);
      // 重新计算总金额
      this.calculateTotal();
    }
  }
} 
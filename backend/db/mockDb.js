const { sequelize, MenuItem, Table} = require('../src/models');
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.join(__dirname, '..');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

async function initDb() {
  try {
    // 只在数据库不存在时初始化
    await sequelize.sync({ force: false });

    // 检查是否需要初始化测试数据
    const tableCount = await Table.count();
    const menuItemCount = await MenuItem.count();
    
    // 只在没有数据时初始化测试数据
    if (tableCount === 0 && menuItemCount === 0) {
      // 初始化一些测试数据
      await Promise.all([
        // 创建菜品
        MenuItem.bulkCreate([
          { name: '宫保鸡丁', price: 38, categoryId: 1, image: 'dish1.jpg' },
          { name: '鱼香肉丝', price: 32, categoryId: 1, image: 'dish2.jpg' },
          { name: '水煮鱼', price: 58, categoryId: 1, image: 'dish3.jpg' },
          { name: '凉拌黄瓜', price: 18, categoryId: 2, image: 'dish4.jpg' },
          { name: '白切鸡', price: 48, categoryId: 2, image: 'dish5.jpg' },
          { name: '米饭', price: 3, categoryId: 3, image: 'dish6.jpg' },
          { name: '可乐', price: 5, categoryId: 4, image: 'dish7.jpg' }
        ]),

        // 创建桌台
        Table.bulkCreate([
          { number: 1, capacity: 4, status: 'empty' },
          { number: 2, capacity: 4, status: 'empty' },
          { number: 3, capacity: 6, status: 'empty' },
          { number: 4, capacity: 8, status: 'empty' }
        ])
      ]);
      console.log('Test data initialized successfully');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 只在开发环境初始化测试数据
if (process.env.NODE_ENV === 'development') {
  initDb();
}

module.exports = { initDb }; 
const { sequelize, Table, MenuItem } = require('../models');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    // 检查数据库文件是否存在
    const dbPath = path.join(__dirname, '../../db/database.sqlite');
    const dbExists = fs.existsSync(dbPath);
    
    // 如果数据库文件存在且需要重建，则删除它
    if (dbExists) {
      try {
        await sequelize.close(); // 关闭连接
        fs.unlinkSync(dbPath); // 删除文件
        console.log('Existing database file removed');
      } catch (error) {
        console.error('Error removing database file:', error);
      }
    }

    // 同步数据库结构
    await sequelize.sync({ force: true }); // 强制重建表

    // 检查是否需要初始化测试数据
    const tableCount = await Table.count();
    const menuItemCount = await MenuItem.count();
    
    // 只在没有任何数据时初始化
    if (tableCount === 0 && menuItemCount === 0) {
      console.log('Initializing test data...');
      
      await Promise.all([
        // 创建初始桌台
        Table.bulkCreate([
          { number: 1, capacity: 4, status: 'empty' },
          { number: 2, capacity: 4, status: 'empty' },
          { number: 3, capacity: 6, status: 'empty' },
          { number: 4, capacity: 8, status: 'empty' }
        ]),

        // 创建初始菜品
        MenuItem.bulkCreate([
          { name: '宫保鸡丁', price: 38, categoryId: 1, image: 'dish1.jpg' },
          { name: '鱼香肉丝', price: 32, categoryId: 1, image: 'dish2.jpg' },
          { name: '水煮鱼', price: 58, categoryId: 1, image: 'dish3.jpg' },
          { name: '凉拌黄瓜', price: 18, categoryId: 2, image: 'dish4.jpg' },
          { name: '白切鸡', price: 48, categoryId: 2, image: 'dish5.jpg' },
          { name: '米饭', price: 3, categoryId: 3, image: 'dish6.jpg' },
          { name: '可乐', price: 5, categoryId: 4, image: 'dish7.jpg' }
        ])
      ]);

      console.log('Test data initialized successfully');
    } else {
      console.log('Database already contains data, skipping initialization');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 
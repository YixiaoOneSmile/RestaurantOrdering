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
          { name: '宫保鸡丁', price: 38, categoryId: 1, image: 'https://ts1.cn.mm.bing.net/th/id/R-C.8165988217ffad266e33002fdbb2997c?rik=woGtDL3D5G1p4A&riu=http%3a%2f%2fi3.meishichina.com%2fattachment%2frecipe%2f2017%2f08%2f03%2f20170803150176621941910121381.jpg%40!p800&ehk=9vFZXMM2zfPq6aIg7J0FksL9Zy2CYhONG1KpCSN0TrY%3d&risl=&pid=ImgRaw&r=0', currency: 'CNY' },
          { name: '鱼香肉丝', price: 32, categoryId: 1, image: 'https://aimg8.dlssyht.cn/u/2011304/ueditor/image/1006/2011304/1673325797854481.jpg', currency: 'CNY' },
          { name: '水煮鱼', price: 58, categoryId: 1, image: 'https://ts1.cn.mm.bing.net/th/id/R-C.5d5e26209e65ba86e9162b634c55dbc6?rik=pbtEUF0%2fA80ciA&riu=http%3a%2f%2fcp1.douguo.net%2fupload%2fcaiku%2f1%2f8%2f6%2fyuan_18e6271dc56d5aae7740b2518d7b1b76.jpeg&ehk=EtIZa3qPgDj%2fUubb6QZxmD2rcBAqB3cSN%2bUdw2TQydc%3d&risl=&pid=ImgRaw&r=0', currency: 'CNY' },
          { name: '凉拌黄瓜', price: 18, categoryId: 2, image: 'https://cp1.douguo.com/upload/caiku/7/a/4/yuan_7ac4507e98988cee78a0f2a3777cea94.jpg', currency: 'CNY' },
          { name: '白切鸡', price: 48, categoryId: 2, image: 'https://ts1.cn.mm.bing.net/th/id/R-C.5055b342d1f2cf693acd5fe80c2495ce?rik=7AZILugGTZvYUQ&riu=http%3a%2f%2fi2.chuimg.com%2f8b2e8ad48bb94cdd8d69c9c8b9175869_2448w_1836h.jpg%3fimageView2%2f2%2fw%2f660%2finterlace%2f1%2fq%2f90&ehk=%2bSzgA1KK8%2bQRlr0HPRyf72aCs3hW9LDUx%2ffapoB6uFo%3d&risl=&pid=ImgRaw&r=0', currency: 'CNY' },
          { name: '米饭', price: 3, categoryId: 3, image: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.t5mMyL03UFtTtnCp5__mxwHaGR?rs=1&pid=ImgDetMain', currency: 'CNY' },
          { name: '可乐', price: 5, categoryId: 4, image: 'https://tse4-mm.cn.bing.net/th/id/OIP-C.ln6jMUbvoMhcPObv6pa4EQHaHa?w=189&h=189&c=7&r=0&o=5&dpr=1.5&pid=1.7', currency: 'CNY' }
        ])
      ]);

      console.log('测试数据初始化成功');
    } else {
      console.log('数据库已包含数据，跳过初始化');
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 
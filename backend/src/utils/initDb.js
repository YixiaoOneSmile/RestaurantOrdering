const { sequelize, Table, MenuItem, User } = require("../models/db/database");
const printerService = require("../services/printerService");
const { generateTableQRCode } = require('./qrcode');
const bcrypt = require("bcrypt");


async function initializeDatabase() {
  try {
    await sequelize.sync();
    // 检查是否已有数据
    const tableCount = await Table.count();
    const menuItemCount = await MenuItem.count();
    const userCount = await User.count();

    if (tableCount === 0 && menuItemCount === 0) {
      // 创建初始桌台
      const tables = await Table.bulkCreate([
        { number: 1, capacity: 4, status: "empty" },
        { number: 2, capacity: 4, status: "empty" },
        { number: 3, capacity: 6, status: "empty" },
        { number: 4, capacity: 8, status: "empty" },
      ]);

      for (const table of tables) {
        const qrCodePath = await generateTableQRCode(table.id, table.number);
        await table.update({ qrCodeUrl: qrCodePath });
      }

      // 创建初始菜品
      await MenuItem.bulkCreate([
        {
          name: "Kung Pao Chicken",
          nameCN: "宫保鸡丁",
          nameJP: "カンパオチキン",
          price: 38,
          categoryId: 1,
          image:
            "https://ts1.cn.mm.bing.net/th/id/R-C.8165988217ffad266e33002fdbb2997c?rik=woGtDL3D5G1p4A&riu=http%3a%2f%2fi3.meishichina.com%2fattachment%2frecipe%2f2017%2f08%2f03%2f20170803150176621941910121381.jpg%40!p800&ehk=9vFZXMM2zfPq6aIg7J0FksL9Zy2CYhONG1KpCSN0TrY%3d&risl=&pid=ImgRaw&r=0",
          currency: "CNY",
        },
        {
          name: "Yu Xiang Shredded Pork",
          nameCN: "鱼香肉丝",
          nameJP: "ユウシャンローストポーク",
          price: 32,
          categoryId: 1,
          image:
            "https://aimg8.dlssyht.cn/u/2011304/ueditor/image/1006/2011304/1673325797854481.jpg",
          currency: "CNY",
        },
        {
          name: "Boiled Fish in Chili Oil",
          nameCN: "水煮鱼",
          nameJP: "辛子水煮魚",
          price: 58,
          categoryId: 1,
          image:
            "https://ts1.cn.mm.bing.net/th/id/R-C.5d5e26209e65ba86e9162b634c55dbc6?rik=pbtEUF0%2fA80ciA&riu=http%3a%2f%2fcp1.douguo.net%2fupload%2fcaiku%2f1%2f8%2f6%2fyuan_18e6271dc56d5aae7740b2518d7b1b76.jpeg&ehk=EtIZa3qPgDj%2fUubb6QZxmD2rcBAqB3cSN%2bUdw2TQydc%3d&risl=&pid=ImgRaw&r=0",
          currency: "CNY",
        },
        {
          name: "Cold Cucumber Salad",
          nameCN: "凉拌黄瓜",
          nameJP: "冷製キュウリ",
          price: 18,
          categoryId: 2,
          image:
            "https://cp1.douguo.com/upload/caiku/7/a/4/yuan_7ac4507e98988cee78a0f2a3777cea94.jpg",
          currency: "CNY",
        },
        {
          name: "White-Cut Chicken",
          nameCN: "白切鸡",
          nameJP: "白切鶏",
          price: 48,
          categoryId: 2,
          image:
            "https://ts1.cn.mm.bing.net/th/id/R-C.5055b342d1f2cf693acd5fe80c2495ce?rik=7AZILugGTZvYUQ&riu=http%3a%2f%2fi2.chuimg.com%2f8b2e8ad48bb94cdd8d69c9c8b9175869_2448w_1836h.jpg%3fimageView2%2f2%2fw%2f660%2finterlace%2f1%2fq%2f90&ehk=%2bSzgA1KK8%2bQRlr0HPRyf72aCs3hW9LDUx%2ffapoB6uFo%3d&risl=&pid=ImgRaw&r=0",
          currency: "CNY",
        },
        {
          name: "Rice",
          nameCN: "米饭",
          nameJP: "ご飯",
          price: 3,
          categoryId: 3,
          image:
            "https://tse3-mm.cn.bing.net/th/id/OIP-C.t5mMyL03UFtTtnCp5__mxwHaGR?rs=1&pid=ImgDetMain",
          currency: "CNY",
        },
        {
          name: "Cola",
          nameCN: "可乐",
          nameJP: "コーラ",
          price: 5,
          categoryId: 4,
          image:
            "https://tse4-mm.cn.bing.net/th/id/OIP-C.ln6jMUbvoMhcPObv6pa4EQHaHa?w=189&h=189&c=7&r=0&o=5&dpr=1.5&pid=1.7",
          currency: "CNY",
        },
      ]);

      // 创建管理员账号（如果不存在）
      if (userCount === 0) {
        // 生成哈希密码
        const adminPassword = "admin123"; // 初始管理员密码
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // 创建管理员账号
        await User.create({
          phone: "13800000000",
          email: "admin@restaurant.com",
          password: hashedPassword,
          name: "系统管理员",
          role: "admin",
          status: "active",
          lastLoginAt: new Date(),
        });

        console.log("管理员账号创建成功");
        console.log("管理员账号: admin@restaurant.com");
        console.log("管理员密码: admin123");
      }

      // 初始化打印机
      try {
        console.log("正在初始化打印机...");
        const results = await printerService.initializePrinters();
        const success = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        console.log(`打印机初始化完成，成功: ${success}，失败: ${failed}`);
      } catch (error) {
        console.error("打印机初始化失败:", error);
      }

      console.log("测试数据初始化成功");
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 
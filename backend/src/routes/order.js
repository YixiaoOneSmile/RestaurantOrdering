const express = require('express');
const router = express.Router();
const { MenuItem, Order, Table } = require('../models');

// 获取菜品分类
router.get('/categories', (req, res) => {
  const categories = [
    { id: 1, name: '热菜' },
    { id: 2, name: '凉菜' },
    { id: 3, name: '主食' },
    { id: 4, name: '饮品' }
  ];
  res.json({ code: 0, data: categories });
});

// 获取菜品列表
router.get('/dishes', async (req, res) => {
  try {
    const dishes = await MenuItem.findAll();
    res.json({ code: 0, data: dishes });
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取菜品失败' });
  }
});

// 提交订单
router.post('/orders', async (req, res) => {
  try {
    const { tableId, items, totalAmount, peopleCount } = req.body;

    // 创建订单
    const order = await Order.create({
      tableId,
      items,
      status: 'ordering',  // 使用正确的初始状态
      totalAmount,
      peopleCount,
      createdAt: new Date()
    });

    // 更新桌台状态
    await Table.update(
      { status: 'dining' },
      { where: { id: tableId } }
    );

    res.json({ 
      code: 0, 
      data: order,
      message: '订单提交成功' 
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ code: 1, message: '提交订单失败' });
  }
});

// 获取桌台当前订单
router.get('/tables/:tableId/current-order', async (req, res) => {
  try {
    const { tableId } = req.params;
    const order = await Order.findOne({
      where: {
        tableId,
        status: ['ordering', 'processing', 'dining']  // 使用正确的状态
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ code: 0, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ code: 1, message: '获取订单失败' });
  }
});

// 追加菜品
router.post('/orders/:orderId/append', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;

    // 查找原订单
    const order = await Order.findOne({
      where: {
        id: orderId,
        status: ['ordering', 'processing', 'dining']  // 只允许这些状态的订单追加
      }
    });

    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在或不能追加' });
    }

    // 获取原有菜品并合并新菜品
    const currentItems = order.items;
    const newItems = items.map(item => ({
      dishId: item.dishId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // 合并相同菜品的数量
    const mergedItems = [...currentItems];
    newItems.forEach(newItem => {
      const existingItem = mergedItems.find(item => item.dishId === newItem.dishId);
      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        mergedItems.push(newItem);
      }
    });

    // 计算新的总金额
    const totalAmount = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 更新订单
    await order.update({
      items: mergedItems,
      totalAmount
    });

    res.json({ 
      code: 0, 
      message: '加菜成功',
      data: order
    });
  } catch (error) {
    console.error('Append order error:', error);
    res.status(500).json({ code: 1, message: '加菜失败' });
  }
});

module.exports = router; 
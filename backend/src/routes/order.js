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
      status: 'ordering',  // 初始状态为"点餐中"
      totalAmount,
      peopleCount,
      createdAt: new Date()
    });

    // 更新桌台状态为"点餐中"
    await Table.update(
      { status: 'ordering' },  // 改为"点餐中"状态
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

    const order = await Order.findOne({
      where: {
        id: orderId,
        status: ['ordering', 'processing', 'dining']
      }
    });

    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在或不能追加' });
    }

    // 获取原有菜品
    const currentItems = order.items;
    
    // 标记新菜品
    const newItems = items.map(item => ({
      ...item,
      isAppended: true,  // 标记为追加的菜品
      appendedAt: new Date()
    }));

    // 更新订单和桌台状态
    await Promise.all([
      // 更新订单
      order.update({
        items: [...currentItems, ...newItems],
        status: 'ordering',  // 状态改为点餐中
        totalAmount: currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
                    newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      }),
      // 更新桌台状态
      Table.update(
        { status: 'ordering' },  // 改为点餐中
        { where: { id: order.tableId } }
      )
    ]);

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

// 结账路由
router.post('/orders/:orderId/checkout', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, tableId } = req.body;
    
    // 查找订单
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ 
        code: 1, 
        message: '订单不存在' 
      });
    }

    // 更新订单状态为已完成
    await order.update({
      status: 'completed',
      paymentMethod,
      paidAt: new Date()
    });

    // 更新餐桌状态为空闲
    await Table.update(
      { status: 'empty' },
      { where: { id: tableId } }
    );

    res.json({ 
      code: 0, 
      message: '结账成功' 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      code: 1, 
      message: '结账失败' 
    });
  }
});

module.exports = router; 
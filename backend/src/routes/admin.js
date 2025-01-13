const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Order, Table, MenuItem } = require('../models');

// 获取所有桌台状态
router.get('/tables', async (req, res) => {
  try {
    const tables = await Table.findAll({
      include: [{
        model: Order,
        where: {
          status: {
            [Op.in]: ['ordering', 'processing', 'dining']
          }
        },
        required: false,
        as: 'orders',
        limit: 1,
        order: [['createdAt', 'DESC']]
      }]
    });

    const formattedTables = tables.map(table => {
      const plainTable = table.get({ plain: true });
      return {
        ...plainTable,
        currentOrder: plainTable.orders?.[0] || null
      };
    });

    res.json({ code: 0, data: formattedTables });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ code: 1, message: '获取桌台失败' });
  }
});

// 获取桌台订单详情
router.get('/tables/:tableId/current-order', async (req, res) => {
  try {
    const { tableId } = req.params;
    const order = await Order.findOne({
      where: {
        tableId,
        status: ['ordering', 'processing', 'dining']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ code: 0, data: order });
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取订单失败' });
  }
});

// 完成订单
router.put('/orders/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tableId } = req.body;
    
    // 获取订单
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }

    // 获取所有菜品
    const allItems = order.items;
    
    // 合并原始菜品和追加菜品
    const mergedItems = allItems.map(item => ({
      ...item,
      isAppended: false,  // 移除追加标记
      appendedAt: null    // 移除追加时间
    }));

    // 更新订单状态和菜品
    await order.update({
      status: 'dining',    // 改为就餐中状态
      items: mergedItems,  // 更新合并后的菜品
    });
    
    // 更新桌台状态
    await Table.update(
      { status: 'dining' },
      { where: { id: tableId } }
    );
    
    res.json({ code: 0, message: '操作成功' });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ code: 1, message: '操作失败' });
  }
});

// 结账
router.post('/orders/:orderId/checkout', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }

    // 更新订单状态
    await order.update({
      status: 'completed',
      paymentMethod,
      paidAt: new Date()
    });

    // 更新桌台状态
    await Table.update(
      { status: 'empty' },
      { where: { id: order.tableId } }
    );

    res.json({ code: 0, message: '结账成功' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ code: 1, message: '结账失败' });
  }
});

// 获取菜品列表
router.get('/dishes', async (req, res) => {
  try {
    const dishes = await MenuItem.findAll();
    res.json({ code: 0, data: dishes });
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json({ code: 1, message: '获取菜品失败' });
  }
});

// 添加菜品
router.post('/dishes', async (req, res) => {
  try {
    const dish = await MenuItem.create(req.body);
    res.json({ code: 0, data: dish, message: '添加成功' });
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({ code: 1, message: '添加失败' });
  }
});

// 修改菜品
router.put('/dishes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findByPk(id);
    if (!dish) {
      return res.status(404).json({ code: 1, message: '菜品不存在' });
    }
    await dish.update(req.body);
    res.json({ code: 0, message: '修改成功' });
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({ code: 1, message: '修改失败' });
  }
});

// 删除菜品
router.delete('/dishes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findByPk(id);
    if (!dish) {
      return res.status(404).json({ code: 1, message: '菜品不存在' });
    }
    await dish.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({ code: 1, message: '删除失败' });
  }
});

// 获取订单列表
router.get('/orders', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ code: 0, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ code: 1, message: '获取订单失败' });
  }
});

// 添加桌台
router.post('/tables', async (req, res) => {
  try {
    const { number, capacity } = req.body;
    
    // 检查桌号是否已存在
    const existingTable = await Table.findOne({ where: { number } });
    if (existingTable) {
      return res.status(400).json({ 
        code: 1, 
        message: '该桌号已存在' 
      });
    }
    
    // 验证容纳人数
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({
        code: 1,
        message: '容纳人数必须在1-20人之间'
      });
    }

    const table = await Table.create({
      number,
      capacity,
      status: 'empty'
    });

    res.json({ 
      code: 0, 
      data: table,
      message: '添加成功'
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ code: 1, message: '添加失败' });
  }
});

// 修改桌台
router.put('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity } = req.body;
    const table = await Table.findByPk(id);
    
    if (!table) {
      return res.status(404).json({ code: 1, message: '桌台不存在' });
    }
    
    // 检查新桌号是否与其他桌台冲突
    if (number !== table.number) {
      const existingTable = await Table.findOne({ 
        where: { 
          number,
          id: { [Op.ne]: id }  // 排除当前编辑的桌台
        } 
      });
      if (existingTable) {
        return res.status(400).json({ code: 1, message: '该桌号已存在' });
      }
    }
    
    if (table.status !== 'empty') {
      return res.status(400).json({ code: 1, message: '桌台正在使用中，无法修改' });
    }
    
    await table.update({ number, capacity });
    res.json({ code: 0, data: table });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ code: 1, message: '修改失败' });
  }
});

// 删除桌台
router.delete('/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);
    
    if (!table) {
      return res.status(404).json({ code: 1, message: '桌台不存在' });
    }
    
    if (table.status !== 'empty') {
      return res.status(400).json({ code: 1, message: '桌台正在使用中，无法删除' });
    }
    
    await table.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ code: 1, message: '删除失败' });
  }
});

// 删除菜单单项
router.delete('/orders/:orderId/delete-item', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex } = req.body;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }

    // 获取当前订单的所有菜品
    const items = order.items;
    
    // 确保索引有效
    if (itemIndex < 0 || itemIndex >= items.length) {
      return res.status(400).json({ code: 1, message: '无效的菜品索引' });
    }

    // 删除指定索引的菜品
    items.splice(itemIndex, 1);

    // 重新计算总金额
    const newTotalAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // 更新订单
    await order.update({
      items: items,
      totalAmount: newTotalAmount
    });

    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('Delete order item error:', error);
    res.status(500).json({ code: 1, message: '删除失败' });
  }
});

module.exports = router; 
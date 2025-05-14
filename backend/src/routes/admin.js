const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { Op } = require("sequelize");
const { Order, Table, MenuItem, User } = require("../models/db/database");
const { generateTableQRCode } = require("../utils/qrcode");
const { validateDish } = require("../utils/validateDish");
const { handleImageUpload } = require("../utils/fileUploadImg");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const printerService = require("../services/printerService");


// 获取所有桌台状态
router.get("/tables", async (req, res) => {
  try {
    const tables = await Table.findAll({
      include: [
        {
          model: Order,
          where: {
            status: {
              [Op.in]: ["ordering", "processing", "dining"],
            },
          },
          required: false,
          as: "orders",
          limit: 1,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    const formattedTables = tables.map((table) => {
      const plainTable = table.get({ plain: true });
      return {
        ...plainTable,
        currentOrder: plainTable.orders?.[0] || null,
      };
    });

    res.json({ code: 0, data: formattedTables });
  } catch (error) {
    console.error("Get tables error:", error);
    res.status(500).json({ code: 1, message: "获取桌台失败" });
  }
});

// 获取桌台订单详情
router.get("/tables/:tableId/current-order", async (req, res) => {
  try {
    const { tableId } = req.params;
    const order = await Order.findOne({
      where: {
        tableId,
        status: ["ordering", "processing", "dining"],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({ code: 0, data: order });
  } catch (error) {
    res.status(500).json({ code: 1, message: "获取订单失败" });
  }
});

// 完成订单
router.put("/orders/:orderId/complete", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tableId } = req.body;

    // 获取订单
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: "订单不存在" });
    }

    // 获取所有菜品
    const allItems = order.items;

    // 合并原始菜品和追加菜品
    const mergedItems = allItems.map((item) => ({
      ...item,
      isAppended: false, // 移除追加标记
      appendedAt: null, // 移除追加时间
    }));

    // 更新订单状态和菜品
    await order.update({
      status: "dining", // 改为就餐中状态
      items: mergedItems, // 更新合并后的菜品
    });

    // 更新桌台状态
    await Table.update({ status: "dining" }, { where: { id: tableId } });

    res.json({ code: 0, message: "操作成功" });
  } catch (error) {
    console.error("Complete order error:", error);
    res.status(500).json({ code: 1, message: "操作失败" });
  }
});

// 删除订单
router.delete("/orders/:orderId/remove", async (req, res) => {
  try {
    const { orderId } = req.params;

    // 先获取订单信息
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: "订单不存在" });
    }

    // 保存桌台ID，用于后续更新桌台状态
    const tableId = order.tableId;

    // 删除订单
    await order.destroy();

    // 更新对应桌台状态为空闲
    await Table.update(
      { status: "empty" },
      { where: { id: tableId } } // 只更新对应的桌台
    );

    res.json({ code: 0, message: "删除成功" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ code: 1, message: "删除失败" });
  }
});

// 结账
router.post("/orders/:orderId/checkout", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: "订单不存在" });
    }

    // 更新订单状态
    await order.update({
      status: "completed",
      paymentMethod,
      paidAt: new Date(),
    });

    // 更新桌台状态
    await Table.update({ status: "empty" }, { where: { id: order.tableId } });

    res.json({ code: 0, message: "结账成功" });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ code: 1, message: "结账失败" });
  }
});

// 获取菜品列表
router.get("/dishes", async (req, res) => {
  try {
    const dishes = await MenuItem.findAll();
    res.json({ code: 0, data: dishes });
  } catch (error) {
    console.error("Get dishes error:", error);
    res.status(500).json({ code: 1, message: "获取菜品失败" });
  }
});

// 添加菜品
router.post("/dishes", handleImageUpload, async (req, res) => {
  try {
    const validationError = validateDish(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const { name, nameCN, nameJP, price, currency, categoryId, image } =
      req.body;

    const dish = await MenuItem.create({
      name, // 英文名
      nameCN, // 中文名
      nameJP, // 日文名
      price: Number(price),
      currency,
      categoryId: Number(categoryId),
      image,
    });

    res.json({
      code: 0,
      data: dish,
      message: "添加成功",
    });
  } catch (error) {
    console.error("Create dish error:", error);
    res.status(500).json({ code: 1, message: "添加失败" });
  }
});

// 修改菜品
router.put("/dishes/:id", handleImageUpload, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证菜品数据
    const validationError = validateDish(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const dish = await MenuItem.findByPk(id);
    if (!dish) {
      return res.status(404).json({ code: 1, message: "菜品不存在" });
    }

    const { name, nameCN, nameJP, price, currency, categoryId, image } =
      req.body;

    await dish.update({
      name,
      nameCN,
      nameJP,
      price: Number(price),
      currency,
      categoryId: Number(categoryId),
      image,
    });

    res.json({ code: 0, message: "修改成功" });
  } catch (error) {
    console.error("Update dish error:", error);
    res.status(500).json({ code: 1, message: "修改失败" });
  }
});

// 删除菜品
router.delete("/dishes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findByPk(id);
    if (!dish) {
      return res.status(404).json({ code: 1, message: "菜品不存在" });
    }
    await dish.destroy();
    res.json({ code: 0, message: "删除成功" });
  } catch (error) {
    console.error("Delete dish error:", error);
    res.status(500).json({ code: 1, message: "删除失败" });
  }
});

// 获取订单列表
router.get("/orders", async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({ code: 0, data: orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ code: 1, message: "获取订单失败" });
  }
});

// 添加桌台
router.post("/tables", async (req, res) => {
  try {
    const { number, capacity } = req.body;

    // 检查桌号是否已存在
    const existingTable = await Table.findOne({ where: { number } });
    if (existingTable) {
      return res.status(400).json({
        code: 1,
        message: "该桌号已存在",
      });
    }

    // 验证容纳人数
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({
        code: 1,
        message: "容纳人数必须在1-20人之间",
      });
    }

    const table = await Table.create({
      number,
      capacity,
      status: "empty",
    });

    // 生成二维码
    const qrCodePath = await generateTableQRCode(table.id, table.number);
    await table.update({ qrCodeUrl: qrCodePath });

    res.json({
      code: 0,
      data: table,
      message: "添加成功",
    });
  } catch (error) {
    console.error("Create table error:", error);
    res.status(500).json({ code: 1, message: "添加失败" });
  }
});

// 修改桌台
router.put("/tables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity } = req.body;
    const table = await Table.findByPk(id);

    if (!table) {
      return res.status(404).json({ code: 1, message: "桌台不存在" });
    }

    // 检查新桌号是否与其他桌台冲突
    if (number !== table.number) {
      const existingTable = await Table.findOne({
        where: {
          number,
          id: { [Op.ne]: id }, // 排除当前编辑的桌台
        },
      });
      if (existingTable) {
        return res.status(400).json({ code: 1, message: "该桌号已存在" });
      }
    }

    if (table.status !== "empty") {
      return res
        .status(400)
        .json({ code: 1, message: "桌台正在使用中，无法修改" });
    }

    await table.update({ number, capacity });
    res.json({ code: 0, data: table });
  } catch (error) {
    console.error("Update table error:", error);
    res.status(500).json({ code: 1, message: "修改失败" });
  }
});

// 删除桌台
router.delete("/tables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);

    if (!table) {
      return res.status(404).json({ code: 1, message: "桌台不存在" });
    }

    if (table.status !== "empty") {
      return res
        .status(400)
        .json({ code: 1, message: "桌台正在使用中，无法删除" });
    }

    await table.destroy();
    res.json({ code: 0, message: "删除成功" });
  } catch (error) {
    console.error("Delete table error:", error);
    res.status(500).json({ code: 1, message: "删除失败" });
  }
});

// 删除菜单单项
router.delete("/orders/:orderId/delete-item", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ code: 1, message: "订单不存在" });
    }

    // 获取当前订单的所有菜品
    const items = order.items;

    // 确保索引有效
    if (itemIndex < 0 || itemIndex >= items.length) {
      return res.status(400).json({ code: 1, message: "无效的菜品索引" });
    }

    // 删除指定索引的菜品
    items.splice(itemIndex, 1);

    // 重新计算总金额
    const newTotalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 更新订单
    await order.update({
      items: items,
      totalAmount: newTotalAmount,
    });

    if (items.length === 0) {
      await order.destroy();
      await Table.update({ status: "empty" }, { where: { id: order.tableId } });
    }

    res.json({ code: 0, message: "删除成功" });
  } catch (error) {
    console.error("Delete order item error:", error);
    res.status(500).json({ code: 1, message: "删除失败" });
  }
});

// 图片上传接口
router.post("/upload", handleImageUpload, (req, res) => {
  try {
    // req.body.image 是中间件处理后的图片路径
    if (!req.body.image) {
      return res.status(400).json({
        code: 1,
        message: "上传失败，未接收到文件",
      });
    }

    // 返回图片路径
    return res.json({
      code: 0,
      data: req.body.image,
      message: "上传成功",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      code: 1,
      message: "服务器错误",
    });
  }
});

// 获取所有用户列表 (仅管理员可访问)
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // 不返回密码字段
      order: [["createdAt", "DESC"]],
    });
    res.json({ code: 0, data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ code: 1, message: "获取用户列表失败" });
  }
});
// 获取单个用户详情
router.get("/users/:userId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    res.json({ code: 0, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ code: 1, message: "获取用户信息失败" });
  }
});

// 添加用户 (管理员可以添加普通用户或管理员)
router.post("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { phone, email, password, name, role = "user" } = req.body;

    // 验证必填字段
    if (!phone || !email || !password) {
      return res
        .status(400)
        .json({ code: 1, message: "手机号、邮箱和密码为必填项" });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: "手机号格式不正确" });
    }

    // 验证邮箱格式
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ code: 1, message: "邮箱格式不正确" });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({ code: 1, message: "密码长度不能少于6位" });
    }

    // 验证用户角色
    if (!["admin", "user", "staff"].includes(role)) {
      return res.status(400).json({ code: 1, message: "无效的用户角色" });
    }

    // 验证手机号和邮箱是否已被注册
    const existingUserByPhone = await User.findOne({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ code: 1, message: "手机号已被注册" });
    }

    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ code: 1, message: "邮箱已被注册" });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      phone,
      email,
      password: hashedPassword,
      name,
      role,
      status: "active",
      lastLoginAt: new Date(),
    });

    // 返回用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.status(201).json({
      code: 0,
      message: "添加用户成功",
      data: userData,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res
      .status(500)
      .json({ code: 1, message: "添加用户失败", error: error.message });
  }
});

// 修改用户信息
router.put("/users/:userId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, status, avatar } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    // 如果修改手机号，验证格式和唯一性
    if (phone && phone !== user.phone) {
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ code: 1, message: "手机号格式不正确" });
      }

      // 检查手机号是否已被占用
      const existingUserByPhone = await User.findOne({
        where: {
          phone,
          id: { [Op.ne]: userId },
        },
      });

      if (existingUserByPhone) {
        return res.status(400).json({ code: 1, message: "手机号已被占用" });
      }
    }

    // 如果修改邮箱，验证格式和唯一性
    if (email && email !== user.email) {
      // 验证邮箱格式
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ code: 1, message: "邮箱格式不正确" });
      }

      // 检查邮箱是否已被占用
      const existingUserByEmail = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingUserByEmail) {
        return res.status(400).json({ code: 1, message: "邮箱已被占用" });
      }
    }

    // 验证用户角色
    if (role && !["admin", "user", "staff"].includes(role)) {
      return res.status(400).json({ code: 1, message: "无效的用户角色" });
    }

    // 验证用户状态
    if (status && !["active", "inactive", "banned"].includes(status)) {
      return res.status(400).json({ code: 1, message: "无效的用户状态" });
    }

    // 更新用户信息
    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      role: role || user.role,
      status: status || user.status,
      avatar: avatar || user.avatar,
    });

    // 返回更新后的用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.json({
      code: 0,
      message: "用户信息更新成功",
      data: userData,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res
      .status(500)
      .json({ code: 1, message: "更新用户信息失败", error: error.message });
  }
});

// 重置用户密码
router.put(
  "/users/:userId/reset-password",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ code: 1, message: "新密码为必填项" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ code: 1, message: "密码长度不能少于6位" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ code: 1, message: "用户不存在" });
      }

      // 哈希新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await user.update({ password: hashedPassword });

      res.json({ code: 0, message: "密码重置成功" });
    } catch (error) {
      console.error("Reset password error:", error);
      res
        .status(500)
        .json({ code: 1, message: "密码重置失败", error: error.message });
    }
  }
);

// 更新用户状态（启用/禁用）
router.put(
  "/users/:userId/status",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!status || !["active", "inactive", "banned"].includes(status)) {
        return res.status(400).json({ code: 1, message: "状态值无效" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ code: 1, message: "用户不存在" });
      }

      // 防止管理员自己禁用自己
      if (
        user.id === req.userId &&
        (status === "inactive" || status === "banned")
      ) {
        return res
          .status(400)
          .json({ code: 1, message: "不能禁用当前登录的管理员账号" });
      }

      await user.update({ status });

      res.json({
        code: 0,
        message: "用户状态更新成功",
        data: { userId, status },
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res
        .status(500)
        .json({ code: 1, message: "更新用户状态失败", error: error.message });
    }
  }
);

// 删除用户
router.delete(
  "/users/:userId",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // 防止删除自己
      if (userId === req.userId) {
        return res
          .status(400)
          .json({ code: 1, message: "不能删除当前登录的管理员账号" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ code: 1, message: "用户不存在" });
      }

      // 检查用户是否有关联数据
      const orderCount = await Order.count({ where: { userId } });
      if (orderCount > 0) {
        return res.status(400).json({
          code: 1,
          message: "该用户有关联订单，无法直接删除，请考虑禁用该账号",
        });
      }

      await user.destroy();

      res.json({ code: 0, message: "用户删除成功" });
    } catch (error) {
      console.error("Delete user error:", error);
      res
        .status(500)
        .json({ code: 1, message: "删除用户失败", error: error.message });
    }
  }
);

// 搜索用户
router.get("/users/search", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { keyword, role, status } = req.query;
    const query = {};

    if (keyword) {
      query[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (role && ["admin", "user", "staff"].includes(role)) {
      query.role = role;
    }

    if (status && ["active", "inactive", "banned"].includes(status)) {
      query.status = status;
    }

    const users = await User.findAll({
      where: query,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({ code: 0, data: users });
  } catch (error) {
    console.error("Search users error:", error);
    res
      .status(500)
      .json({ code: 1, message: "搜索用户失败", error: error.message });
  }
});

// 获取用户订单历史
router.get(
  "/users/:userId/orders",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      const query = { userId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.findAll({
        where: query,
        order: [["createdAt", "DESC"]],
      });

      res.json({ code: 0, data: orders });
    } catch (error) {
      console.error("Get user orders error:", error);
      res
        .status(500)
        .json({ code: 1, message: "获取用户订单失败", error: error.message });
    }
  }
);

// 获取用户统计数据
router.get(
  "/users/statistics",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: "active" } });
      const inactiveUsers = await User.count({ where: { status: "inactive" } });
      const bannedUsers = await User.count({ where: { status: "banned" } });
      const adminCount = await User.count({ where: { role: "admin" } });
      const userCount = await User.count({ where: { role: "user" } });
      const staffCount = await User.count({ where: { role: "staff" } });

      // 今日注册用户数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRegistered = await User.count({
        where: {
          createdAt: {
            [Op.gte]: today,
          },
        },
      });

      res.json({
        code: 0,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          bannedUsers,
          adminCount,
          userCount,
          staffCount,
          todayRegistered,
        },
      });
    } catch (error) {
      console.error("Get user statistics error:", error);
      res
        .status(500)
        .json({
          code: 1,
          message: "获取用户统计数据失败",
          error: error.message,
        });
    }
  }
);


// 获取所有打印机
router.get("/printers", async (req, res) => {
  try {
    const printers = printerService.getAllPrinters();

    res.json({
      code: 0,
      data: printers,
      total: printers.length,
    });
  } catch (error) {
    console.error("Get printers error:", error);
    res.status(500).json({ code: 1, message: "获取打印机列表失败" });
  }
});

// 添加打印机到云端
router.post("/printers/add-to-cloud", async (req, res) => {
  try {
    const { sn, pkey, name } = req.body;

    // 验证参数
    if (!name || !sn || !pkey) {
      return res.status(400).json({
        code: 1,
        message: "打印机名称、终端号和终端密钥不能为空",
      });
    }

    const printerInfo = { sn, pkey, name };

    // 添加打印机到云端
    const result = await printerService.addPrinterToCloud(printerInfo);

    if (result.errorcode !== 0) {
      return res.status(400).json({
        code: 1,
        message: result.errormsg || "添加失败",
      });
    }

    res.json({
      code: 0,
      message: "添加成功",
      data: { sn, name },
    });
  } catch (error) {
    console.error("Add printer error:", error);
    res.status(500).json({
      code: 1,
      message: `添加打印机失败: ${error.message}`,
    });
  }
});

// 初始化所有打印机
router.post("/printers/initialize", async (req, res) => {
  try {
    console.log("初始化打印机:###############################");
    const results = await printerService.initializePrinters();
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      code: 0,
      message: `初始化完成，成功: ${success}，失败: ${failed}`,
      data: results,
    });
  } catch (error) {
    console.error("Initialize printers error:", error);
    res.status(500).json({
      code: 1,
      message: `初始化打印机失败: ${error.message}`,
    });
  }
});

// 添加打印路由 - 基于订单ID打印
// router.post("/orders/:id/print", async (req, res) => {
//   try {
//     const orderId = req.params.id;
    
//     // 使用传入的数据，或者从数据库重新加载订单数据
//     const orderData = req.body || {};
    
//     if (!orderData.order || !orderData.table || !orderData.items) {
//       // 如果没有传递完整数据，从数据库加载
//       const order = await Order.findByPk(orderId, {
//         include: [
//           { model: Table },
//         ],
//       });
      
//       if (!order) {
//         return res.status(404).json({ code: 1, message: "订单不存在" });
//       }
      
//       // 解析订单中的菜品信息
//       let items = [];
//       try {
//         items = JSON.parse(order.items);
//         if (!Array.isArray(items)) {
//           items = [];
//         }
//       } catch (e) {
//         console.error("解析订单菜品错误:", e);
//       }
      
//       // 准备打印数据
//       orderData.order = order;
//       orderData.table = order.Table;
//       orderData.items = items;
//     }
    
//     // 调用打印服务打印订单
//     const printResult = await printerService.printKitchenOrder(orderData);
    
//     res.json({
//       code: 0,
//       message: "打印请求已发送",
//       data: printResult
//     });
//   } catch (error) {
//     console.error("打印订单错误:", error);
//     res.status(500).json({
//       code: 1,
//       message: `打印订单失败: ${error.message}`
//     });
//   }
// });

// 添加打印路由 - 基于桌台ID打印
router.post("/tables/:tableId/print", async (req, res) => {
  try {
    console.log("打印请求:###############################");
    const tableId = req.params.tableId;

    // 找到桌台最新的活动订单
    const order = await Order.findOne({
      where: {
        tableId,
        status: ["ordering", "dining"],
      },
      include: [{ model: Table, as: "table" }],
      order: [["createdAt", "DESC"]],
    });

    if (!order) {
      return res.status(404).json({
        code: 1,
        message: "该桌台没有活动订单",
      });
    }

    // 处理订单中的菜品 - 确保items是数组
    let items = [];
    if (typeof order.items === "string") {
      try {
        // 先检查字符串是否以对象形式开头，避免重复解析
        if (
          order.items.trim().startsWith("{") ||
          order.items.trim().startsWith("[")
        ) {
          items = JSON.parse(order.items);
        } else {
          items = [];
        }
      } catch (e) {
        console.error("解析订单菜品错误:", e);
        items = [];
      }
    } else if (Array.isArray(order.items)) {
      items = order.items;
    } else if (order.items && typeof order.items === "object") {
      // 如果已经是对象，但不是数组，尝试转换
      items = [order.items];
    }

    // 确保items始终是数组
    if (!Array.isArray(items)) {
      items = [];
    }

    // 准备打印数据
    const printData = {
      order: order,
      table: order.table,
      items: items,
    };

    // 调用打印服务
    const printResult = await printerService.printKitchenOrder(printData);

    res.json({
      code: 0,
      message: "打印请求已发送",
      data: printResult,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: `打印订单失败: ${error.message}`,
    });
  }
});



module.exports = router;

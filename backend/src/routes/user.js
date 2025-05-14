const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models/db/database");
const { authenticateToken } = require("../middleware/auth");
const { generateAccessToken } = require("../middleware/auth");



// 用户注册
router.post("/register", async (req, res) => {
  try {
    const { phone, email, password, name } = req.body;

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
      role: "user",
      status: "active",
      lastLoginAt: new Date(),
    });

    // 返回用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.status(201).json({
      code: 0,
      message: "注册成功",
      data: userData,
    });
  } catch (error) {
    console.error("注册失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "注册失败", error: error.message });
  }
});

// 用户登录
router.post("/login", async (req, res) => {
  try {
    const { account, password } = req.body; // account 可以是手机号或邮箱

    if (!account || !password) {
      return res.status(400).json({ code: 1, message: "账号和密码为必填项" });
    }

    let user;
    // 判断输入的是手机号还是邮箱
    if (/^1[3-9]\d{9}$/.test(account)) {
      user = await User.findOne({ where: { phone: account } });
    } else if (/^\S+@\S+\.\S+$/.test(account)) {
      user = await User.findOne({ where: { email: account } });
    } else {
      return res.status(400).json({ code: 1, message: "账号格式不正确" });
    }

    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    // 检查用户状态
    if (user.status === "banned") {
      return res
        .status(403)
        .json({ code: 1, message: "账号已被禁用，请联系管理员" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ code: 1, message: "密码错误" });
    }
    // 如果验证成功，生成访问令牌
    const token = generateAccessToken(user.id);

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 返回用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.json({
      code: 0,
      message: "登录成功",
      data: {
        userData,
        token,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "登录失败", error: error.message });
  }
});

// 获取当前用户信息
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    // 返回用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.json({ code: 0, data: userData });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "获取用户信息失败", error: error.message });
  }
});

// 更新用户信息
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    // 如果要更新邮箱，需要检查邮箱是否已被占用
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(400).json({ code: 1, message: "邮箱已被占用" });
      }
    }

    // 更新用户信息
    await user.update({
      name: name || user.name,
      email: email || user.email,
      avatar: avatar || user.avatar,
    });

    // 返回更新后的用户信息（排除密码）
    const userData = user.get({ plain: true });
    delete userData.password;

    res.json({
      code: 0,
      message: "更新成功",
      data: userData,
    });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "更新用户信息失败", error: error.message });
  }
});

// 修改密码
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ code: 1, message: "旧密码和新密码为必填项" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ code: 1, message: "新密码长度不能少于6位" });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ code: 1, message: "原密码错误" });
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await user.update({ password: hashedPassword });

    res.json({ code: 0, message: "密码修改成功" });
  } catch (error) {
    console.error("修改密码失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "修改密码失败", error: error.message });
  }
});

// 找回密码（发送验证码）
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ code: 1, message: "请输入手机号" });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ code: 1, message: "该手机号未注册" });
    }

    // 这里可以生成验证码并发送短信
    // 为了演示，我们假设验证码是 "123456"
    const verificationCode = "123456";

    // 实际项目中，这里需要调用短信服务API发送验证码

    res.json({
      code: 0,
      message: "验证码已发送到您的手机",
      // 实际项目中不应返回验证码，这里仅作演示
      data: { verificationCode },
    });
  } catch (error) {
    console.error("找回密码失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "找回密码失败", error: error.message });
  }
});

// 重置密码
router.post("/reset-password", async (req, res) => {
  try {
    const { phone, verificationCode, newPassword } = req.body;

    if (!phone || !verificationCode || !newPassword) {
      return res
        .status(400)
        .json({ code: 1, message: "手机号、验证码和新密码为必填项" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ code: 1, message: "新密码长度不能少于6位" });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ code: 1, message: "用户不存在" });
    }

    // 验证验证码
    // 实际项目中应该从缓存或数据库中获取验证码进行对比
    if (verificationCode !== "123456") {
      return res.status(400).json({ code: 1, message: "验证码错误或已过期" });
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await user.update({ password: hashedPassword });

    res.json({ code: 0, message: "密码重置成功" });
  } catch (error) {
    console.error("重置密码失败:", error);
    res
      .status(500)
      .json({ code: 1, message: "重置密码失败", error: error.message });
  }
});

// 用户注销
router.post("/logout", authenticateToken, (req, res) => {
  // 在实际项目中，可能需要使令牌无效或清除会话
  res.json({ code: 0, message: "注销成功" });
});



module.exports = router;

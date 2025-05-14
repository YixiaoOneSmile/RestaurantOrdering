const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// 生成访问令牌
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '24h' });
};

// 验证令牌中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 1, message: '未提供认证令牌' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ code: 1, message: '令牌无效或已过期' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// 管理员权限中间件
const isAdmin = async (req, res, next) => {
  try {
    const { User } = require('../models/db/database');
    const user = await User.findByPk(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 1, message: '没有管理员权限' });
    }
    
    next();
  } catch (error) {
    console.error('权限验证失败:', error);
    res.status(500).json({ code: 1, message: '权限验证失败' });
  }
};

module.exports = {
  generateAccessToken,
  authenticateToken,
  isAdmin
};
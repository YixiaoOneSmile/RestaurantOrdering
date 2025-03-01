require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const initializeDatabase = require('./utils/initDb');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/order');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/admin', adminRoutes);
app.use('/api', orderRoutes);

async function startServer() {
  try {
    // 确保数据库目录存在
    const dbDir = path.join(__dirname, '../db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接已建立');

    // 初始化数据库
    await initializeDatabase();

    // 启动服务器
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer(); 
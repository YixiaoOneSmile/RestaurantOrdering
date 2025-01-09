require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/order'));

// 错误处理
app.use((err,res) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
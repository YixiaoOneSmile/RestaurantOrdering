const express = require('express');
const cors = require('cors');
const adminRouter = require('./routes/admin');
const orderRouter = require('./routes/order');

const app = express();

app.use(cors());
app.use(express.json());

// 注册路由
app.use('/api/admin', adminRouter);
app.use('/api/order', orderRouter);

module.exports = app; 
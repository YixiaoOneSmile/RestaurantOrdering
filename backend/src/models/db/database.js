const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || path.join(__dirname, '../../db/restaurant.sqlite'),
  logging: false
});

const MenuItem = require('./MenuItem')(sequelize);
const Order = require('./Order')(sequelize);
const Table = require('./Table')(sequelize);

// 定义关联关系
Order.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });
Table.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });

module.exports = {
  sequelize,
  MenuItem,
  Order,
  Table
}; 
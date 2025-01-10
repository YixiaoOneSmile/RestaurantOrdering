const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    peopleCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    items: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('items');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('items', JSON.stringify(value));
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ordering',
      validate: {
        isIn: [['ordering', 'dining', 'completed']]
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    remarks: {
      type: DataTypes.STRING
    },
    paymentMethod: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['cash', 'wechat', 'alipay']]
      }
    },
    paidAt: {
      type: DataTypes.DATE
    },
    servedAt: {
      type: DataTypes.DATE
    }
  });

  return Order;
}; 
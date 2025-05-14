const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Printer = sequelize.define("printer", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "打印机名称",
  },
  terminal: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "打印机编号(SN)",
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "打印机密钥(PKEY)",
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  lastUsedAt: {
    type: DataTypes.DATE,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Printer;

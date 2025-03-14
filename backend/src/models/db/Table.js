const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Table = sequelize.define('Table', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'empty',
      validate: {
        isIn: [['empty', 'ordering', 'dining']]
      }
    },
    qrCodeUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Table;
}; 
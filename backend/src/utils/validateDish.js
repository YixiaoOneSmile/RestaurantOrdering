function validateDish(dishData) {
  const { name, nameCN, nameJP, price, currency, categoryId, image } = dishData;

  // 验证必填字段
  if (!name || !nameCN || !nameJP || !image) {
    return {
      code: 1,
      message: '菜品名称(中英日)和图片URL为必填项'
    };
  }

  // 验证价格
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    return {
      code: 1,
      message: '价格必须是大于0的数字'
    };
  }

  // 验证货币类型
  const validCurrencies = ['CNY', 'JPY', 'USD'];
  if (!currency || !validCurrencies.includes(currency)) {
    return {
      code: 1,
      message: '货币单位必须是CNY、JPY或USD'
    };
  }

  // 验证分类ID
  const validCategories = [1, 2, 3, 4]; // 热菜、凉菜、主食、饮品
  if (!categoryId || !validCategories.includes(Number(categoryId))) {
    return {
      code: 1,
      message: '分类ID必须是1-4之间的整数'
    };
  }

  // 验证通过
  return null;
}

module.exports = {
  validateDish
};
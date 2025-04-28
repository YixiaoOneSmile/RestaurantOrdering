import request from "../request";

/**
 * 验证桌号是否有效
 * @param {string|number} tableId 桌号
 * @param {function} next 路由跳转函数
 * @returns {Promise<boolean>} 验证结果
 */
const validateTableId = async (tableId, next) => {
  try {
    // 向后端验证桌号是否存在
    const response = await request.get(`/api/tables/${tableId}/validate`);
    if (response && response.valid) {
      next(); // 验证成功，继续路由
      return true;
    } else {
      next("/"); // 验证失败，重定向到首页
      return false;
    }
  } catch (error) {
    console.error("验证桌号失败:", error);
    next("/"); // 发生错误，重定向到首页
    return false;
  }
};

export default validateTableId;

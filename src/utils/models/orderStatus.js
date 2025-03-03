export function getStatusType(status) {
  const typeMap = {
    ordering: 'info',
    processing: 'warning',
    dining: 'success',
    completed: 'success'
  }
  return typeMap[status] || 'info'
}

export function getStatusText(status) {
  const textMap = {
    ordering: '已下单',
    processing: '处理中',
    dining: '就餐中',
    completed: '已完成'
  }
  return textMap[status] || '未知状态'
}

export function getPaymentMethodText(method) {
  const methodMap = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝'
  }
  return methodMap[method] || '未知方式'
}
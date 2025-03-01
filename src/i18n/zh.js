export default {
  common: {
    confirm: '确定',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    loading: '加载中...',
    success: '成功',
    failed: '失败',
    languageChanged: '语言切换成功',
    refresh: '刷新',
    to: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    currency: '{amount} C¥',
    tip: '提示',
    remove: '删除',
    action: '操作'
  },
  menu: {
    title: '餐厅管理系统',
    tables: '桌台管理',
    tableSettings: '桌台设置',
    dishes: '菜品管理',
    orders: '订单记录'
  },
  table: {
    number: '桌号',
    capacity: '容纳人数',
    status: '状态',
    operations: '操作',
    empty: '空闲',
    dining: '就餐中',
    ordering: '点餐中',
    qrCode: '点餐码',
    addTable: '添加桌台',
    editTable: '编辑桌台',
    deleteTable: '删除桌台',
    scanToOrder: '扫码点餐',
    numberFormat: '{number}号桌',
    viewQRCode: '查看点餐码',
    unknownStatus: '未知状态',
    selectTableFirst: '请先选择桌台',
    people: '人',
    addSuccess: '添加桌台成功',
    numberExists: '该桌号已存在'
  },
  order: {
    orderNo: '订单号',
    tableNo: '桌号',
    items: '菜品',
    amount: '金额',
    status: '状态',
    orderTime: '下单时间',
    paymentMethod: '支付方式',
    paymentTime: '支付时间',
    checkout: '结账',
    orderDetails: '订单详情',
    addDish: '加菜',
    quantity: '数量',
    total: '合计',
    details: '订单详情',
    startTime: '开始时间',
    consumptionAmount: '消费金额',
    checkoutTitle: '订单结账',
    confirmCheckout: '确认结账',
    completedTime: '完成时间',
    complete: '完成订单',
    noOrderInfo: '暂无订单信息',
    statusTypes: {
      ordering: '点餐中',
      processing: '处理中',
      dining: '就餐中',
      completed: '已完成'
    },
    selectedItems: '已选{count}件',
    viewOrdered: '查看已点',
    submit: '提交订单',
    originalItems: '原始菜品',
    appendedItems: '追加菜品',
    deleteItem: '删除菜品',
    deleteConfirm: '确认删除该菜品?',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败'
  },
  dishes: {
    add: '添加菜品',
    edit: '编辑菜品',
    delete: '删除菜品',
    name: '菜品名称',
    price: '价格',
    category: '分类',
    image: '图片',
    currency: '货币单位',
    currencies: {
      CNY: '人民币 (¥)',
      JPY: '日元 (¥)',
      USD: '美元 ($)'
    },
    categories: {
      hot: '热菜',
      cold: '凉菜',
      staple: '主食',
      beverage: '饮品'
    }
  },
  payment: {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝'
  },
  restaurant: {
    name: '美味餐厅'
  }
} 
# 餐厅点餐系统

这是一个基于 Vue.js 和 Node.js 开发的智能餐厅点餐系统,支持扫码点餐、订单管理、菜品管理等功能。

## 主要功能

- 扫码点餐: 顾客通过扫描桌面二维码进入点餐页面
- 菜品管理: 支持添加、编辑、删除菜品,设置价格和分类
- 桌台管理: 管理餐厅桌台信息,生成桌台二维码
- 订单管理: 查看订单历史,处理当前订单
- 多语言支持: 支持中文和英文、日文界面切换

## 技术栈

- 前端: Vue.js + Element UI
- 后端: Node.js + Express
- 数据库: SQLite（backend中的models与config是MongoDB中的相关文件）

## 运行说明
### 前端服务
1. 进入前端目录
```
cd src
```
2. 安装依赖
```
pnpm install
```
3. 运行开发环境
```
pnpm run serve
```

### 后端服务
1. 进入后端目录
```
cd backend
```
2. 安装依赖
```
pnpm install
```
3. 运行开发环境
```
pnpm start
```

### 注意事项
1. 请确保后端服务和前端服务都已成功运行
2. 请根据实际情况调整后端服务的端口号
3. 请根据实际情况调整前端服务的API地址

# 需添加功能

- 添加多语言菜品 单位日元
- 多人点餐 反馈 UI 气泡
- AA 付餐形式
- 打印 机
- 账单 收入

- 支付 第三方
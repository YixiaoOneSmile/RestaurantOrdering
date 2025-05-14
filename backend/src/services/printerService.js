const axios = require("axios");
const crypto = require("crypto");

// 打印机配置（写死在代码中）
const PRINTER_CONFIG = {
  appid: "sp681c4afa05b68", // 替换为你的速打云应用ID
  appsecret: "689c8fffaf029c6202b89b2cf3f32159", // 替换为你的速打云应用密钥
  printers: [
    {
      sn: "1929160288", // 打印机编号
      pkey: "46q8mwnd", // 打印机密钥
      name: "启梦", // 打印机名称
    },
  ],
};

class PrinterService {
  constructor() {
    this.baseUrl = "https://open.spyun.net/v1/printer";
    this.config = PRINTER_CONFIG;
  }

  // 生成签名
  generateSign(params) {
    // 1. 过滤空值参数
    const filteredParams = {};
    for (const key in params) {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        (params[key] !== "" || params[key] === 0)
      ) {
        filteredParams[key] = params[key];
      }
    }

    // 2. 参数按照键名升序排列
    const sortedKeys = Object.keys(filteredParams).sort();

    // 3. 按照key=value&key=value格式拼接字符串
    let stringA = sortedKeys
      .map((key) => `${key}=${filteredParams[key]}`)
      .join("&");
    
    console.log("stringA---------------------:", stringA);
    
    // 4. 拼接appsecret
    const stringSignTemp = stringA + "&appsecret=" + this.config.appsecret;
    console.log("stringSignTemp---------------------:", stringSignTemp);

    // 5. MD5哈希并转为大写
    return crypto
      .createHash("md5")
      .update(stringSignTemp)
      .digest("hex")
      .toUpperCase();
  }

  // 添加打印机到速打云
  async addPrinterToCloud(printerInfo) {
    try {
      const { sn, pkey, name } = printerInfo;
      const timestamp = Math.floor(Date.now() / 1000);

      const data = {
        appid: this.config.appid,
        timestamp,
        sn,
        pkey,
        name,
      };

      // 生成签名
      const sign = this.generateSign(data);
      data.sign = sign;
      console.log("打印机添加云服务参数--------------:", data);
      // 发送请求
      const response = await axios({
        method: "post",
        url: "https://open.spyun.net/v1/printer/add",
        data: new URLSearchParams(data), // 使用URLSearchParams转换为form格式
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      console.error("打印机添加云服务错误:", error.response.data);
      throw error;
    }
  }

  // 获取所有打印机
  getAllPrinters() {
    return this.config.printers.map((printer) => ({
      id: printer.sn,
      name: printer.name,
      sn: printer.sn,
      pkey: printer.pkey,
      createdAt: new Date(), // 对于硬编码配置，可以使用默认时间
    }));
  }

  // 打印厨房订单
  async printKitchenOrder(orderData) {
    try {
      const { order, table, items } = orderData;

      // 构建打印内容
      let content = `<C><L2>${
        this.config.restaurantName || "美味餐厅"
      }</L2></C>\n`;
      content += "<BR>\n";
      content += "<C><L1>===厨房订单===</L1></C>\n";
      content += "<BR>\n";
      content += `<B>桌号: ${table.number}号桌</B>\n`;
      content += "<BR>\n";
      content += `订单号: ${order.id || order.orderNo || "未知"}\n`;
      content += `下单时间: ${this.formatDate(
        order.createdAt || new Date()
      )}\n`;
      content += "<BR>\n";
      content += "--------------------------------\n";
      content += "<BR>\n";

      // 添加菜品信息（厨房单更注重菜品名称和数量）
      for (const item of items) {
        content += `<L1>${item.name} x${item.quantity}</L1>\n`;
        content += "<BR>\n";

        // 如果有备注，显示备注
        if (item.remark) {
          content += `备注: ${item.remark}\n`;
          content += "<BR>\n";
        }
      }

      content += "--------------------------------\n";
      content += "<BR>\n";
      content +=
        "<R>共 " +
        items.reduce((sum, item) => sum + item.quantity, 0) +
        " 件商品</R>\n";
      content += "<BR>\n";

      if (order.remark) {
        content += "<BR>\n";
        content += `<B>整单备注: ${order.remark}</B>\n`;
        content += "<BR>\n";
      }

      content += "<CUT>\n";

      // 获取厨房打印机或使用传入的打印机
      const printer =
        orderData.printer ||
        this.config.kitchenPrinter ||
        this.config.printers[0];

      // 打印内容
      return this.printOrder({
        sn: printer.sn,
        content: content,
        times: 1,
      });
    } catch (error) {
      console.error("打印厨房订单错误:", error);
      throw error;
    }
  }

  // 辅助函数：格式化日期
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // 辅助函数：右侧补空格
  padRight(str, length) {
    return String(str).padEnd(length, " ");
  }

  // 辅助函数：左侧补空格
  padLeft(str, length) {
    return String(str).padStart(length, " ");
  }

  // 辅助函数：获取支付方式文本
  getPaymentMethodText(method) {
    const methodMap = {
      cash: "现金",
      wechat: "微信支付",
      alipay: "支付宝",
    };
    return methodMap[method] || method;
  }

  // 获取打印机信息
  async getPrinterInfo(sn) {
    try {
      // 获取当前时间戳（10位，精确到秒）
      const timestamp = Math.floor(Date.now() / 1000);

      // 构造请求参数
      const params = {
        appid: this.config.appid,
        timestamp,
        sn,
      };

      // 生成签名
      const sign = this.generateSign(params);
      params.sign = sign;

      // 发送GET请求获取打印机信息
      const response = await axios.get(`${this.baseUrl}/info`, {
        params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      console.error("获取打印机信息错误:", error);
      throw error;
    }
  }

  // 打印订单
  async printOrder(orderData) {
    try {
      const { sn, content, times = 1 } = orderData;

      // 验证必填参数
      if (!sn) {
        throw new Error("打印机编号(sn)不能为空");
      }

      if (!content) {
        throw new Error("打印内容(content)不能为空");
      }

      // 验证内容长度
      const contentBytes = Buffer.byteLength(content, "utf8");
      if (contentBytes > 5000) {
        throw new Error("打印内容超过5000字节限制");
      }

      // 验证打印次数
      const printTimes = Number(times);
      if (isNaN(printTimes) || printTimes < 1 || printTimes > 5) {
        throw new Error("打印次数必须在1-5之间");
      }

      // 获取当前时间戳（10位，精确到秒）
      const timestamp = Math.floor(Date.now() / 1000);

      // 构造请求参数
      const data = {
        appid: this.config.appid,
        timestamp,
        sn,
        content,
        times: printTimes,
      };

      // 生成签名
      const sign = this.generateSign(data);
      data.sign = sign;

      // 发送POST请求打印订单
      const response = await axios({
        method: "post",
        url: "https://open.spyun.net/v1/printer/print",
        data: new URLSearchParams(data),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      console.error("打印订单错误:", error);
      throw error;
    }
  }

  // 初始化打印机（将所有配置的打印机添加到云服务）
  async initializePrinters() {
    try {
      const results = [];

      // 使用配置文件中的打印机信息
      for (const printer of this.config.printers) {
        try {
          console.log(`正在添加打印机: ${printer.name} (${printer.sn})`);

          const result = await this.addPrinterToCloud({
            sn: printer.sn,
            pkey: printer.pkey,
            name: printer.name,
          });

          results.push({
            printer,
            success: result.errorcode === 0,
            message: result.errormsg || "添加成功",
          });
        } catch (error) {
          console.error(`添加打印机 ${printer.name} 失败:`, error.message);
          results.push({
            printer,
            success: false,
            message: error.message || "添加失败",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("初始化打印机错误:", error);
      throw error;
    }
  }
}

module.exports = new PrinterService();

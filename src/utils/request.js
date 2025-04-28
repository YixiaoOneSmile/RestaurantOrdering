import axios from 'axios'
import { Message } from 'element-ui'

const request = axios.create({
  baseURL: process.env.VUE_APP_URL,
  timeout: 5000
})

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    if (error.response) {
      Message.error(error.response.data.message || '请求失败，请稍后重试')
    } else if (error.request) {
      Message.error('网络连接失败，请检查网络')
    } else {
      Message.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default request 
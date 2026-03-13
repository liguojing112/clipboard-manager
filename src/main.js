// src/main.js
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
  // 可选：ElMessage.error('插件遇到问题，已记录日志')
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理 Promise 拒绝:', event.reason)
})

import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'  // 按需导入常用语言
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'

// 注册语言（按你常用添加，越多包越大）
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
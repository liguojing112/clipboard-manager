# Clipboard Manager - 智能剪贴板管理器

一款专为开发者、运维、办公族设计的浏览器扩展（Edge/Chrome）。  
把日常敲的命令、代码片段、Markdown、SQL 存起来，随时搜索、分类、高亮、复制。**全部本地存储，零云端，零追踪**。

## 核心功能
- 本地 IndexedDB 存储，容量无上限，隐私安全
- 自定义分类 + 颜色标签
- 模糊搜索 + 关键词高亮
- 卡片/列表视图切换
- 深色模式（跟随系统或手动）
- 代码语法高亮（JS、Python、Shell、SQL 等）
- JSON 导入/导出（带预览 & 合并确认）
- 删除确认 & 一键清空缓存
- 设置页（默认视图、主题偏好）支持跨设备同步

## 技术栈
- Vue 3 + Composition API
- Vite 构建
- Element Plus UI
- Dexie.js（IndexedDB 封装）
- highlight.js（语法高亮）
- chrome.storage.sync（设置跨设备同步）

## 开发安装
1. Clone 项目
   ```bash
   git clone https://github.com/你的用户名/clipboard-manager.git
   cd clipboard-manager
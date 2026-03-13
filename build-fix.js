// build-fix.js
const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, 'dist')
const optionsHtml = path.join(distDir, 'options.html')
const optionsJs = path.join(distDir, 'assets', 'options.js') // 假设打包后路径

// 运行 build 后执行这个脚本
console.log('修复 options.html...')

if (fs.existsSync(optionsHtml)) {
  let html = fs.readFileSync(optionsHtml, 'utf-8')

  // 如果是空白，替换成你的完整 HTML
  if (html.includes('simulated preview') || html.trim() === '') {
    html = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clipboard Manager - 设置</title>
  <link rel="stylesheet" href="assets/index.css"> <!-- 如果有全局样式 -->
</head>
<body>
  <div id="app"></div>
  <script type="module" src="assets/options.js"></script> <!-- 手动指定打包后的 js -->
</body>
</html>
    `
    fs.writeFileSync(optionsHtml, html)
    console.log('options.html 已修复')
  }
} else {
  console.log('dist/options.html 不存在，检查 vite.config')
}
// src/background.js
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // 打开 popup（Manifest V3 默认行为）
    chrome.action.openPopup?.() // Chrome 109+ 支持，Edge 也行
  } else if (command === 'copy-last-item') {
    // 未来扩展：从 storage 取最近一条复制
    console.log('快捷键复制最近片段')
    // 可以用 chrome.storage.local.get 存最后复制的 id
  }
})
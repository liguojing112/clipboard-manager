<template>
  <el-config-provider :locale="zhCn">
    <el-container style="height: 100vh;">
      <el-header>
        <h2>Clipboard Manager 设置</h2>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>外观</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="默认视图">
              <el-radio-group v-model="settings.defaultView">
                <el-radio value="card">卡片视图</el-radio>
                <el-radio value="list">列表视图</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="主题">
              <el-radio-group v-model="settings.themeMode">
                <el-radio value="system">跟随系统</el-radio>
                <el-radio value="light">浅色</el-radio>
                <el-radio value="dark">深色</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 16px;">
          <template #header>
            <span>快捷键</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="打开插件">
              <el-tag>Ctrl+Shift+Y</el-tag>
            </el-form-item>
            <el-form-item label="复制最近">
              <el-tag>Ctrl+Shift+C</el-tag>
            </el-form-item>
          </el-form>
        </el-card>

        <div style="margin-top: 24px;">
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
          <span v-if="syncHint" :class="['sync-hint', `sync-hint-${syncHintType}`]">{{ syncHint }}</span>
        </div>

        <el-form-item style="margin-top: 16px;">
          <el-button type="danger" plain @click="clearCache">清理缓存（删除所有本地数据）</el-button>
        </el-form-item>
      </el-main>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'
import { loadSettings, saveSettings as persistSettings } from './settings.js'
import { db } from './db.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const saving = ref(false)
const syncHint = ref('')
const syncHintType = ref('success')
const settings = reactive({
  defaultView: 'card',
  themeMode: 'system'
})

let systemThemeMediaQuery = null
let handleSystemThemeChange = null
let syncHintTimer = null

onMounted(async () => {
  const data = await loadSettings()
  settings.defaultView = data.defaultView
  settings.themeMode = data.themeMode
  applyTheme(settings.themeMode)
})

onBeforeUnmount(() => {
  cleanupSystemThemeListener()

  if (syncHintTimer) {
    clearTimeout(syncHintTimer)
  }
})

const showSyncHint = (message = '已同步到浏览器', type = 'success') => {
  syncHint.value = message
  syncHintType.value = type

  if (syncHintTimer) {
    clearTimeout(syncHintTimer)
  }

  syncHintTimer = window.setTimeout(() => {
    syncHint.value = ''
    syncHintTimer = null
  }, 1800)
}

const cleanupSystemThemeListener = () => {
  if (!systemThemeMediaQuery || !handleSystemThemeChange) return

  if (typeof systemThemeMediaQuery.removeEventListener === 'function') {
    systemThemeMediaQuery.removeEventListener('change', handleSystemThemeChange)
  } else if (typeof systemThemeMediaQuery.removeListener === 'function') {
    systemThemeMediaQuery.removeListener(handleSystemThemeChange)
  }

  systemThemeMediaQuery = null
  handleSystemThemeChange = null
}

const applyTheme = (theme) => {
  cleanupSystemThemeListener()

  if (theme === 'system') {
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    handleSystemThemeChange = (event) => {
      document.documentElement.classList.toggle('dark', event.matches)
    }

    document.documentElement.classList.toggle('dark', systemThemeMediaQuery.matches)

    if (typeof systemThemeMediaQuery.addEventListener === 'function') {
      systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (typeof systemThemeMediaQuery.addListener === 'function') {
      systemThemeMediaQuery.addListener(handleSystemThemeChange)
    }
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const result = await persistSettings({
      defaultView: settings.defaultView,
      themeMode: settings.themeMode
    })
    applyTheme(settings.themeMode)
    showSyncHint(
      result.status === 'synced' ? '已同步到浏览器' : '同步失败，已保存在本机',
      result.status === 'synced' ? 'success' : 'warning'
    )
  } catch (err) {
    ElMessage.error('保存失败：' + err.message)
  } finally {
    saving.value = false
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '将删除本机缓存（本地设置、分类和指令数据）。此操作不可撤销，是否继续？',
      '确认清理缓存',
      {
        confirmButtonText: '确认清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await db.open()
    await db.items.clear()
    await db.categories.clear()

    await new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        const error = chrome.runtime?.lastError
        if (error) {
          reject(new Error(error.message))
          return
        }
        resolve()
      })
    })

    showSyncHint('本机缓存已清理', 'success')
    ElMessage.success('本机缓存已清理')
  } catch (err) {
    if (err === 'cancel') return
    ElMessage.error('清理缓存失败：' + err.message)
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sync-hint {
  margin-left: 12px;
  font-size: 12px;
}

.sync-hint-success {
  color: #67c23a;
}

.sync-hint-warning {
  color: #e6a23c;
}
</style>

<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px" min-width style="background: var(--el-bg-color-page); border-right: 1px solid var(--el-border-color)">
      <div style="padding: 16px;">
        <h3>分类</h3>
        <el-menu :default-active="activeCategory" @select="handleCategorySelect">
          <el-menu-item index="all">全部</el-menu-item>
          <el-menu-item v-for="cat in categories" :key="cat.id" :index="cat.name">
            <div style="display: flex; align-items: center; flex: 1; overflow: hidden;">
              <el-tooltip :content="cat.name" placement="top">
                <el-tag :color="cat.color" effect="dark" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ cat.name }}</el-tag>
              </el-tooltip>
              <el-button type="text" size="small" @click.stop="editCategory(cat)">编辑</el-button>
              <el-button type="text" size="small" @click.stop="deleteCategory(cat)">删除</el-button>
            </div>
          </el-menu-item>
        </el-menu>
        <el-button type="primary" plain @click="addCategory" style="margin-top: 16px; width: 100%;">
          + 添加分类
        </el-button>
      </div>
    </el-aside>

    <el-main>
      <el-input
        v-model="searchQuery"
        placeholder="搜索标题、内容或分类..."
        clearable
        style="margin-bottom: 16px;"
      />

      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
  <div style="display: flex; gap: 12px; flex-wrap: wrap;">
    <el-button type="primary" @click="exportData">导出数据 (JSON)</el-button>
    <el-button type="success" @click="triggerImport">导入数据</el-button>
    <input type="file" accept=".json" ref="importInputRef" style="display: none;" @change="handleImport" />
  </div>

  <div style="display: flex; align-items: center; gap: 12px;">
    <el-select v-model="sortBy" placeholder="排序方式" size="small" style="width: 140px;">
      <el-option label="更新时间（最新）" value="updated-desc"></el-option>
      <el-option label="更新时间（最旧）" value="updated-asc"></el-option>
      <el-option label="创建时间（最新）" value="created-desc"></el-option>
      <el-option label="创建时间（最旧）" value="created-asc"></el-option>
      <el-option label="标题（A-Z）" value="title-asc"></el-option>
      <el-option label="标题（Z-A）" value="title-desc"></el-option>
    </el-select>

    <el-select v-model="themeMode" placeholder="主题模式" size="small" style="width: 120px;">
      <el-option label="跟随系统" value="system"></el-option>
      <el-option label="浅色" value="light"></el-option>
      <el-option label="深色" value="dark"></el-option>
    </el-select>

    <el-radio-group v-model="viewMode" size="small">
      <el-radio-button value="card">卡片视图</el-radio-button>
      <el-radio-button value="list">列表视图</el-radio-button>
    </el-radio-group>
    <el-button size="small" @click="openOptionsPage">设置</el-button>
    <span v-if="syncHint" :class="['sync-hint', `sync-hint-${syncHintType}`]">{{ syncHint }}</span>
    <el-button type="danger" size="small" style="margin-left: 12px;" @click="clearAllData">清空所有数据</el-button>
  </div>
</div>

      <el-empty v-if="filteredItems.length === 0" description="暂无内容，点击下方添加" />

      <div :class="['item-list', viewMode === 'card' ? 'card-mode' : 'list-mode']">
        <div v-for="item in filteredItems" :key="item.id" :class="['item-wrapper', viewMode]">
          <!-- 卡片模式 -->
          <el-card v-if="viewMode === 'card'" class="item-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-tag :color="item.color || '#409EFF'" effect="dark" v-html="highlightText(item.title)"></el-tag>
                <span class="category-tag">{{ item.category || '未分类' }}</span>
              </div>
            </template>
            <!-- 卡片模式预览（截断 + 高亮） -->
            <div class="content-preview">
              <pre><code v-html="highlightedPreview(item.content)"></code></pre>
            </div>
            <div class="actions">
              <el-button type="primary" size="small" @click="copyToClipboard(item.content)">复制</el-button>
              <el-button size="small" @click="editItem(item)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteItem(item)">删除</el-button>
            </div>
          </el-card>

          <!-- 列表模式 -->
          <div v-else class="list-item">
            <div class="list-title">
              <el-tag :color="item.color || '#409EFF'" effect="dark" v-html="highlightText(item.title)"></el-tag>
              <span class="category-tag">{{ item.category || '未分类' }}</span>
            </div>
            <!-- 列表模式完整内容（高亮） -->
            <div class="list-content">
              <pre><code v-html="highlightedFull(item.content)"></code></pre>
            </div>
            <div class="list-actions">
              <el-button type="primary" size="small" @click="copyToClipboard(item.content)">复制</el-button>
              <el-button size="small" @click="editItem(item)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteItem(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-button type="success" circle class="fab" @click="addItem">+</el-button>
    </el-main>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑指令' : '添加指令'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="必填" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="粘贴你的命令/代码" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择或新增" style="width: 100%;">
            <el-option v-for="cat in categories" :key="cat.name" :label="cat.name" :value="cat.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
    <!-- 添加分类对话框 -->
    <el-dialog v-model="addCategoryDialog" title="添加新分类" width="400px">
      <el-form :model="newCategory" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newCategory.name" placeholder="如：Python 脚本" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="newCategory.color" />
        </el-form-item>
        <!-- 图标暂时文本输入，未来可做选择器 -->
        <el-form-item label="图标">
          <el-input v-model="newCategory.icon" placeholder="如：code / database" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑分类对话框 -->
    <el-dialog v-model="editCategoryDialog" title="编辑分类" width="400px">
      <el-form :model="editingCategory" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editingCategory.name" placeholder="新名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="editingCategory.color" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="editingCategory.icon" placeholder="如：code" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditCategory">保存</el-button>
      </template>
    </el-dialog>

  </el-container>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount, computed, watch, h } from 'vue'
import hljs from 'highlight.js/lib/core'
import { db } from './db.js'
import { loadSettings, saveSettings as persistSettings } from './settings.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const highlightText = (text) => {
  if (!searchQuery.value.trim()) return text
  const safeQuery = searchQuery.value.replace(/[.*+?^${}()|[\]]/g, '\\$&')
  const regex = new RegExp(`(${safeQuery})`, 'gi')
  return text.replace(regex, '<span style="background: yellow; color: black; padding: 1px 2px; border-radius: 2px;">$1</span>')
}

const highlightedPreview = (content) => {
  if (!content) return ''
  const preview = content.substring(0, 120) + (content.length > 120 ? '...' : '')
  return highlightText(preview)
}

const highlightedFull = (content) => {
  if (!content) return ''
  return highlightText(content)
}

// 一键清空所有数据，带二次确认和恢复默认分类
const clearAllData = () => {
  ElMessageBox.prompt(
    '此操作将**永久删除**所有分类和指令，无法恢复！<br>请输入“确认清空”继续：',
    '危险操作警告',
    {
      confirmButtonText: '我确定要清空',
      cancelButtonText: '取消',
      type: 'error',
      inputPattern: /^确认清空$/,  // 正则强制输入必须完全匹配“确认清空”
      inputErrorMessage: '输入必须为“确认清空”',
      dangerouslyUseHTMLString: true,  // 允许 HTML 加粗红色
      inputPlaceholder: '请输入：确认清空',
      inputValidator: (value) => {
        if (value !== '确认清空') {
          return '输入不匹配，请重新输入“确认清空”'
        }
        return true
      }
    }
  ).then(async () => {
    try {
      await db.categories.clear()
      await db.items.clear()
      
      categories.value = []
      allItems.value = []
      filteredItems.value = []
      
      // 恢复默认分类（如果有这个方法）
      if (typeof db.initDefaultCategories === 'function') {
        await db.initDefaultCategories()
        categories.value = await db.categories.toArray()
      }
      
      filterItems()
      ElMessage.success('所有数据已清空，默认分类已恢复')
    } catch (err) {
      console.error('清空失败:', err)
      ElMessage.error('清空失败，请检查控制台')
    }
  }).catch((action) => {
    if (action === 'cancel') {
      ElMessage.info('已取消清空操作')
    }
  })
}

const categories = ref([])
const allItems = ref([])
const filteredItems = ref([])
const searchQuery = ref('')
const activeCategory = ref('all')
const dialogVisible = ref(false)
const form = ref({
  id: null,
  title: '',
  content: '',
  category: '',
  color: '#409EFF',
  createdAt: 0,
  updatedAt: 0
})

const viewMode = ref('card') // 视图切换，默认卡片视图
const themeMode = ref('system')
const syncHint = ref('')
const syncHintType = ref('success')

const sortBy = ref('updated-desc')  // 默认按更新时间降序（最新在上）

let systemThemeMediaQuery = null
let handleSystemThemeChange = null
let syncHintTimer = null
let filterDebounceTimer = null

const importInputRef = ref(null)
const triggerImport = () => {
  importInputRef.value?.click()
}

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

const scheduleFilterItems = () => {
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
  }

  filterDebounceTimer = window.setTimeout(() => {
    filterItems()
    filterDebounceTimer = null
  }, 300)
}

// 监听排序方式变化，自动刷新
watch(sortBy, () => {
  filterItems()
})

watch(searchQuery, () => {
  scheduleFilterItems()
})

watch(viewMode, async (newView, oldView) => {
  if (!newView || newView === oldView) return

  try {
    const result = await persistSettings({ defaultView: newView })
    console.log('已同步默认视图:', newView)
    showSyncHint(
      result.status === 'synced' ? '已同步到浏览器' : '同步失败，已保存在本机',
      result.status === 'synced' ? 'success' : 'warning'
    )
  } catch (err) {
    console.error('同步默认视图失败:', err)
  }
})

watch(themeMode, async (newTheme, oldTheme) => {
  if (!newTheme) return

  applyTheme(newTheme)

  if (newTheme === oldTheme) return

  try {
    const result = await persistSettings({ themeMode: newTheme })
    console.log('已同步主题模式:', newTheme)
    showSyncHint(
      result.status === 'synced' ? '已同步到浏览器' : '同步失败，已保存在本机',
      result.status === 'synced' ? 'success' : 'warning'
    )
  } catch (err) {
    console.error('同步主题模式失败:', err)
  }
})

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

  if (theme === 'light') {
    document.documentElement.classList.remove('dark')
    return
  }

  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    return
  }

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
}

const openOptionsPage = async () => {
  try {
    await chrome.runtime.openOptionsPage()
  } catch (err) {
    console.error('打开设置页失败:', err)
    ElMessage.error('打开设置页失败')
  }
}

onBeforeUnmount(() => {
  cleanupSystemThemeListener()
  if (syncHintTimer) {
    clearTimeout(syncHintTimer)
  }
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
  }
})


onMounted(async () => {
  await db.open()
  await db.initDefaultCategories()
  categories.value = await db.categories.toArray()
  allItems.value = await db.items.toArray()

  // 读取用户设置
  const settings = await loadSettings()
  console.log('读取到的设置:', settings)

  // 应用默认视图
  console.log('应用视图:', settings.defaultView)
  if (settings.defaultView) {
    viewMode.value = settings.defaultView
  }

  // 应用主题
  console.log('应用主题:', settings.themeMode)
  themeMode.value = settings.themeMode || 'system'
  applyTheme(themeMode.value)

  filterItems()
}) 

// 新增 ref 和函数
const addCategoryDialog = ref(false)
const newCategory = ref({
  name: '',
  color: '#409EFF',
  icon: 'tag'  // 暂时用字符串，未来可换 Font Awesome
})

// 编辑分类相关
const editCategoryDialog = ref(false)
const editingCategory = ref({
  id: null,
  name: '',
  color: '#409EFF',
  icon: ''
})

// 添加分类按钮点击
const addCategory = () => {
  newCategory.value = { name: '', color: '#409EFF', icon: 'tag' }
  addCategoryDialog.value = true
}

// 编辑分类按钮点击（调用时需提供 category 对象）
const editCategory = (cat) => {
  editingCategory.value = { ...cat }
  editCategoryDialog.value = true
}


// 删除分类（加确认 + 处理关联 item）
const deleteCategory = (cat) => {
  ElMessageBox.confirm(`确认删除分类 "${cat.name}"？关联指令将被设为未分类。`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 把该分类下的 item category 设为空
    const itemsToUpdate = allItems.value.filter(i => i.category === cat.name)
    for (const item of itemsToUpdate) {
      await db.items.update(item.id, { category: '' })
    }
    await db.categories.delete(cat.id)
    categories.value = await db.categories.toArray()
    allItems.value = await db.items.toArray()
    filterItems()
    ElMessage.success('分类删除成功')
  }).catch(() => {})
}

// 保存新分类
const saveCategory = async () => {
  if (!newCategory.value.name.trim()) {
    ElMessage.error('分类名称必填')
    return
  }
  // 检查重名
  const exists = categories.value.some(c => c.name === newCategory.value.name)
  if (exists) {
    ElMessage.error('分类名称已存在')
    return
  }

  await db.categories.add({
    ...newCategory.value,
    createdAt: Date.now()
  })

  categories.value = await db.categories.toArray()
  ElMessage.success('分类添加成功')
  addCategoryDialog.value = false
}

// 保存编辑后的分类
const saveEditCategory = async () => {
  if (!editingCategory.value.name.trim()) {
    ElMessage.error('分类名称必填')
    return
  }
  const exists = categories.value.some(c => c.name === editingCategory.value.name && c.id !== editingCategory.value.id)
  if (exists) {
    ElMessage.error('分类名称已存在')
    return
  }

  await db.categories.update(editingCategory.value.id, {
    name: editingCategory.value.name,
    color: editingCategory.value.color,
    icon: editingCategory.value.icon
  })
  categories.value = await db.categories.toArray()
  ElMessage.success('分类更新成功')
  editCategoryDialog.value = false
}

const filterItems = () => {
  let list = allItems.value

  // 分类过滤
  if (activeCategory.value !== 'all') {
    list = list.filter(item => item.category === activeCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    )
  }

  // 根据 sortBy 排序
  switch (sortBy.value) {
    case 'updated-desc':
      list = list.sort((a, b) => b.updatedAt - a.updatedAt)
      break
    case 'updated-asc':
      list = list.sort((a, b) => a.updatedAt - b.updatedAt)
      break
    case 'created-desc':
      list = list.sort((a, b) => b.createdAt - a.createdAt)
      break
    case 'created-asc':
      list = list.sort((a, b) => a.createdAt - b.createdAt)
      break
    case 'title-asc':
      list = list.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title-desc':
      list = list.sort((a, b) => b.title.localeCompare(a.title))
      break
    default:
      list = list.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  filteredItems.value = list
}

const handleCategorySelect = (key) => {
  activeCategory.value = key
  filterItems()
}

const addItem = () => {
  form.value = { id: null, title: '', content: '', category: '', color: '#409EFF', createdAt: 0, updatedAt: 0 }
  dialogVisible.value = true
}

const editItem = (item) => {
  form.value = { ...item }
  dialogVisible.value = true
}

const saveItem = async () => {
  console.log('saveItem called, form:', JSON.stringify(form.value, null, 2))

  if (!form.value.title?.trim() || !form.value.content?.trim()) {
    ElMessage.error('标题和内容必填')
    return
  }

  try {
    const now = Date.now()
    const data = { ...form.value, updatedAt: now }
    if (!data.createdAt) data.createdAt = now

    // 关键修复：新增时删掉 id（让 auto-increment 生效）
    if (!data.id) {
      delete data.id  // 或 data.id = undefined
    }

    console.log('准备保存的数据（已删 id）:', data)

    if (form.value.id) {
      await db.items.update(form.value.id, data)
      console.log('更新成功:', form.value.id)
    } else {
      await db.items.add(data)
      console.log('添加成功')
    }

    allItems.value = await db.items.toArray()
    filterItems()
    dialogVisible.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    console.error('保存失败:', err)
    ElMessage.error('保存失败：' + (err.message || '数据库错误'))
  }
}

const deleteItem = async (item) => {
  ElMessageBox.confirm('确认删除这条指令？', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await db.items.delete(item.id)
    allItems.value = allItems.value.filter(i => i.id !== item.id)
    filterItems()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage({ message: '复制成功！', type: 'success', duration: 1500 })
  } catch (err) {
    ElMessage.error('复制失败：' + err.message)
  }
}

const exportData = async () => {
  const categoriesData = await db.categories.toArray()
  const itemsData = await db.items.toArray()
  const exportObj = {
    categories: categoriesData,
    items: itemsData,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clipboard-manager-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入（带预览确认）
const handleImport = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result)
      const importedCategories = data.categories || []
      const importedItems = data.items || []

      // 获取本地现有数据
      const localCategories = await db.categories.toArray()
      const localCategoryNames = new Set(localCategories.map(c => c.name))
      const localItemsCount = (await db.items.count()) // 当前指令总数，用于对比

      // 计算变更
      const newCategories = importedCategories.filter(cat => !localCategoryNames.has(cat.name))
      const conflictingCategories = importedCategories.filter(cat => localCategoryNames.has(cat.name))
      const newItemsCount = importedItems.length  // 全部新增（不判重，id自增）

      // 弹窗预览
      const previewMessage = `
        <div style="line-height: 1.6;">
          <p><strong>即将进行的变更：</strong></p>
          <ul>
            <li>新增分类：${newCategories.length} 个</li>
            <li>新增指令：${newItemsCount} 条</li>
            <li>同名分类：${conflictingCategories.length} 个（将<strong>保留您当前的颜色/图标设置</strong>，不会被覆盖）</li>
          </ul>
          <p style="color: #909399; margin-top: 12px;">本地已有数据不会被删除，仅添加新内容。</p>
          <p style="color: #f56c6c; font-weight: bold;">确认导入吗？</p>
        </div>
      `

      ElMessageBox.confirm(previewMessage, '导入预览', {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        type: 'info',
        customClass: 'import-preview-box'
      }).then(async () => {
        // 用户确认后才写入
        let addedCatCount = 0
        for (const cat of newCategories) {
          await db.categories.add(cat)
          addedCatCount++
        }

        // 指令全加（id 自增，不会冲突）
        if (importedItems.length > 0) {
          await db.items.bulkAdd(importedItems)
        }

        // 刷新
        categories.value = await db.categories.toArray()
        allItems.value = await db.items.toArray()
        filterItems()

        ElMessage.success(`导入完成！新增 ${addedCatCount} 个分类，${importedItems.length} 条指令`)
      }).catch(() => {
        ElMessage.info('已取消导入')
      })
    } catch (err) {
      ElMessage.error('导入失败：文件格式无效或解析错误')
      console.error('导入解析失败:', err)
    }
  }
  reader.readAsText(file)

  // 清空 input，防重复选同一个文件
  e.target.value = ''
}

</script>

<style scoped>
.item-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.item-list.card-mode { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.item-list.list-mode { display: flex; flex-direction: column; gap: 8px; }
.item-wrapper { width: 100%; }
.item-wrapper.card { width: 100%; }
.item-wrapper.list { width: 100%; }
.list-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 4px; background: var(--el-bg-color); }
.list-title { flex: 0 0 auto; min-width: 120px; }
.list-content { flex: 1; white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis; color: var(--el-text-color-secondary); }
.list-actions { flex: 0 0 auto; display: flex; gap: 8px; }
.item-card { position: relative; }
.content-preview { white-space: pre-wrap; margin-bottom: 12px; color: var(--el-text-color-secondary); }
.actions { text-align: right; }
.fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; font-size: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.category-tag { font-size: 12px; color: var(--el-text-color-secondary); }
.sync-hint { font-size: 12px; white-space: nowrap; }
.sync-hint-success { color: #67c23a; }
.sync-hint-warning { color: #e6a23c; }

/* 左侧分类菜单项优化：防止名称过长挤按钮 */
.el-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 标题左对齐，按钮右对齐 */
  padding: 0 12px !important; /* 缩小内边距，留空间给按钮 */
  overflow: hidden; /* 溢出隐藏 */
}

.el-menu-item .el-tag {
  flex: 1; /* 标签占满剩余空间 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px; /* 和按钮拉开距离 */
  max-width: calc(100% - 120px); /* 预留按钮空间（编辑+删除+间距 ≈ 120px） */
}

.el-menu-item .el-button {
  flex-shrink: 0; /* 按钮永远不缩 */
  margin-left: 4px;
  font-size: 12px;
  padding: 4px 8px;
}

/* 鼠标悬停时显示完整名称（可选，但用户体验好） */
.el-menu-item:hover .el-tag {
  white-space: normal; /* 悬停时允许换行显示完整 */
  word-break: break-all;
}

.content-preview pre,
.list-content pre {
  margin: 0;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.4;
}

.content-preview code,
.list-content code {
  font-family: 'Consolas', 'Monaco', monospace;
}

.import-preview-box {
  max-width: 500px !important;
}
.import-preview-box .el-message-box__content {
  padding: 20px;
}
</style>



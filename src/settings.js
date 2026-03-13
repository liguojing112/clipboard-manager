const SETTINGS_KEYS = ['defaultView', 'themeMode']

const getFromStorage = (area, keys = SETTINGS_KEYS) => new Promise((resolve, reject) => {
  chrome.storage[area].get(keys, (result) => {
    const error = chrome.runtime?.lastError
    if (error) {
      reject(new Error(error.message))
      return
    }

    resolve(result || {})
  })
})

const setToStorage = (area, values) => new Promise((resolve, reject) => {
  chrome.storage[area].set(values, () => {
    const error = chrome.runtime?.lastError
    if (error) {
      reject(new Error(error.message))
      return
    }

    resolve()
  })
})

export const loadSettings = async () => {
  let syncSettings = {}
  let localSettings = {}

  try {
    syncSettings = await getFromStorage('sync')
  } catch (error) {
    console.warn('读取 sync 设置失败，尝试本地兜底:', error)
  }

  try {
    localSettings = await getFromStorage('local')
  } catch (error) {
    console.warn('读取 local 设置失败:', error)
  }

  return {
    defaultView: syncSettings.defaultView ?? localSettings.defaultView ?? 'card',
    themeMode: syncSettings.themeMode ?? localSettings.themeMode ?? 'system'
  }
}

export const saveSettings = async (values) => {
  try {
    await setToStorage('sync', values)

    try {
      await setToStorage('local', values)
    } catch (error) {
      console.warn('同步成功，但镜像到本地失败:', error)
    }

    return { status: 'synced' }
  } catch (syncError) {
    console.warn('同步到浏览器失败，回退到本地存储:', syncError)

    try {
      await setToStorage('local', values)
      return { status: 'local', error: syncError }
    } catch (localError) {
      throw new Error(`sync: ${syncError.message}; local: ${localError.message}`)
    }
  }
}
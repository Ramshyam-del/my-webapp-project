// Safe storage utilities that work in both client and server environments
const isClient = typeof window !== 'undefined'

// Safe localStorage utilities
export const safeLocalStorage = {
  getItem: (key) => {
    if (!isClient) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('localStorage.getItem failed:', error)
      }
      return null
    }
  },
  
  setItem: (key, value) => {
    if (!isClient) return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('localStorage.setItem failed:', error)
      }
    }
  },
  
  removeItem: (key) => {
    if (!isClient) return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('localStorage.removeItem failed:', error)
      }
    }
  },
  
  clear: () => {
    if (!isClient) return
    try {
      localStorage.clear()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('localStorage.clear failed:', error)
      }
    }
  }
}

// Safe sessionStorage utilities
export const safeSessionStorage = {
  getItem: (key) => {
    if (!isClient) return null
    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('sessionStorage.getItem failed:', error)
      }
      return null
    }
  },
  
  setItem: (key, value) => {
    if (!isClient) return
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('sessionStorage.setItem failed:', error)
      }
    }
  },
  
  removeItem: (key) => {
    if (!isClient) return
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('sessionStorage.removeItem failed:', error)
      }
    }
  },
  
  clear: () => {
    if (!isClient) return
    try {
      sessionStorage.clear()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('sessionStorage.clear failed:', error)
      }
    }
  }
}

// Safe window utilities - using functions instead of getters to prevent illegal invocation
export const getSafeWindow = () => (isClient ? window : null)

export const getSafeDocument = () => {
  const win = getSafeWindow()
  return win ? win.document : null
}

export const getSafeNavigator = () => {
  const win = getSafeWindow()
  return win ? win.navigator : null
}

export const getSafeLocation = () => {
  const win = getSafeWindow()
  return win ? win.location : null
}

export const getSafeMatchMedia = () => {
  const win = getSafeWindow()
  return win ? win.matchMedia : null
}

export const getSafeInnerWidth = () => {
  const win = getSafeWindow()
  return win ? win.innerWidth : 1024 // Default desktop width
}

export const getSafeInnerHeight = () => {
  const win = getSafeWindow()
  return win ? win.innerHeight : 768 // Default desktop height
}

// Safe matchMedia function
export const safeMatchMedia = (query) => {
  const matchMedia = getSafeMatchMedia()
  return matchMedia ? matchMedia.call(window, query) : null
}

// Safe ResizeObserver
export const getSafeResizeObserver = () => (isClient ? ResizeObserver : null)

// Legacy safeWindow object for backward compatibility (deprecated)
export const safeWindow = {
  get matchMedia() {
    return getSafeMatchMedia()
  },
  
  get document() {
    return getSafeDocument()
  },
  
  get navigator() {
    return getSafeNavigator()
  },
  
  get location() {
    return getSafeLocation()
  },
  
  get innerWidth() {
    return getSafeInnerWidth()
  },
  
  get innerHeight() {
    return getSafeInnerHeight()
  }
}

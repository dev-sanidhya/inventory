// Helper functions for working with localStorage with error handling and mobile compatibility

// Check if localStorage is available (handles private browsing mode in Safari)
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

// Get data from localStorage with error handling
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) return defaultValue

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Set data in localStorage with error handling
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)

    // Check if it's a quota error (common on iOS)
    if (
      error instanceof DOMException &&
      // everything except Firefox
      (error.code === 22 ||
        // Firefox
        error.code === 1014 ||
        // test name field too, because code might not be present
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      console.warn("localStorage quota exceeded")
    }

    return false
  }
}

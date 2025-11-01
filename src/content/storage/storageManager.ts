// Storage Manager - Wrapper for chrome.storage.local

/**
 * Save data to chrome storage
 */
export async function saveData(key: string, value: any): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    throw error;
  }
}

/**
 * Load data from chrome storage
 */
export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return null;
  }
}

/**
 * Update data using updater function
 */
export async function updateData<T>(
  key: string,
  updater: (current: T | null) => T
): Promise<T> {
  try {
    const current = await loadData<T>(key);
    const updated = updater(current);
    await saveData(key, updated);
    return updated;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
  }
}

/**
 * Delete data from storage
 */
export async function deleteData(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all storage
 */
export async function clearAllData(): Promise<void> {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

/**
 * Get all stored keys
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(null);
    return Object.keys(result);
  } catch (error) {
    console.error('Error getting keys:', error);
    return [];
  }
}

/**
 * Get multiple values at once
 */
export async function loadMultiple(keys: string[]): Promise<Record<string, any>> {
  try {
    const result = await chrome.storage.local.get(keys);
    return result;
  } catch (error) {
    console.error('Error loading multiple keys:', error);
    return {};
  }
}

/**
 * Save multiple values at once
 */
export async function saveMultiple(data: Record<string, any>): Promise<void> {
  try {
    await chrome.storage.local.set(data);
  } catch (error) {
    console.error('Error saving multiple keys:', error);
    throw error;
  }
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{ bytesInUse: number; quota?: number }> {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    return { bytesInUse };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { bytesInUse: 0 };
  }
}

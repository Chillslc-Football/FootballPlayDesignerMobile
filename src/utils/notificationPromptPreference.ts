import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notifications.prompt.dismissed';

export async function isNotificationPromptDismissed(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function dismissNotificationPrompt(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Best-effort persistence.
  }
}

export async function clearNotificationPromptDismissed(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort persistence.
  }
}

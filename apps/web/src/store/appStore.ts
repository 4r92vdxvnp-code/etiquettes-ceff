import { create } from 'zustand';

const STORAGE_KEY = 'ceff-app-settings';

interface AppSettings {
  claudeApiKey: string | null;
}

interface AppStore extends AppSettings {
  setClaudeApiKey: (key: string) => void;
  clearClaudeApiKey: () => void;
}

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        return {
          claudeApiKey: typeof obj['claudeApiKey'] === 'string' ? obj['claudeApiKey'] : null,
        };
      }
    }
  } catch {
    // Parsing error, use defaults
  }
  return { claudeApiKey: null };
}

function saveToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Write error (quota exceeded, private mode)
  }
}

export const useAppStore = create<AppStore>((set) => ({
  ...loadFromStorage(),

  setClaudeApiKey: (key) =>
    set(() => {
      saveToStorage({ claudeApiKey: key });
      return { claudeApiKey: key };
    }),

  clearClaudeApiKey: () =>
    set(() => {
      saveToStorage({ claudeApiKey: null });
      return { claudeApiKey: null };
    }),
}));

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://csafyunogxwxafghwwnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYWZ5dW5vZ3h3eGFmZ2h3d25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODQwNjksImV4cCI6MjA4NjY2MDA2OX0.ytJdNA8z_o5oYUaGSQgibUM99ow96otj1FVsbwAPC9Y';

// Custom storage adapter for Chrome extension using chrome.storage.local
const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

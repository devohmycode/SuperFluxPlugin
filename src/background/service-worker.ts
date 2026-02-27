// Service worker: handles context menu, badge updates, and background bookmark saving

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://csafyunogxwxafghwwnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYWZ5dW5vZ3h3eGFmZ2h3d25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODQwNjksImV4cCI6MjA4NjY2MDA2OX0.ytJdNA8z_o5oYUaGSQgibUM99ow96otj1FVsbwAPC9Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: {
      async getItem(key: string) {
        const result = await chrome.storage.local.get(key);
        return result[key] ?? null;
      },
      async setItem(key: string, value: string) {
        await chrome.storage.local.set({ [key]: value });
      },
      async removeItem(key: string) {
        await chrome.storage.local.remove(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

async function generateId(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `bk-${hex.slice(0, 16)}`;
}

// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'superflux-save',
    title: 'Sauvegarder dans SuperFlux',
    contexts: ['page', 'link'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'superflux-save') return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    if (tab?.id) {
      chrome.action.setBadgeText({ text: '!', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#e85d4a', tabId: tab.id });
      setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
    }
    return;
  }

  const userId = session.user.id;
  const url = info.linkUrl || info.pageUrl || tab?.url;
  if (!url) return;

  // Try to extract metadata from the page via content script
  let metadata = {
    url,
    title: tab?.title || url,
    description: '',
    image: '',
    favicon: tab?.favIconUrl || '',
    author: '',
    publishedAt: '',
  };

  if (tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_METADATA' });
      if (response?.url) {
        metadata = response;
        if (info.linkUrl) {
          metadata.url = info.linkUrl;
        }
      }
    } catch {
      // Content script not loaded
    }
  }

  let siteName = '';
  try { siteName = new URL(metadata.url).hostname; } catch { /* ignore */ }

  // Save to bookmarks table
  const id = await generateId(metadata.url);
  const { error } = await supabase.from('bookmarks').upsert({
    id,
    user_id: userId,
    url: metadata.url,
    title: metadata.title,
    excerpt: metadata.description,
    image: metadata.image,
    favicon: metadata.favicon,
    author: metadata.author,
    site_name: siteName,
    source: 'chrome',
    tags: [],
    folder: null,
  }, { onConflict: 'id,user_id' });

  // Show success/error badge
  if (tab?.id) {
    if (error) {
      chrome.action.setBadgeText({ text: '!', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#e85d4a', tabId: tab.id });
    } else {
      chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#2d9e5a', tabId: tab.id });
    }
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'BOOKMARK_SAVED') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#2d9e5a', tabId: tab.id });
        setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
      }
    });
    sendResponse({ ok: true });
  }
  return true;
});

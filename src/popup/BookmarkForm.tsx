import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bookmark, BookmarkCheck, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { FolderSelector } from './FolderSelector';

interface PageMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  author: string;
  publishedAt: string;
}

interface BookmarkFormProps {
  userId: string;
}

export function BookmarkForm({ userId }: BookmarkFormProps) {
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    extractMetadata();
  }, []);

  const extractMetadata = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url) {
        setLoading(false);
        return;
      }

      // Try content script extraction first
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_METADATA' });
        if (response?.url) {
          setMetadata(response);
          await checkIfSaved(response.url);
          setLoading(false);
          return;
        }
      } catch {
        // Content script not loaded, use tab info
      }

      // Fallback: use tab info
      const fallback: PageMetadata = {
        url: tab.url,
        title: tab.title || tab.url,
        description: '',
        image: '',
        favicon: tab.favIconUrl || '',
        author: '',
        publishedAt: '',
      };
      setMetadata(fallback);
      await checkIfSaved(tab.url);
    } catch (err) {
      console.error('Failed to extract metadata:', err);
    }
    setLoading(false);
  };

  const generateId = async (url: string): Promise<string> => {
    const encoded = new TextEncoder().encode(url);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `bk-${hex.slice(0, 16)}`;
  };

  const checkIfSaved = async (url: string) => {
    const id = await generateId(url);
    const { data } = await supabase
      .from('bookmarks')
      .select('id, folder')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    setAlreadySaved(!!data);
    if (data?.folder) setSelectedFolder(data.folder);
  };

  const handleSave = async () => {
    if (!metadata) return;
    setSaving(true);

    try {
      const id = await generateId(metadata.url);
      let siteName = '';
      try { siteName = new URL(metadata.url).hostname; } catch { /* ignore */ }

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
        folder: selectedFolder,
      }, { onConflict: 'id,user_id' });

      if (error) throw error;

      setSaved(true);
      setAlreadySaved(true);

      // Update badge
      chrome.runtime.sendMessage({ type: 'BOOKMARK_SAVED' });
    } catch (err) {
      console.error('Save failed:', err);
    }

    setSaving(false);
  };

  const handleRemove = async () => {
    if (!metadata) return;
    setSaving(true);

    try {
      const id = await generateId(metadata.url);
      await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      setAlreadySaved(false);
      setSaved(false);
    } catch (err) {
      console.error('Remove failed:', err);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={22} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
        Impossible de lire cette page
      </div>
    );
  }

  return (
    <div className="p-4 animate-slide-up">
      {/* Page preview card */}
      <div className="rounded-xl card-shadow bg-[var(--bg-elevated)] overflow-hidden mb-3">
        {metadata.image && (
          <div className="w-full h-32 overflow-hidden">
            <img
              src={metadata.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-start gap-2 mb-1">
            {metadata.favicon && (
              <img
                src={metadata.favicon}
                alt=""
                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <h2 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
              {metadata.title}
            </h2>
          </div>
          {metadata.description && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
              {metadata.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[280px] font-medium">
              {new URL(metadata.url).hostname}
            </span>
            {metadata.author && (
              <span className="text-[10px] text-[var(--text-tertiary)]">
                · {metadata.author}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Folder selector */}
      <FolderSelector userId={userId} value={selectedFolder} onChange={setSelectedFolder} />

      {/* Actions */}
      {alreadySaved ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent-soft)]">
            <BookmarkCheck size={16} className="text-[var(--accent)]" />
            <span className="text-sm text-[var(--accent)] font-medium">
              {saved ? 'Sauvegardé !' : 'Déjà dans SuperFlux'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRemove}
              disabled={saving}
              className="btn-outline flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm hover:!text-[var(--red)] hover:!border-[var(--red)]"
            >
              <Trash2 size={14} />
              Retirer
            </button>
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm no-underline"
            >
              <ExternalLink size={14} />
              Ouvrir
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 animate-pulse-glow"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Bookmark size={16} />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder dans SuperFlux'}
        </button>
      )}
    </div>
  );
}

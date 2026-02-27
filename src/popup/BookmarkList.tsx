import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ExternalLink, Trash2, BookmarkX } from 'lucide-react';

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  favicon: string | null;
  site_name: string | null;
  source: string;
  updated_at: string;
}

interface BookmarkListProps {
  userId: string;
}

export function BookmarkList({ userId }: BookmarkListProps) {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, [userId]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, title, url, excerpt, favicon, site_name, source, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));

    await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={22} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center mb-3">
          <BookmarkX size={24} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Aucun bookmark</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Sauvegardez des pages pour les retrouver ici
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[420px]">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="group flex items-start gap-3 px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all animate-fade-in"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {item.favicon && (
                <img
                  src={item.favicon}
                  alt=""
                  className="w-3.5 h-3.5 rounded flex-shrink-0"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] line-clamp-1 transition-colors"
              >
                {item.title}
              </a>
            </div>
            {item.excerpt && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                {item.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
                {item.site_name || item.source}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                · {formatRelativeTime(item.updated_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-all"
            >
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => handleRemove(item.id)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] hover:text-[var(--red)] transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;

  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

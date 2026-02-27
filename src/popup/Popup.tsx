import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoginForm } from './LoginForm';
import { BookmarkForm } from './BookmarkForm';
import { BookmarkList } from './BookmarkList';
import { Bookmark, List, LogOut, Loader2, Rss } from 'lucide-react';

type Tab = 'save' | 'list';

export function Popup() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('save');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id ?? null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 size={22} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!userId) {
    return <LoginForm onLogin={checkSession} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="header-gradient flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-sm">
            <Rss size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
            SuperFlux
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all"
          title="Se déconnecter"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex px-2 pt-1 gap-1 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('save')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
            activeTab === 'save'
              ? 'text-[var(--accent)] bg-[var(--accent-glow)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <Bookmark size={13} />
          Sauvegarder
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
            activeTab === 'list'
              ? 'text-[var(--accent)] bg-[var(--accent-glow)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <List size={13} />
          Mes bookmarks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'save' ? (
          <BookmarkForm userId={userId} />
        ) : (
          <BookmarkList userId={userId} />
        )}
      </div>
    </div>
  );
}

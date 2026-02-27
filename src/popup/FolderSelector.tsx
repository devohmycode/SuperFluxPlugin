import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FolderOpen, Plus, ChevronDown, Loader2, Check } from 'lucide-react';

interface FolderSelectorProps {
  userId: string;
  value: string | null;
  onChange: (folder: string | null) => void;
}

export function FolderSelector({ userId, value, onChange }: FolderSelectorProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFolders();
  }, [userId]);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFolders = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('folder')
      .eq('user_id', userId)
      .not('folder', 'is', null)
      .order('folder');

    if (data) {
      const unique = [...new Set(data.map(d => d.folder as string))];
      setFolders(unique);
    }
    setLoading(false);
  };

  const handleSelect = (folder: string | null) => {
    onChange(folder);
    setOpen(false);
    setCreating(false);
    setNewName('');
  };

  const handleCreateConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (!folders.includes(trimmed)) {
      setFolders(prev => [...prev, trimmed].sort());
    }
    onChange(trimmed);
    setOpen(false);
    setCreating(false);
    setNewName('');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] mb-3">
        <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">Chargement des dossiers...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mb-3">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all text-left"
      >
        <FolderOpen size={15} className={value ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
        <span className={`flex-1 text-xs truncate font-medium ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {value || 'Sans dossier'}
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--text-tertiary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-lg overflow-hidden animate-fade-in">
          <div className="max-h-[160px] overflow-y-auto py-1">
            {/* No folder option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left hover:bg-[var(--bg-hover)] transition-all ${
                !value ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)]'
              }`}
            >
              <span className="flex-1">Sans dossier</span>
              {!value && <Check size={12} className="text-[var(--accent)]" />}
            </button>

            {/* Existing folders */}
            {folders.map(folder => (
              <button
                key={folder}
                type="button"
                onClick={() => handleSelect(folder)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left hover:bg-[var(--bg-hover)] transition-all ${
                  value === folder ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-primary)]'
                }`}
              >
                <FolderOpen size={12} className="flex-shrink-0" />
                <span className="flex-1 truncate">{folder}</span>
                {value === folder && <Check size={12} className="text-[var(--accent)]" />}
              </button>
            ))}
          </div>

          {/* Create new folder - inline input */}
          <div className="border-t border-[var(--border-subtle)]">
            {creating ? (
              <div className="flex items-center gap-1.5 p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateConfirm();
                    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                  }}
                  placeholder="Nom du dossier"
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim()}
                  className="btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[var(--accent)] font-medium hover:bg-[var(--bg-hover)] transition-all"
              >
                <Plus size={13} />
                Nouveau dossier
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { 
  Library, 
  PenLine, 
  BookOpen, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Settings, 
  RefreshCw, 
  Bold, 
  Italic, 
  List,
  CheckCircle2,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'library' | 'write' | 'read';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/notes';

interface Entry {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  readTime: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};


const SidebarItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-amber-primary text-obsidian font-bold scale-[1.02] shadow-lg shadow-amber-primary/20' 
        : 'text-amber-muted hover:text-amber-primary hover:bg-obsidian-light'
    }`}
  >
    <Icon size={20} fill={isActive ? 'currentColor' : 'none'} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const Editor = ({ value, onChange, placeholder, autoFocus }: { value: string, onChange: (val: string) => void, placeholder: string, autoFocus?: boolean }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      contentEditable
      autoFocus={autoFocus}
      className="w-full min-h-[500px] md:min-h-[70vh] bg-transparent border-none outline-none serif-text text-xl md:text-2xl leading-relaxed focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-amber-muted/10 whitespace-pre-wrap cursor-text"
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
    />
  );
};

export default function App() {
  const [view, setView] = useState<View>('library');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (entry: Entry, mode: View) => {
    setIsCreating(false);
    setSelectedEntry(entry);
    setTempTitle(entry.title);
    setTempContent(entry.content);
    setView(mode);
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (tempTitle.trim() === '' && tempContent.trim() === '') {
      setView('library');
      setIsCreating(false);
      return;
    }

    try {
      if (isCreating) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tempTitle || 'Untitled Note',
            content: tempContent,
            category: 'Note',
            readTime: '1 min read',
          }),
        });
        const newNote = await res.json();
        setEntries(prev => [newNote, ...prev]);
      } else if (selectedEntry) {
        const res = await fetch(`${API_URL}/${selectedEntry._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: tempTitle, content: tempContent }),
        });
        const updatedNote = await res.json();
        setEntries(prev => prev.map(e => e._id === updatedNote._id ? updatedNote : e));
        setSelectedEntry(updatedNote);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }

    setIsCreating(false);
    setView('library');
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e._id !== id));
      if (selectedEntry?._id === id) setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex text-slate-200">
      <aside className={`hidden ${view === 'library' ? 'lg:flex' : 'lg:hidden'} flex-col w-[280px] h-screen glass-panel fixed left-0 top-0 z-40 p-6 overflow-y-auto`}>
        <div className="mb-10 mt-2 px-2">
          <h1 className="text-3xl font-bold tracking-tight text-amber-primary">My notes gue</h1>
        </div>

        <button 
          onClick={() => {
            setIsCreating(true);
            setSelectedEntry(null);
            setTempTitle('');
            setTempContent('');
            setView('write');
          }}
          className="bg-amber-primary text-obsidian w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mb-8 hover:bg-amber-primary/90 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          New Notes
        </button>

        <div className="space-y-1">
          <SidebarItem 
            icon={Library} 
            label="Library" 
            isActive={view === 'library'} 
            onClick={() => setView('library')} 
          />
        </div>

        <div className="mt-10 pt-10 border-t border-white/5 flex-1 overflow-hidden flex flex-col">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-muted/40 font-black mb-4 px-3 flex items-center justify-between">
            Recents
            <span className="text-[9px] opacity-50 px-1.5 py-0.5 rounded border border-white/10">{entries.length}</span>
          </p>
          <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {entries.length === 0 ? (
              <p className="px-3 text-xs text-amber-muted/20 italic">No notes yet...</p>
            ) : (
              entries.map((entry) => (
                <button 
                  key={entry._id}
                  onClick={() => handleOpen(entry, 'read')}
                  className={`group w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all truncate flex items-center gap-3 ${
                    selectedEntry?._id === entry._id && (view === 'read' || view === 'write')
                      ? 'bg-amber-primary/10 text-amber-primary' 
                      : 'text-amber-muted/60 hover:text-amber-primary hover:bg-white/5'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    selectedEntry?._id === entry._id && (view === 'read' || view === 'write')
                      ? 'bg-amber-primary' 
                      : 'bg-white/10 group-hover:bg-amber-primary/30'
                  }`} />
                  <span className="truncate">{entry.title || 'Untitled Note'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${view === 'library' ? 'lg:ml-[280px]' : ''} transition-all duration-500`}>
        <AnimatePresence mode="wait">
          {view === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl mx-auto p-6 md:p-12 pb-32 lg:pb-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-surface-border pb-8 gap-6">
                <div>
                  <h2 className="serif-text text-4xl font-bold mb-2">Library</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {entries.map((entry, idx) => (
                  <motion.article 
                    layoutId={`entry-${entry._id}`}
                    key={entry._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-panel p-6 rounded-2xl flex flex-col h-[320px] group hover:border-amber-primary/30 transition-all duration-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs text-amber-muted/50 font-serif">{formatDate(entry.createdAt)}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 group-hover:text-amber-primary transition-colors line-clamp-1">{entry.title || 'Untitled Note'}</h3>
                    
                    <p className="font-serif text-amber-muted/70 leading-relaxed italic line-clamp-4 flex-1">
                      {(entry.content || '').replace(/<[^>]+>/g, '') || 'Empty note content...'}
                    </p>

                    <div className="mt-6 flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpen(entry, 'read'); }}
                        className="flex-1 bg-amber-primary/10 text-amber-primary py-2.5 rounded-xl font-bold text-xs border border-amber-primary/20 hover:bg-amber-primary hover:text-obsidian transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen size={14} /> Read
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpen(entry, 'write'); }}
                        className="flex-1 bg-obsidian text-slate-400 py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:border-amber-primary hover:text-amber-primary transition-all flex items-center justify-center gap-2"
                      >
                        <PenLine size={14} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry._id); }}
                        className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'write' && (
            <motion.div 
              key="write"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[720px] mx-auto px-6 pt-24 md:pt-32 pb-32"
            >
              <header className="fixed top-0 left-0 right-0 z-30 bg-obsidian/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-surface-border">
                <div className="flex items-center gap-1.5 p-1 bg-obsidian-light rounded-full border border-surface-border">
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand('bold', false);
                    }}
                    className="p-2 hover:bg-obsidian rounded-full text-amber-muted transition-colors" title="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand('italic', false);
                    }}
                    className="p-2 hover:bg-obsidian rounded-full text-amber-muted transition-colors" title="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand('insertUnorderedList', false);
                    }}
                    className="p-2 hover:bg-obsidian rounded-full text-amber-muted transition-colors" title="List"
                  >
                    <List size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setView('library'); setIsCreating(false); }}
                    className="text-amber-muted hover:text-amber-primary text-xs font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="bg-amber-primary text-obsidian px-6 py-2 rounded-full font-bold text-xs shadow-lg shadow-amber-primary/20 active:scale-95 transition-all"
                  >
                    Save
                  </button>
                </div>
              </header>

              <div className="space-y-8">
                <input 
                  autoFocus
                  placeholder="Entry Title..."
                  className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-bold placeholder:text-amber-muted/20"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                />
                <Editor 
                  placeholder="Begin typing your story..."
                  value={tempContent}
                  onChange={setTempContent}
                />
              </div>
            </motion.div>
          )}

          {view === 'read' && selectedEntry && (
            <motion.div 
              key="read"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-between items-center px-6 py-4 border-b ${isScrolled ? 'bg-obsidian/90 backdrop-blur-md border-surface-border' : 'bg-transparent border-transparent'}`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('library')}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-amber-primary"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <span className="font-bold tracking-tight text-amber-primary/80">App Reader</span>
                </div>

                <div className="flex items-center gap-1 md:gap-4">
                  <button className="p-2 text-amber-muted hover:bg-white/5 rounded-full transition-colors hidden md:block">
                    <Type size={18} />
                  </button>
                  <button className="p-2 text-amber-muted hover:bg-white/5 rounded-full transition-colors">
                    <Settings size={18} />
                  </button>
                  <button className="p-2 text-amber-muted hover:bg-white/5 rounded-full transition-colors">
                    <RefreshCw size={17} />
                  </button>
                </div>
              </header>

              <div className="max-w-[680px] mx-auto px-6 pt-32 pb-48">
                <div className="flex items-center gap-3 mb-8 border-b border-surface-border pb-6">
                  <span className="text-xs text-amber-muted italic">
                    Created: {formatDate(selectedEntry.createdAt)} &nbsp;&bull;&nbsp; Last edited: {formatDate(selectedEntry.updatedAt)}
                  </span>
                </div>

                <h1 className="serif-text text-5xl md:text-6xl font-bold mb-10 leading-tight">
                  <input 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    placeholder="Untitled"
                  />
                </h1>



                <div className="serif-text space-y-10 text-xl md:text-2xl leading-[1.8] text-slate-300 font-light">
                  <Editor 
                    placeholder="Start reading and editing..."
                    value={tempContent}
                    onChange={setTempContent}
                  />
                </div>

                <footer className="mt-32 pt-16 border-t border-surface-border flex flex-col items-center gap-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => { setView('library'); setIsCreating(false); }}
                      className="px-8 py-3.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      Discard Changes
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-amber-primary text-obsidian font-bold shadow-lg shadow-amber-primary/20 hover:bg-amber-primary/90 transition-all"
                    >
                      Save Progress
                      <CheckCircle2 size={20} />
                    </button>
                  </div>
                </footer>
              </div>


            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel h-16 w-[90%] max-w-[400px] rounded-[2rem] flex items-center justify-around px-4 shadow-2xl shadow-black/80">
        {[
          { id: 'library', icon: Library }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`p-3 rounded-full transition-all duration-500 ${
              view === item.id 
                ? 'bg-amber-primary text-obsidian scale-110 shadow-lg shadow-amber-primary/20 -translate-y-2' 
                : 'text-amber-muted hover:text-white'
            }`}
          >
            <item.icon size={22} fill={view === item.id ? 'currentColor' : 'none'} />
          </button>
        ))}
      </nav>
    </div>
  );
}

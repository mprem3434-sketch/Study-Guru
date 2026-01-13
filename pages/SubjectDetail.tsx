
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store.ts';
import { SUBJECT_ICONS } from '../constants.tsx';
import { 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Circle,
  Pin,
  Search,
  X,
  Clock,
  ArrowUpDown,
  Trash2,
  ChevronRight,
  Layers,
  FileText,
  Zap,
  Activity,
  Box,
  Sparkles,
  Loader2,
  User
} from 'lucide-react';

export const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, isLoaded, addTopic, deleteTopic, togglePinTopic, toggleTopicCompletion } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [sortBy, setSortBy] = useState<'name' | 'pinned' | 'completion'>('pinned');
  
  const subject = state.subjects.find(s => s.id === id);
  const isAdmin = state.currentUser?.role === 'ADMIN';
  const isTeacher = state.currentUser?.role === 'TEACHER';
  
  // Teachers need to add topics to then add materials
  const canEdit = isAdmin || isTeacher;
  // Teachers CANNOT delete topics once created (only Admin)
  const canDelete = isAdmin;

  const handleDeleteTopic = (topicId: string) => {
    if(!confirm("Delete this topic and all its materials?")) return;
    if (!subject) return;
    deleteTopic(subject.id, topicId);
  };

  const handleAddTopic = () => {
    if (!newTopic.name.trim() || !subject) return;
    addTopic(subject.id, newTopic.name, newTopic.description);
    setNewTopic({ name: '', description: '' });
    setIsModalOpen(false);
  };

  const filteredTopics = useMemo(() => {
    if (!subject) return [];
    let list = [...subject.topics].filter(t => 
      t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'pinned') {
      list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'completion') {
      list.sort((a, b) => (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0));
    }
    return list;
  }, [subject, search, sortBy]);

  // Handle Loading State
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Knowledge Base...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-20 px-6 animate-in fade-in">
        <div className="w-20 h-20 bg-rose-50 text-rose-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Box size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Subject Not Found</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">The requested module might have been purged or relocated.</p>
        <button onClick={() => navigate('/subjects')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return to Modules</button>
      </div>
    );
  }

  const IconComponent = SUBJECT_ICONS.find(i => i.id === subject.icon)?.component;
  const completedCount = subject.topics.filter(t => t.isCompleted).length;
  const progressPercent = subject.topics.length > 0 ? Math.round((completedCount / subject.topics.length) * 100) : 0;
  const themeColor = subject.color.replace('bg-', 'text-');

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 animate-in fade-in duration-700">
      
      {/* Subject Command Hub - Ultra Compact & Glossy */}
      <header className="relative group">
        <div className={`absolute inset-0 ${subject.color} opacity-[0.03] blur-3xl rounded-[3rem] transition-all duration-1000 group-hover:opacity-[0.07]`} />
        
        <div className="flex items-center justify-between mb-4 px-2">
            <button 
                onClick={() => navigate(-1)} 
                aria-label="Go Back"
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md border border-slate-100 text-slate-500 hover:text-slate-900 shadow-sm transition-all active:scale-90"
            >
                <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
               <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-xl border border-white">
                  <Activity size={12} className={themeColor} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Class {subject.targetClass}</span>
               </div>
               <button 
                  onClick={() => setSortBy(sortBy === 'name' ? 'pinned' : sortBy === 'pinned' ? 'completion' : 'name')}
                  aria-label={`Sort by ${sortBy}`}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  <ArrowUpDown size={12} />
                  {sortBy}
                </button>
            </div>
        </div>

        <div className="glass-panel gloss-reflection p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-32 h-32 ${subject.color} opacity-5 blur-[60px] -ml-16 -mt-16`} />
          
          <div className="flex items-center gap-5 md:gap-7 relative z-10 w-full md:w-auto">
            <div className={`w-16 h-16 md:w-20 md:h-20 ${subject.color} rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl transition-transform duration-700 group-hover:rotate-3`}>
              {IconComponent && React.cloneElement(IconComponent as React.ReactElement<any>, { size: 32, strokeWidth: 2.5 })}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 block">Module Header</span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none truncate">{subject.name}</h2>
              <div className="flex items-center gap-3 mt-3">
                 {subject.createdBy && (
                     <div className="px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
                        <User size={10} className="text-slate-400"/>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{subject.createdBy}</span>
                     </div>
                 )}
                 <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeColor}`}>{completedCount} Resolved</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 relative z-10 w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
             <div className="flex justify-between w-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>Subject Mastery</span>
                <span className={themeColor}>{progressPercent}%</span>
             </div>
             <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-white shadow-inner">
                <div className={`h-full ${subject.color} rounded-full transition-all duration-1000 shadow-lg`} style={{ width: `${progressPercent}%` }} />
             </div>
          </div>
        </div>
      </header>

      {/* REDESIGNED MICRO-PRISM FILTER SCANNER (ULTRA COMPACT TABLET VIEW) */}
      <div className="flex justify-center md:justify-end px-1">
        <div className="relative group md:w-24 focus-within:md:w-44 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative w-6 h-6 flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-700 to-indigo-900 rounded-lg shadow-[0_2px_10px_rgba(79,70,229,0.5)] border border-white/30 transition-all duration-700 group-focus-within:rotate-[360deg] group-hover:scale-110" />
               <div className="absolute inset-0.5 bg-white/10 backdrop-blur-[2px] rounded-md border border-white/20 z-[1]" />
               <Search size={9} strokeWidth={5} className="relative z-[5] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
            </div>
          </div>
          <input 
            type="text" 
            placeholder="FILTER..."
            aria-label="Filter Topics"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-white/60 backdrop-blur-3xl border border-white rounded-xl pl-10 pr-4 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 shadow-sm transition-all text-[8px] font-black text-slate-900 placeholder:text-slate-400 uppercase tracking-[0.3em]"
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 border border-white/20" />
        </div>
      </div>

      {/* Unit List - High Contrast & Glossy */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 px-1">
        {filteredTopics.length > 0 ? (
          filteredTopics.map((topic, idx) => (
            <div 
              key={topic.id}
              className={`group relative glass-panel gloss-reflection p-4 md:p-5 rounded-[1.8rem] md:rounded-[2.2rem] border transition-all duration-500 overflow-hidden animate-in slide-in-from-bottom-2 ${topic.isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-white hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-100'}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-4 md:gap-6 relative z-10">
                <button 
                  onClick={() => toggleTopicCompletion(topic.id)}
                  aria-label={topic.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  className={`transition-all active:scale-90 flex-shrink-0 ${topic.isCompleted ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`}
                >
                  {topic.isCompleted ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                </button>
                
                <Link to={`/topic/${topic.id}`} className="flex-1 min-w-0 group/link">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`font-black text-base md:text-xl truncate transition-colors ${topic.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 group-hover/link:text-indigo-600'}`}>
                      {topic.name}
                    </h4>
                    {topic.isPinned && <Pin size={12} className="text-indigo-500 fill-indigo-500" />}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} className="text-slate-300" />
                      <span>{topic.materials.length} Sections</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={() => togglePinTopic(topic.id)}
                    aria-label={topic.isPinned ? "Unpin topic" : "Pin topic"}
                    className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${topic.isPinned ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-300 hover:text-indigo-400 hover:bg-indigo-50'}`}
                  >
                    <Pin size={16} className={topic.isPinned ? 'fill-current' : ''} />
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDeleteTopic(topic.id)}
                      aria-label="Delete topic"
                      className="w-9 h-9 md:w-11 md:h-11 bg-white border border-slate-100 text-slate-300 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <Link to={`/topic/${topic.id}`} className="w-9 h-9 md:w-11 md:h-11 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg active:scale-95" aria-label="Open topic">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-100 shadow-sm">
              <Box size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-400 tracking-tight px-4">Workspace Empty</h4>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest max-w-[200px] mx-auto mt-2 leading-relaxed px-4">Deploy your first learning unit to begin.</p>
          </div>
        )}
      </div>

      {/* Floating Action Component - Admin & Teacher */}
      {canEdit && (
        <div className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-40">
          <button 
            onClick={() => setIsModalOpen(true)}
            aria-label="Add New Topic"
            className={`w-14 h-14 md:w-16 md:h-16 ${subject.color} text-white rounded-2xl md:rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center hover:brightness-110 active:scale-90 transition-all hover:rotate-3 group ring-8 ring-white/20 backdrop-blur-sm`}
          >
            <Plus size={28} className="transition-transform group-hover:scale-125 group-hover:rotate-90" />
          </button>
        </div>
      )}

      {/* MICRO-CONSOLE "INITIALIZE UNIT" MODAL (HYPER COMPACT) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="glass-panel gloss-reflection w-full max-w-[320px] rounded-[2.5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] border border-white/50 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col relative">
            
            <div className={`w-full h-20 p-5 flex items-center justify-between relative overflow-hidden text-white transition-all duration-700 ${subject.color}`}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.4),_transparent_70%)] animate-pulse" />
               <div className="relative z-10">
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-70 block mb-0.5">Protocol Link</span>
                  <h3 className="text-base font-black tracking-tighter truncate max-w-[180px] leading-none">{newTopic.name || 'New Unit'}</h3>
               </div>
               <div className="relative z-10 w-9 h-9 bg-white/95 rounded-xl flex items-center justify-center text-slate-900 shadow-xl">
                  <Layers size={18} className={themeColor} />
               </div>
            </div>

            <div className="p-5 bg-white/95 backdrop-blur-2xl flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-1.5">
                  <Zap size={9} className="text-indigo-400 fill-current" /> Designation
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTopic.name}
                  onChange={e => setNewTopic({...newTopic, name: e.target.value})}
                  placeholder="Module Title..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-400/30 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-1.5">
                  <FileText size={9} className="text-indigo-400" /> Objectives
                </label>
                <textarea 
                  value={newTopic.description}
                  onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                  placeholder="Key concepts..."
                  className="w-full h-20 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-medium text-slate-700 focus:bg-white focus:border-indigo-400/30 outline-none resize-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleAddTopic}
                  className={`w-full py-3.5 rounded-xl font-black text-[8px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-white ${subject.color} hover:brightness-110 relative overflow-hidden group/btn`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10">Confirm Link</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)} 
              aria-label="Close"
              className="absolute top-2.5 right-2.5 w-6 h-6 bg-white/10 backdrop-blur-md text-white/50 rounded-full flex items-center justify-center transition-all hover:bg-white hover:text-slate-900 z-50 group border border-white/10"
            >
              <X size={12} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

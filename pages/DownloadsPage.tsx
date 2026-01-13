
import React, { useState, useMemo } from 'react';
import { useStore } from '../store.ts';
import { Link } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Video, 
  Trash2, 
  ArrowRight, 
  Search, 
  Database,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { MaterialType } from '../types.ts';

export const DownloadsPage: React.FC = () => {
  const { state, removeDownload, clearAllDownloads } = useStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'ALL'>('ALL');

  const downloadedMaterials = useMemo(() => {
    return state.subjects.flatMap(s => 
      s.topics.flatMap(t => 
        t.materials
          .filter(m => m.isDownloaded)
          .map(m => ({ 
            ...m, 
            subjectName: s.name, 
            subjectColor: s.color, 
            topicName: t.name,
            estimatedSize: m.type === MaterialType.VIDEO ? 45 : 8 
          }))
      )
    ).filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                            m.subjectName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterType === 'ALL' || m.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [state.subjects, search, filterType]);

  const totalSize = downloadedMaterials.reduce((acc, m) => acc + m.estimatedSize, 0);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-32 px-1">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1 block">Local Repository</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Offline Vault</h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <HardDrive size={24} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
            <Database size={14} className="md:w-4 md:h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{totalSize} MB Cached</span>
          </div>
          {downloadedMaterials.length > 0 && (
            <button 
              onClick={() => { if(confirm("This will remove all assets from local storage. Proceed?")) clearAllDownloads(); }}
              className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
            >
              Purge All
            </button>
          )}
        </div>
      </header>

      {/* Search & Filter Bar - Mobile Optimized */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all" size={18} />
          <input 
            type="text" 
            placeholder="Search offline assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] pl-14 pr-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm font-medium text-sm"
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto hide-scrollbar">
          {(['ALL', MaterialType.PDF, MaterialType.VIDEO] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {downloadedMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {downloadedMaterials.map(m => (
            <div 
              key={m.id} 
              className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 relative"
            >
              <div className={`w-14 h-14 ${m.subjectColor} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 shrink-0`}>
                {m.type === 'VIDEO' ? <Video size={24} /> : <FileText size={24} />}
              </div>
              
              <div className="flex-1 min-w-0 pr-10">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{m.subjectName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{m.estimatedSize}MB</span>
                </div>
                <h4 className="font-black text-slate-800 text-base truncate leading-tight mb-1">{m.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium truncate">{m.topicName}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => removeDownload(m.id)}
                  className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
                <Link 
                  to={`/topic/${m.topicId}`} 
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm px-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Download size={40} />
          </div>
          <h4 className="text-xl font-black text-slate-800 tracking-tight">Empty Vault</h4>
          <p className="text-slate-400 max-w-[240px] mx-auto mt-2 text-xs font-medium leading-relaxed">No assets found matching your criteria. Download materials for offline study.</p>
          <Link to="/subjects" className="mt-8 inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            Browse Study Units
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};

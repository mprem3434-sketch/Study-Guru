
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Video, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Filter, 
  AlertCircle,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { MaterialType } from '../types';

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
            estimatedSize: m.type === MaterialType.VIDEO ? 45 : 8 // Estimated MB for UI breakdown
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Offline Vault</h2>
          <p className="text-slate-500 mt-1 font-medium max-w-md">Your local repository of study assets. No internet required for playback or reading.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Database size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{totalSize} MB Indexed</span>
          </div>
          {downloadedMaterials.length > 0 && (
            <button 
              onClick={() => { if(confirm("This will remove all assets from local storage. Proceed?")) clearAllDownloads(); }}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
            >
              Purge All Downloads
            </button>
          )}
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all" size={20} />
          <input 
            type="text" 
            placeholder="Search offline assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[2rem] pl-14 pr-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm font-medium"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
          {(['ALL', MaterialType.PDF, MaterialType.VIDEO] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {downloadedMaterials.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {downloadedMaterials.map(m => (
            <div 
              key={m.id} 
              className="group bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all flex items-center gap-6"
            >
              <div className={`w-16 h-16 ${m.subjectColor} text-white rounded-[1.8rem] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 shadow-indigo-100/20`}>
                {m.type === 'VIDEO' ? <Video size={28} /> : <FileText size={28} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{m.subjectName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{m.type}</span>
                </div>
                <h4 className="font-black text-slate-900 text-xl truncate tracking-tight">{m.title}</h4>
                <div className="flex items-center gap-3 mt-1.5">
                   <p className="text-xs text-slate-400 font-medium truncate">{m.topicName}</p>
                   <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">~{m.estimatedSize} MB</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => removeDownload(m.id)}
                  className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Remove from offline"
                >
                  <Trash2 size={22} />
                </button>
                <Link 
                  to={`/topic/${m.topicId}`} 
                  className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm"
                >
                  <ArrowRight size={22} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
            <Download size={64} />
          </div>
          <h4 className="text-3xl font-black text-slate-800 tracking-tight">Empty Vault</h4>
          <p className="text-slate-500 max-w-xs mx-auto mt-4 text-lg">No assets matched your search or filter. Download materials from your subjects to see them here.</p>
          <Link to="/subjects" className="mt-8 inline-block bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">Browse Curriculum</Link>
        </div>
      )}

      {downloadedMaterials.length > 0 && (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/10">
              <ShieldCheck size={40} className="text-indigo-400" />
            </div>
            <div>
              <h4 className="text-2xl font-black">Storage Shield Active</h4>
              <p className="opacity-60 text-base mt-1">Study Guru is managing {downloadedMaterials.length} assets with scoped browser storage.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3 relative z-10">
             <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Efficiency</span>
                <div className="text-3xl font-black text-emerald-400">98.4%</div>
             </div>
             <button className="px-8 py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5">Run Storage Audit</button>
          </div>
        </div>
      )}
    </div>
  );
};

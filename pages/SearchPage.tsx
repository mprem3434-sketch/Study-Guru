
import React, { useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Search as SearchIcon, BookOpen, Layers, Play, FileText, ChevronRight, StickyNote } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { globalSearch } = useStore();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  const results = useMemo(() => globalSearch(query), [query, globalSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Search Results</h2>
          <p className="text-slate-500 font-medium">Found {results.length} matches for "{query}"</p>
        </div>
      </header>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((res, i) => (
            <div key={i} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
              {res.type === 'subject' && (
                <Link to={`/subject/${res.data.id}`} className="block h-full bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 ${res.data.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Subject Entry</span>
                      <h3 className="text-2xl font-black text-slate-900">{res.data.name}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                       <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              )}

              {res.type === 'topic' && (
                <Link to={`/topic/${res.data.id}`} className="block h-full bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                      <Layers size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.subject.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Topic</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">{res.data.name}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                       <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              )}

              {res.type === 'material' && (
                <Link to={`/topic/${res.data.topicId}`} className="block h-full bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                        {res.data.type === 'VIDEO' ? <Play size={24} className="fill-current" /> : res.data.type === 'PDF' ? <FileText size={24} /> : <StickyNote size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.topic.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{res.data.type}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 truncate">{res.data.title}</h3>
                        </div>
                    </div>
                    {res.data.notes && res.data.notes.toLowerCase().includes(query.toLowerCase()) && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-sm text-slate-600 italic">
                            "...{res.data.notes.split(new RegExp(query, 'i'))[0]?.slice(-30)}
                            <mark className="bg-yellow-200 text-slate-900 font-bold px-1 rounded">{query}</mark>
                            {res.data.notes.split(new RegExp(query, 'i'))[1]?.slice(0, 40)}..."
                         </p>
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
            <SearchIcon size={64} />
          </div>
          <h4 className="text-3xl font-black text-slate-800 tracking-tight">Zero matches</h4>
          <p className="text-slate-500 max-w-xs mx-auto mt-4 text-lg">We checked your subjects, topics, and even your study notes.</p>
          <button onClick={() => navigate('/')} className="mt-8 text-indigo-600 font-black uppercase tracking-widest hover:underline">Back to Dashboard</button>
        </div>
      )}
    </div>
  );
};

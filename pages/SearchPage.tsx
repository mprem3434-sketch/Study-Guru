
import React, { useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.ts';
import { ArrowLeft, Search as SearchIcon, BookOpen, Layers, Play, FileText, ChevronRight, StickyNote } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { globalSearch } = useStore();
  const query = new URLSearchParams(location.search).get('q') || '';
  
  const results = useMemo(() => globalSearch(query), [query, globalSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 md:p-4 bg-white border border-slate-100 rounded-2xl md:rounded-3xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <div>
          <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight">Search Results</h2>
          <p className="text-[10px] md:text-base text-slate-500 font-medium">Found {results.length} matches for "{query}"</p>
        </div>
      </header>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((res, i) => (
            <div key={i} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
              {res.type === 'subject' && (
                <Link to={`/subject/${res.data.id}`} className="block h-full bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className={`w-9 h-9 md:w-14 md:h-14 ${res.data.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 flex-shrink-0`}>
                      <BookOpen size={16} className="md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5 block">Subject Entry</span>
                      <h3 className="text-lg md:text-2xl font-black text-slate-900 truncate">{res.data.name}</h3>
                    </div>
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                       <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              )}

              {res.type === 'topic' && (
                <Link to={`/topic/${res.data.id}`} className="block h-full bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-9 h-9 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 flex-shrink-0">
                      <Layers size={16} className="md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px] md:max-w-none">{res.subject.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Topic</span>
                      </div>
                      <h3 className="text-lg md:text-2xl font-black text-slate-900 truncate">{res.data.name}</h3>
                    </div>
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                       <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              )}

              {res.type === 'material' && (
                <Link to={`/topic/${res.data.topicId}`} className="block h-full bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-9 h-9 md:w-14 md:h-14 bg-slate-50 text-slate-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 flex-shrink-0">
                        {res.data.type === 'VIDEO' ? <Play size={16} className="fill-current md:w-6 md:h-6" /> : res.data.type === 'PDF' ? <FileText size={16} className="md:w-6 md:h-6" /> : <StickyNote size={16} className="md:w-6 md:h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px] md:max-w-none">{res.topic.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{res.data.type}</span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 truncate">{res.data.title}</h3>
                        </div>
                    </div>
                    {res.data.notes && res.data.notes.toLowerCase().includes(query.toLowerCase()) && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-xs md:text-sm text-slate-600 italic leading-relaxed">
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
        <div className="text-center py-20 md:py-32 bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm px-6">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
            <SearchIcon size={40} className="md:w-16 md:h-16" />
          </div>
          <h4 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Zero matches</h4>
          <p className="text-sm md:text-lg text-slate-500 max-w-xs mx-auto mt-4 leading-relaxed">We checked your subjects, topics, and even your study notes.</p>
          <button onClick={() => navigate('/')} className="mt-8 text-indigo-600 font-black text-xs md:text-sm uppercase tracking-widest hover:underline">Back to Dashboard</button>
        </div>
      )}
    </div>
  );
};

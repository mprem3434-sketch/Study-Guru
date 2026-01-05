
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Star, ArrowRight, Video, FileText, Bookmark } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { state } = useStore();

  const favoriteMaterials = state.subjects.flatMap(s => 
    s.topics.flatMap(t => t.materials.filter(m => m.isFavorite).map(m => ({ ...m, subjectName: s.name, subjectColor: s.color })))
  );

  const pinnedTopics = state.subjects.flatMap(s => 
    s.topics.filter(t => t.isPinned).map(t => ({ ...t, subjectName: s.name, subjectColor: s.color }))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Favorites</h2>
        <p className="text-slate-500">Your most important study assets</p>
      </header>

      {pinnedTopics.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="text-indigo-500" size={20} />
            Pinned Topics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pinnedTopics.map(topic => (
              <Link 
                key={topic.id} 
                to={`/topic/${topic.id}`}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${topic.subjectColor}`}></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{topic.subjectName}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">{topic.name}</h4>
                  <p className="text-xs text-slate-500">{topic.materials.length} Materials</p>
                </div>
                <ArrowRight size={20} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Star className="text-amber-500 fill-amber-500" size={20} />
          Starred Materials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteMaterials.length > 0 ? (
            favoriteMaterials.map(m => (
              <Link 
                key={m.id} 
                to={`/topic/${m.topicId}`}
                className="group bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm`}>
                    {m.type === 'VIDEO' ? <Video size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{m.title}</h4>
                    <p className="text-xs text-slate-400 font-medium uppercase">{m.subjectName}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{m.type}</span>
                  <span className="text-[10px] text-slate-400">View Content</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
              <Star className="mx-auto text-slate-200 mb-4" size={48} />
              <h4 className="font-bold text-slate-400">No starred materials</h4>
              <p className="text-slate-500 text-sm">Star materials during your study sessions to see them here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { SUBJECT_ICONS } from '../constants';
import { 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Circle,
  Pin,
  Search,
  BookOpen,
  X,
  Clock,
  ArrowUpDown,
  Trash2,
  ChevronRight,
  Filter
} from 'lucide-react';

export const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, updateState, addTopic, togglePinTopic, toggleTopicCompletion } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [sortBy, setSortBy] = useState<'name' | 'pinned' | 'completion'>('pinned');
  
  const subject = state.subjects.find(s => s.id === id);
  if (!subject) return <div className="p-8 text-center">Subject not found</div>;

  const Icon = SUBJECT_ICONS.find(i => i.id === subject.icon)?.component;

  const deleteTopic = (topicId: string) => {
    if(!confirm("Delete this topic and all its materials?")) return;
    const newState = { ...state };
    const subIdx = newState.subjects.findIndex(s => s.id === id);
    newState.subjects[subIdx].topics = newState.subjects[subIdx].topics.filter(t => t.id !== topicId);
    updateState(newState);
  };

  const handleAddTopic = () => {
    if (!newTopic.name.trim()) return;
    addTopic(subject.id, newTopic.name, newTopic.description);
    setNewTopic({ name: '', description: '' });
    setIsModalOpen(false);
  };

  const filteredTopics = useMemo(() => {
    let list = subject.topics.filter(t => 
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
  }, [subject.topics, search, sortBy]);

  const completedCount = subject.topics.filter(t => t.isCompleted).length;
  const progressPercent = subject.topics.length > 0 ? Math.round((completedCount / subject.topics.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <button 
                onClick={() => navigate(-1)} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-90"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</span>
                <button 
                    onClick={() => setSortBy(sortBy === 'name' ? 'pinned' : sortBy === 'pinned' ? 'completion' : 'name')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all"
                >
                    <ArrowUpDown size={14} />
                    {sortBy}
                </button>
            </div>
        </div>
        
        <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 ${subject.color} rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100`}>
              {Icon}
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{subject.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-slate-500 font-bold">{subject.topics.length} Chapters</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                <span className="text-indigo-600 font-black uppercase tracking-widest text-[10px]">{completedCount} Completed</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
             <div className="flex justify-between w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Mastery</span>
                <span>{progressPercent}%</span>
             </div>
             <div className="w-32 h-2.5 bg-slate-50 rounded-full overflow-hidden">
                <div className={`h-full ${subject.color} rounded-full transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
             </div>
          </div>
        </div>
      </header>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Filter topics by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-[2rem] pl-14 pr-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTopics.length > 0 ? (
          filteredTopics.map(topic => (
            <div 
              key={topic.id}
              className={`group relative bg-white p-6 rounded-[2.5rem] border transition-all hover:shadow-xl hover:-translate-y-1 ${topic.isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => toggleTopicCompletion(topic.id)}
                  className={`transition-all active:scale-90 flex-shrink-0 ${topic.isCompleted ? 'text-emerald-500' : 'text-slate-100 group-hover:text-indigo-200'}`}
                >
                  {topic.isCompleted ? <CheckCircle2 size={40} /> : <Circle size={40} />}
                </button>
                
                <Link to={`/topic/${topic.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className={`font-black text-2xl truncate ${topic.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {topic.name}
                    </h4>
                    {topic.isPinned && <Pin size={18} className="text-indigo-500 fill-indigo-500" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={14} className="text-slate-300" />
                      <span>{topic.materials.length} Assets</span>
                    </div>
                    {topic.lastStudiedAt && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        <span>Last studied {new Date(topic.lastStudiedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={() => togglePinTopic(topic.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${topic.isPinned ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400'}`}
                  >
                    <Pin size={22} className={topic.isPinned ? 'fill-current' : ''} />
                  </button>
                  <button 
                    onClick={() => deleteTopic(topic.id)}
                    className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={22} />
                  </button>
                  <Link to={`/topic/${topic.id}`} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <ChevronRight size={22} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-white rounded-[4rem] border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <BookOpen size={64} />
            </div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">Empty Chapter List</h4>
            <p className="text-slate-500 max-w-xs mx-auto mt-4 leading-relaxed font-medium">Add topics to start building your knowledge base for this subject.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-8 md:bottom-12 md:right-12 w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        <Plus size={40} />
      </button>

      {/* Add Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-900">New Topic</h3>
                <p className="text-slate-400 font-medium">Add a new chapter to {subject.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Chapter Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTopic.name}
                  onChange={e => setNewTopic({...newTopic, name: e.target.value})}
                  placeholder="e.g. Newton's 3rd Law"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:ring-0 focus:border-indigo-500 outline-none transition-all font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Brief Summary</label>
                <textarea 
                  value={newTopic.description}
                  onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                  placeholder="What will you learn in this unit?"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:ring-0 focus:border-indigo-500 outline-none h-32 resize-none transition-all font-medium"
                />
              </div>
            </div>

            <button 
              onClick={handleAddTopic}
              className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Add to Curriculum
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

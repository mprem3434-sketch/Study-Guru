
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../constants';
import { Plus, MoreVertical, Trash2, Edit2, LayoutGrid, List as ListIcon, X } from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { state, addSubject, deleteSubject } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0].id });

  const handleAdd = () => {
    if (!newSub.name.trim()) return;
    addSubject(newSub.name, newSub.color, newSub.icon);
    setNewSub({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0].id });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Subjects</h2>
          <p className="text-slate-500">Manage your study curriculum</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {state.subjects.map(s => {
            const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component;
            const completed = s.topics.filter(t => t.isCompleted).length;
            const progress = s.topics.length > 0 ? Math.round((completed / s.topics.length) * 100) : 0;

            return (
              <div key={s.id} className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-4">
                <Link to={`/subject/${s.id}`} className="absolute inset-0 z-0 rounded-[2rem]"></Link>
                <div className={`w-16 h-16 ${s.color} rounded-3xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 z-10`}>
                  {Icon}
                </div>
                <div className="z-10">
                  <h4 className="font-bold text-slate-800 text-lg">{s.name}</h4>
                  <p className="text-sm text-slate-500">{s.topics.length} Topics</p>
                </div>
                <div className="w-full space-y-2 z-10">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); deleteSubject(s.id); }}
                  className="absolute top-2 right-2 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {state.subjects.map(s => {
            const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component;
            return (
              <Link key={s.id} to={`/subject/${s.id}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-sm transition-all group">
                <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                  {Icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{s.name}</h4>
                  <p className="text-xs text-slate-500">{s.topics.length} topics</p>
                </div>
                <button className="p-2 text-slate-300 group-hover:text-slate-500">
                  <MoreVertical size={20} />
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">New Subject</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                <input 
                  type="text" 
                  value={newSub.name}
                  onChange={e => setNewSub({...newSub, name: e.target.value})}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Choose Icon</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_ICONS.map(icon => (
                    <button 
                      key={icon.id}
                      onClick={() => setNewSub({...newSub, icon: icon.id})}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${newSub.icon === icon.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {icon.component}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Choose Color</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => setNewSub({...newSub, color})}
                      className={`w-8 h-8 rounded-full ${color} transition-all ${newSub.color === color ? 'ring-4 ring-offset-2 ring-indigo-500' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Create Subject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

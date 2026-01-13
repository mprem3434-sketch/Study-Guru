import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.ts';
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../constants.tsx';
import { 
  Plus, 
  Trash2, 
  LayoutGrid, 
  List as ListIcon, 
  X, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight,
  Cpu,
  Zap,
  Box,
  Layers,
  Activity,
  Loader2,
  Filter,
  User,
  Layout,
  GraduationCap
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { state, isLoaded, addSubject, deleteSubject } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0].id, targetClass: '' });
  
  // Admin Filter State
  const [adminClassFilter, setAdminClassFilter] = useState('ALL');
  // Student Teacher Filter State
  const [studentTeacherFilter, setStudentTeacherFilter] = useState('ALL');

  const isAdmin = state.currentUser?.role === 'ADMIN';
  const isTeacher = state.currentUser?.role === 'TEACHER';
  const isStudent = state.currentUser?.role === 'USER';

  // Get assigned classes for teacher to populate dropdown (parse new format)
  const teacherAssignedClasses = useMemo(() => {
      const rawAssignments = state.currentUser?.assignedClasses || [];
      const classes = new Set<string>();
      rawAssignments.forEach(assign => {
          const cls = assign.split(' - ')[0].trim();
          if (cls) classes.add(cls);
      });
      return Array.from(classes);
  }, [state.currentUser?.assignedClasses]);

  // Get teacher's specific subjects (e.g. Maths, Science)
  const teacherSpecializations = state.currentUser?.subjects || [];

  const handleAdd = () => {
    if (!newSub.name.trim()) return;
    
    let finalTargetClass = newSub.targetClass;

    // Handle Class Auto-selection or Validation
    if (!finalTargetClass) {
        if (isTeacher && teacherAssignedClasses.length === 1) {
            finalTargetClass = teacherAssignedClasses[0];
        } else if (isTeacher && teacherAssignedClasses.length === 0) {
            alert("You are not assigned to any classes. Contact Admin.");
            return;
        } else if ((isAdmin || isTeacher) && !finalTargetClass) {
            alert("Please select a target class.");
            return;
        }
    }
    
    // DUPLICATE CHECK: Prevent creating the same subject for the same class again
    const duplicateExists = state.subjects.some(sub => 
        sub.name.toLowerCase() === newSub.name.trim().toLowerCase() && 
        sub.targetClass === finalTargetClass
    );

    if (duplicateExists) {
        alert(`Error: '${newSub.name}' module already exists for Class ${finalTargetClass}.`);
        return;
    }

    addSubject(newSub.name, newSub.color, newSub.icon, finalTargetClass);
    setNewSub({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0].id, targetClass: '' });
    setIsModalOpen(false);
  };

  const filteredSubjects = useMemo(() => {
      let subjects = [];

      if (isStudent) {
          // Students only see subjects for their specific class AND only if created by a teacher/admin
          subjects = state.subjects.filter(s => !!s.createdBy && s.targetClass === state.currentUser?.studentClass);
          
          // Apply Student's Teacher Filter
          if (studentTeacherFilter !== 'ALL') {
              subjects = subjects.filter(s => s.createdBy === studentTeacherFilter);
          }
      } else if (isTeacher) {
          // Teachers see subjects for classes they are assigned to
          subjects = state.subjects.filter(s => teacherAssignedClasses.includes(s.targetClass));
      } else if (isAdmin) {
          // Admin sees everything, optionally filtered
          if (adminClassFilter === 'ALL') {
              subjects = state.subjects;
          } else {
              subjects = state.subjects.filter(s => s.targetClass === adminClassFilter);
          }
      }
      return subjects;
  }, [state.subjects, isStudent, isTeacher, isAdmin, state.currentUser, teacherAssignedClasses, adminClassFilter, studentTeacherFilter]);

  // Extract unique teachers available for the current student view
  const availableTeachersForStudent = useMemo(() => {
      if (!isStudent) return [];
      const classSubjects = state.subjects.filter(s => !!s.createdBy && s.targetClass === state.currentUser?.studentClass);
      const teachers = classSubjects.map(s => s.createdBy).filter(Boolean) as string[];
      return [...new Set(teachers)];
  }, [state.subjects, isStudent, state.currentUser]);

  const CLASS_OPTIONS = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Module Index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-32 md:pb-16 px-1">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                <Sparkles size={14} fill="currentColor" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Core Curriculum</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Modules</h2>
          {isStudent && <p className="text-xs text-slate-500 font-bold mt-1">Class {state.currentUser?.studentClass} Content</p>}
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          
          {/* Admin Class Filter */}
          {isAdmin && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-2 mr-2">
                  <Filter size={14} className="text-slate-400" />
                  <select 
                    value={adminClassFilter}
                    onChange={(e) => setAdminClassFilter(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-700 outline-none bg-transparent py-2 cursor-pointer"
                  >
                      <option value="ALL">All Classes</option>
                      {CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
              </div>
          )}

          {/* Student Teacher Filter */}
          {isStudent && availableTeachersForStudent.length > 0 && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-2 mr-2">
                  <GraduationCap size={14} className="text-slate-400" />
                  <select 
                    value={studentTeacherFilter}
                    onChange={(e) => setStudentTeacherFilter(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-700 outline-none bg-transparent py-2 max-w-[120px] truncate cursor-pointer"
                  >
                      <option value="ALL">All Faculty</option>
                      {availableTeachersForStudent.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              </div>
          )}

          <div className="hidden md:flex glass-panel p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
          
          {(isAdmin || (isTeacher && teacherAssignedClasses.length > 0)) && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-6 bg-indigo-600 text-white rounded-2xl shadow-[0_15px_30px_rgba(79,70,229,0.25)] flex items-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 group font-black text-[10px] uppercase tracking-widest"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span>Init Module</span>
            </button>
          )}
        </div>
      </header>

      {filteredSubjects.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-100 shadow-sm">
              <Box size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-300 tracking-tight px-4">No Modules Found</h4>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest max-w-[200px] mx-auto mt-2 leading-relaxed px-4">
                {isStudent ? `No content available for Class ${state.currentUser?.studentClass} matching current filters.` : "Initialize a module to begin."}
            </p>
          </div>
      ) : (
        viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredSubjects.map((s, idx) => {
                const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component;
                const completed = s.topics.filter(t => t.isCompleted).length;
                const progress = s.topics.length > 0 ? Math.round((completed / s.topics.length) * 100) : 0;
                const themeColor = s.color.replace('bg-', 'text-');

                return (
                <div 
                    key={s.id} 
                    className="group relative glass-panel gloss-reflection rounded-[2rem] border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 80}ms` }}
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full transition-all duration-700 group-hover:scale-[3] ${s.color}`} />
                    
                    <Link to={`/subject/${s.id}`} className="block p-6 h-full relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-6`}>
                        {Icon && React.cloneElement(Icon as React.ReactElement<any>, { size: 22, strokeWidth: 2.5 })}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.topics.length} Units</span>
                            </div>
                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Class {s.targetClass}</span>
                        </div>
                    </div>
                    
                    <div className="mb-6 space-y-0.5">
                        <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight truncate group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                        {s.createdBy && <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-1"><User size={8} /> {s.createdBy}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                        <p className={`text-[9px] font-black ${themeColor}`}>{progress}% Mastery</p>
                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-white">
                        <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    </Link>

                    {isAdmin && (
                    <button 
                        onClick={(e) => { e.preventDefault(); deleteSubject(s.id); }}
                        className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-md rounded-lg text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100"
                    >
                        <Trash2 size={14} />
                    </button>
                    )}
                </div>
                );
            })}
            
            {(isAdmin || (isTeacher && teacherAssignedClasses.length > 0)) && (
                <button 
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-400 hover:bg-indigo-50/10 transition-all group relative min-h-[200px]"
                >
                <div className="w-12 h-12 bg-white shadow-sm text-slate-300 rounded-xl flex items-center justify-center mb-3 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 group-hover:scale-110">
                    <Plus size={24} />
                </div>
                <span className="font-black text-[8px] text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-900">Initialize</span>
                </button>
            )}
            </div>
        ) : (
            <div className="space-y-3 max-w-4xl">
            {filteredSubjects.map((s) => {
                const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component;
                return (
                <Link 
                    key={s.id} 
                    to={`/subject/${s.id}`} 
                    className="flex items-center gap-5 glass-panel p-4 rounded-[1.5rem] border border-white hover:shadow-lg hover:translate-x-1 transition-all group"
                >
                    <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center text-white shadow-md shrink-0`}>
                    {Icon && React.cloneElement(Icon as React.ReactElement<any>, { size: 18 })}
                    </div>
                    <div className="flex-1 truncate">
                    <h4 className="font-black text-slate-900 text-base tracking-tight truncate">{s.name}</h4>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Class {s.targetClass} • {s.topics.length} Sections</p>
                    {s.createdBy && <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">By {s.createdBy}</p>}
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </Link>
                );
            })}
            </div>
        )
      )}

      {/* MICRO-CONSOLE "INITIALIZE SUBJECT" MODAL (RESIZED TO MINIMUM FOOTPRINT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="glass-panel gloss-reflection w-full max-w-[310px] rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/50 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col relative">
            
            {/* Ultra-Vivid Header Hub */}
            <div className={`w-full h-20 p-5 flex items-center justify-between relative overflow-hidden text-white transition-all duration-700 ${newSub.color.replace('bg-', 'bg-').replace('-500', '-600')}`}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.4),_transparent_60%)] animate-pulse" />
               
               <div className="relative z-10 flex flex-col justify-center">
                  <div className="flex items-center gap-1 opacity-80 mb-0.5">
                     <Activity size={10} className="animate-pulse" />
                     <span className="text-[7px] font-black uppercase tracking-[0.3em]">Initialize Hub</span>
                  </div>
                  <h3 className="text-base font-black tracking-tighter truncate max-w-[150px] leading-none">
                    {newSub.name || 'Protocol Link'}
                  </h3>
               </div>

               <div className="relative z-10 w-10 h-10 bg-white/95 rounded-xl flex items-center justify-center text-slate-900 shadow-2xl transition-transform duration-700 group-hover:scale-110">
                  {React.cloneElement(SUBJECT_ICONS.find(i => i.id === newSub.icon)?.component as React.ReactElement<any>, { 
                    size: 20, 
                    className: `${newSub.color.replace('bg-', 'text-')} transition-transform duration-500` 
                  })}
               </div>
            </div>

            {/* Hyper-Compact Control Grid */}
            <div className="p-5 bg-white/95 backdrop-blur-2xl flex flex-col gap-4">
              
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1 flex items-center gap-1.5">
                  <Zap size={9} className="text-indigo-400" /> Identity
                </label>
                
                {/* RESTRICTED INPUT FOR TEACHERS */}
                {isTeacher ? (
                    <select
                        autoFocus
                        value={newSub.name}
                        onChange={e => setNewSub({...newSub, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-400/40 outline-none transition-all cursor-pointer"
                    >
                        <option value="">Select Permitted Subject</option>
                        {teacherSpecializations.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                      autoFocus
                      type="text" 
                      value={newSub.name}
                      onChange={e => setNewSub({...newSub, name: e.target.value})}
                      placeholder="Designate Label..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-200"
                    />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1 flex items-center gap-1.5">
                  <Layout size={9} className="text-indigo-400" /> Target Class
                </label>
                <select 
                  value={newSub.targetClass}
                  onChange={e => setNewSub({...newSub, targetClass: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-400/40 outline-none transition-all"
                >
                    <option value="">Select Target Class</option>
                    {isTeacher ? (
                        teacherAssignedClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)
                    ) : (
                        CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)
                    )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Iconic Mask</label>
                <div className="grid grid-cols-5 gap-1">
                  {SUBJECT_ICONS.map((icon) => (
                    <button 
                      key={icon.id}
                      onClick={() => setNewSub({...newSub, icon: icon.id})}
                      className={`aspect-square flex items-center justify-center rounded-lg transition-all ${newSub.icon === icon.id ? 'bg-slate-900 text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
                    >
                      {React.cloneElement(icon.component as React.ReactElement<any>, { size: 12 })}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Chroma Signature</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_COLORS.map((color) => (
                    <button 
                      key={color}
                      onClick={() => setNewSub({...newSub, color})}
                      className={`w-6 h-6 rounded-full ${color} transition-all relative ${newSub.color === color ? 'scale-110 ring-1 ring-offset-1 ring-slate-900 shadow-md' : 'opacity-30 hover:opacity-100 hover:scale-105'}`}
                    >
                       {newSub.color === color && <div className="absolute inset-0 rounded-full border border-white/50 animate-ping" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleAdd}
                  disabled={!newSub.targetClass || !newSub.name}
                  className={`w-full py-3 rounded-xl font-black text-[8px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-white ${newSub.color} hover:brightness-110 relative overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10">Confirm Initialize</span>
                  <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Tiny Close Controller */}
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-2 right-2 w-5 h-5 bg-white/10 backdrop-blur-md text-white/50 rounded-full flex items-center justify-center transition-all hover:bg-white hover:text-slate-900 z-50 group border border-white/10 hover:border-white/20"
            >
              <X size={10} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

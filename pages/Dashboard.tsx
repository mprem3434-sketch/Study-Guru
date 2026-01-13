
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.ts';
import { ProgressRing } from '../components/ProgressRing.tsx';
import { SUBJECT_ICONS } from '../constants.tsx';
import { 
  Play, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Star,
  Zap,
  FileText,
  Video,
  Clock,
  Layout,
  Trophy,
  ArrowRight,
  Sparkles,
  Flame,
  Target
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = useStore();
  const isStudent = state.currentUser?.role === 'USER';

  // Filter subjects for students: only show those created by someone (Teacher/Admin) and matching their class
  const visibleSubjects = useMemo(() => {
    if (isStudent) {
      return state.subjects.filter(s => !!s.createdBy && s.targetClass === state.currentUser?.studentClass);
    }
    return state.subjects;
  }, [state.subjects, state.currentUser, isStudent]);
  
  const totalTopics = visibleSubjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = visibleSubjects.reduce((acc, s) => acc + s.topics.filter(t => t.isCompleted).length, 0);
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const stats = state.stats.dailyStudyTime[today] || { totalMinutes: 0, pdfMinutes: 0, videoMinutes: 0, noteMinutes: 0 };

  const recentMaterials = state.recentlyOpened.map(id => {
    for (const sub of visibleSubjects) {
      for (const topic of sub.topics) {
        const mat = topic.materials.find(m => m.id === id);
        if (mat) return { ...mat, subjectName: sub.name, subjectColor: sub.color, topicName: topic.name };
      }
    }
    return null;
  }).filter(m => m !== null);

  return (
    <div className="space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 overflow-x-hidden">
      
      {/* Mobile Greeting - Vibrant Header */}
      <header className="px-1 relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-indigo-600 rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-200">
              <Flame size={12} className="text-orange-300 fill-current animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">{state.stats.currentStreak} Day Streak</span>
            </div>
            <div className="px-3 py-1 bg-amber-100 rounded-full flex items-center gap-1.5 border border-amber-200">
              <Sparkles size={12} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Daily Pro</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Level up your <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Expertise.</span>
          </h2>
        </div>
      </header>

      {/* Main Stats Pod - Glossy Centerpiece */}
      <section className="px-1">
        <div className="glass-panel gloss-reflection rounded-[2.5rem] p-6 relative overflow-hidden group shadow-xl shadow-indigo-100/40">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-400/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex-shrink-0 bg-white/60 p-4 rounded-3xl border border-white shadow-inner">
              <ProgressRing progress={progressPercent} size={110} strokeWidth={10}>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{progressPercent}%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Mastery</span>
                </div>
              </ProgressRing>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Focus</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{stats.totalMinutes}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase">min</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-white shadow-inner">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.totalMinutes/60)*100, 100)}%` }} />
              </div>
              <p className="text-[9px] font-medium text-slate-500">Goal: 60 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Chips - Vibrant Grid */}
      <section className="grid grid-cols-2 gap-3 px-1">
        <StatChip 
          icon={<Zap size={18} />} 
          label="Boost Points" 
          value="1,240" 
          color="indigo" 
          delay="delay-75"
        />
        <StatChip 
          icon={<Target size={18} />} 
          label="Topic Goal" 
          value={`${completedTopics}/${totalTopics}`} 
          color="emerald" 
          delay="delay-100"
        />
      </section>

      {/* Horizontal Resume Deck - Colorful & Glossy */}
      {recentMaterials.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Play size={16} className="text-indigo-600 fill-current" />
              Resume Now
            </h3>
            <Link to="/downloads" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">See All</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto hide-scrollbar px-1 pb-4">
            {recentMaterials.map((m: any, idx) => (
              <Link 
                key={m.id} 
                to={`/topic/${m.topicId}`}
                className={`flex-shrink-0 w-[260px] glass-panel p-5 rounded-[2rem] border-white/60 hover:shadow-2xl active:scale-95 transition-all group animate-in slide-in-from-right-4 duration-500`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 ${m.subjectColor} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-active:scale-90`}>
                    {m.type === 'VIDEO' ? <Video size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{m.subjectName}</p>
                    <h4 className="font-black text-slate-800 text-sm truncate leading-tight mt-0.5">{m.title}</h4>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Progress</span>
                    <span className="text-indigo-600">{Math.round(m.progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100/50 rounded-full overflow-hidden border border-white">
                    <div className={`h-full ${m.subjectColor} rounded-full transition-all duration-1000`} style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Subjects Stack - High Contrast & Glossy */}
      <section className="space-y-5 px-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Layout size={16} className="text-emerald-500" />
            Study Modules
          </h3>
        </div>

        <div className="space-y-4">
          {visibleSubjects.sort((a,b) => a.position - b.position).slice(0, 3).map((s, idx) => {
            const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component || <BookOpen size={20} />;
            const completed = s.topics.filter(t => t.isCompleted).length;
            const progress = s.topics.length > 0 ? Math.round((completed / s.topics.length) * 100) : 0;
            
            return (
              <Link 
                key={s.id} 
                to={`/subject/${s.id}`}
                className="group glass-panel p-5 rounded-[2rem] border-white/60 hover:shadow-xl active:scale-[0.98] transition-all flex items-center gap-5 animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className={`w-16 h-16 ${s.color} rounded-[1.5rem] flex items-center justify-center text-white shadow-xl flex-shrink-0 group-active:rotate-3 transition-transform`}>
                  {React.cloneElement(Icon as React.ReactElement<any>, { size: 28 })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 text-lg truncate tracking-tight mb-1">{s.name}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-50/50 rounded-full overflow-hidden border border-white">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{progress}%</span>
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-active:bg-indigo-600 group-active:text-white transition-all shadow-sm">
                  <ChevronRight size={20} />
                </div>
              </Link>
            );
          })}
        </div>
        
        {visibleSubjects.length > 3 && (
          <Link to="/subjects" className="block w-full text-center py-4 bg-white/50 rounded-2xl border border-white font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
            View all {visibleSubjects.length} Subjects
          </Link>
        )}
      </section>
    </div>
  );
};

const StatChip = ({ icon, label, value, color, delay }: { icon: React.ReactNode, label: string, value: string | number, color: 'indigo' | 'emerald', delay: string }) => {
  const themes = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600'
  };

  return (
    <div className={`glass-panel p-5 rounded-[2rem] border-white/60 flex flex-col gap-3 group animate-in slide-in-from-bottom-4 duration-500 ${delay}`}>
      <div className={`w-10 h-10 ${themes[color]} rounded-xl flex items-center justify-center transition-transform group-active:scale-110`}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

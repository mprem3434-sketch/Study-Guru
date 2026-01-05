import React from 'react';
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
  Layout
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = useStore();
  
  const totalTopics = state.subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = state.subjects.reduce((acc, s) => acc + s.topics.filter(t => t.isCompleted).length, 0);
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  const today = new Date().toISOString().split('T')[0];
  const stats = state.stats.dailyStudyTime[today] || { totalMinutes: 0, pdfMinutes: 0, videoMinutes: 0, noteMinutes: 0 };

  const recentMaterials = state.recentlyOpened.map(id => {
    for (const sub of state.subjects) {
      for (const topic of sub.topics) {
        const mat = topic.materials.find(m => m.id === id);
        if (mat) return { ...mat, subjectName: sub.name, subjectColor: sub.color, topicName: topic.name };
      }
    }
    return null;
  }).filter(m => m !== null);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Study Session</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Study Pulse</h2>
          <p className="text-slate-500 mt-2 font-medium max-w-md leading-relaxed">
            {stats.totalMinutes > 0 
                ? `You've clocked ${stats.totalMinutes} minutes today. You're outperforming 85% of peers!` 
                : "The journey of a thousand miles begins with a single step. Start your session!"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today</span>
             <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Calendar size={20} />
          </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Layout size={24} />
             </div>
             <ProgressRing progress={progressPercent} size={56} strokeWidth={6}>
                <span className="text-[10px] font-black">{progressPercent}%</span>
             </ProgressRing>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Total Coverage</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black text-slate-900">{completedTopics}</span>
               <span className="text-slate-400 font-bold">/ {totalTopics} Units</span>
            </div>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
              <Clock size={24} />
            </div>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
          <div className="space-y-4">
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Reading</span>
                  <span>{stats.pdfMinutes}m</span>
               </div>
               <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.totalMinutes > 0 ? (stats.pdfMinutes / stats.totalMinutes) * 100 : 0}%` }} />
               </div>
             </div>
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Videos</span>
                  <span>{stats.videoMinutes}m</span>
               </div>
               <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats.totalMinutes > 0 ? (stats.videoMinutes / stats.totalMinutes) * 100 : 0}%` }} />
               </div>
             </div>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-all">
            <Zap size={40} className="fill-current" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Momentum</span>
            <div className="text-4xl font-black text-slate-900">{state.stats.currentStreak} <span className="text-lg text-slate-400">Days</span></div>
          </div>
        </div>
      </div>

      {/* Recently Opened Section */}
      {recentMaterials.length > 0 && (
        <section className="animate-in slide-in-from-bottom-8 duration-700 delay-150">
           <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Clock className="text-indigo-600" size={24} />
              Resume Studying
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 5 Assets</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentMaterials.map((m: any) => (
              <Link 
                key={m.id} 
                to={`/topic/${m.topicId}`}
                className="group bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col gap-4"
              >
                <div className={`w-12 h-12 ${m.subjectColor} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100/20 group-hover:scale-110 transition-transform`}>
                  {m.type === 'VIDEO' ? <Video size={20} /> : <FileText size={20} />}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">{m.title}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <p className="text-[10px] text-slate-400 font-black uppercase truncate">{m.topicName}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Progress</span>
                    <span>{Math.round(m.progress)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${m.subjectColor} rounded-full transition-all duration-700`} style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Subject Map */}
      <section className="animate-in slide-in-from-bottom-8 duration-700 delay-300">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-2xl font-black text-slate-800">Organization Map</h3>
          <Link to="/subjects" className="px-5 py-2.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-100 transition-colors">Syllabus Overview</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {state.subjects.sort((a,b) => a.position - b.position).map(s => {
            const Icon = SUBJECT_ICONS.find(i => i.id === s.icon)?.component || <BookOpen size={20} />;
            const completed = s.topics.filter(t => t.isCompleted).length;
            const progress = s.topics.length > 0 ? Math.round((completed / s.topics.length) * 100) : 0;
            
            return (
              <Link 
                key={s.id} 
                to={`/subject/${s.id}`}
                className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center space-y-5"
              >
                <div className={`w-20 h-20 ${s.color} rounded-[2.2rem] flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110 shadow-indigo-100/30`}>
                  {Icon}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{s.name}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{s.topics.length} Study Units</p>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Mastery</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${s.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
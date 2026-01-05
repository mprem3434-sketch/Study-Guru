
import React from 'react';
import { useStore } from '../store';
import { ProgressRing } from '../components/ProgressRing';
import { TrendingUp, Clock, BookCheck, Zap, Calendar } from 'lucide-react';
// Import DayStats for type safety in calculation
import { DayStats } from '../types';

export const StatsPage: React.FC = () => {
  const { state } = useStore();
  
  const totalTopics = state.subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = state.subjects.reduce((acc, s) => acc + s.topics.filter(t => t.isCompleted).length, 0);
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  // Fix: Explicitly cast to DayStats[] to resolve 'unknown' type error in reduce and enable arithmetic operations later
  const totalStudyMinutes = (Object.values(state.stats.dailyStudyTime) as DayStats[]).reduce((a, b) => a + b.totalMinutes, 0);
  const studyStreak = 12; // Mock streak

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500">Track your learning journey and productivity</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Clock className="text-blue-600" />} 
          label="Total Study Time" 
          value={`${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`} 
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={<BookCheck className="text-emerald-600" />} 
          label="Topics Completed" 
          value={`${completedTopics}/${totalTopics}`} 
          bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={<Zap className="text-amber-600" />} 
          label="Current Streak" 
          value={`${studyStreak} Days`} 
          bgColor="bg-amber-50"
        />
        <StatCard 
          icon={<TrendingUp className="text-indigo-600" />} 
          label="Avg. Daily Time" 
          value="52m" 
          bgColor="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
            Activity History
            <span className="text-sm font-normal text-slate-400">Last 7 Days</span>
          </h3>
          <div className="h-48 flex items-end justify-between gap-4 px-4">
            {[45, 60, 30, 90, 45, 120, 45].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-xl relative overflow-hidden flex items-end h-32">
                  <div 
                    className="w-full bg-indigo-500 transition-all group-hover:bg-indigo-600" 
                    style={{ height: `${(h / 120) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <h3 className="text-xl font-bold mb-6">Course Mastery</h3>
          <ProgressRing progress={progressPercent} size={160} strokeWidth={12}>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">{progressPercent}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Syllabus</div>
            </div>
          </ProgressRing>
          <div className="mt-8 space-y-3 w-full">
            {state.subjects.map(s => {
              const subComp = s.topics.filter(t => t.isCompleted).length;
              const subProg = s.topics.length > 0 ? (subComp / s.topics.length) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs font-bold text-slate-600 flex-1 text-left">{s.name}</span>
                  <span className="text-xs font-black text-slate-900">{Math.round(subProg)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

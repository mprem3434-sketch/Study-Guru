
import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, User, Shield, Cloud, Palette, Bell, HelpCircle, Save, Download, Upload, Zap, Check, Trash2, Database } from 'lucide-react';
import { ReaderTheme } from '../types';

export const SettingsPage: React.FC = () => {
  const { state, updateState, exportData, importData, clearAllDownloads } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const togglePro = () => {
    updateState({
      ...state,
      settings: { ...state.settings, isPro: !(state.settings as any).isPro } as any
    });
  };

  const handleCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    }, 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importData(event.target?.result as string);
        if (success) alert("Data restored successfully!");
        else alert("Failed to import backup file.");
      };
      reader.readAsText(file);
    }
  };

  const totalDownloads = state.subjects.reduce((acc, s) => 
    acc + s.topics.reduce((tacc, t) => tacc + t.materials.filter(m => m.isDownloaded).length, 0)
  , 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900">Settings</h2>
        <p className="text-slate-500">Customize your Study Guru experience</p>
      </header>

      {/* Pro Badge */}
      <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${ (state.settings as any).isPro ? 'bg-slate-900 border-slate-900 text-white' : 'bg-indigo-600 border-indigo-600 text-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md`}>
              <Zap size={28} className="text-yellow-400 fill-current" />
            </div>
            <div>
              <h3 className="text-2xl font-black">{(state.settings as any).isPro ? 'Pro Active' : 'Go Pro'}</h3>
              <p className="opacity-80">{(state.settings as any).isPro ? 'Enjoying all premium features' : 'Unlock themes & cloud sync'}</p>
            </div>
          </div>
          <button 
            onClick={togglePro}
            className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform"
          >
            {(state.settings as any).isPro ? 'Manage' : 'Upgrade'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <ProFeature icon={<Cloud size={16} />} label="Cloud Backup" />
          <ProFeature icon={<Palette size={16} />} label="Dark Themes" />
          <ProFeature icon={<Shield size={16} />} label="Ad-Free" />
          <ProFeature icon={<Zap size={16} />} label="Priority AI" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sync & Backup */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-xl font-bold flex items-center gap-3">
            <Cloud className="text-indigo-600" size={22} /> Cloud & Local Backup
          </h4>
          <div className="space-y-4">
            <button 
              onClick={handleCloudSync}
              disabled={isSyncing}
              className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all ${isSyncing ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}
            >
              <div className="flex items-center gap-4">
                {isSyncing ? <Zap size={24} className="text-indigo-600 animate-pulse" /> : showSyncSuccess ? <Check size={24} className="text-emerald-600" /> : <Cloud size={24} className="text-indigo-600" />}
                <div className="text-left">
                  <p className="font-bold text-slate-800">{isSyncing ? 'Syncing to Drive...' : showSyncSuccess ? 'Sync Complete!' : 'Sync to Google Drive'}</p>
                  <p className="text-xs text-slate-500">Last sync: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-indigo-400" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportData}
                className="p-5 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 flex flex-col items-center gap-3 shadow-sm transition-all"
              >
                <Download size={24} className="text-slate-600" />
                <span className="font-bold text-sm">Export Data</span>
              </button>
              <label className="p-5 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 flex flex-col items-center gap-3 shadow-sm transition-all cursor-pointer">
                <Upload size={24} className="text-slate-600" />
                <span className="font-bold text-sm">Import Data</span>
                <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
              </label>
            </div>
          </div>
        </section>

        {/* Display & Notifications */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-xl font-bold flex items-center gap-3">
            <Palette className="text-indigo-600" size={22} /> Preferences
          </h4>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Reader Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[ReaderTheme.LIGHT, ReaderTheme.SEPIA, ReaderTheme.DARK].map(t => (
                  <button 
                    key={t}
                    onClick={() => updateState({...state, settings: {...state.settings, readerTheme: t}})}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${state.settings.readerTheme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Study Notifications</p>
                  <p className="text-xs text-slate-500">Daily reminders to keep your streak</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storage Management Section - STEP 5 */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-xl font-bold flex items-center gap-3">
            <Database className="text-indigo-600" size={22} /> Storage Management
          </h4>
          <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
             <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                <span>Offline Cache Used</span>
                <span className="text-indigo-600">{totalDownloads * 15} MB</span>
             </div>
             <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((totalDownloads * 15 / 500) * 100, 100)}%` }} />
             </div>
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Storage limit (mock): 500MB</p>
          </div>
          <button 
            onClick={() => { if(confirm("Are you sure? This will remove all offline assets. You can re-download them later.")) clearAllDownloads(); }}
            className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
          >
            <Trash2 size={16} />
            Purge Offline Assets
          </button>
        </section>
      </div>

      <footer className="text-center py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Study Guru v4.0.0 Stable</p>
      </footer>
    </div>
  );
};

const ProFeature = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">{icon}</div>
    <span className="text-[10px] font-bold opacity-80">{label}</span>
  </div>
);

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

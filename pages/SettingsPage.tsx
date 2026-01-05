import React, { useState } from 'react';
import { useStore } from '../store.ts';
import { 
  Cloud, Palette, Download, Upload, Zap, Check, Trash2, 
  Database, Type, MousePointer2, Settings as SettingsIcon, Info
} from 'lucide-react';
import { ReaderTheme } from '../types.ts';

export const SettingsPage: React.FC = () => {
  const { state, updateState, exportData, importData, clearAllDownloads } = useStore();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const togglePro = () => {
    updateState({ ...state, settings: { ...state.settings, isPro: !state.settings.isPro } });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importData(event.target?.result as string);
        if (success) alert("Backup restored successfully!");
        else alert("Invalid backup file.");
      };
      reader.readAsText(file);
    }
  };

  const updateSetting = (key: string, value: any) => {
    updateState({
      ...state,
      settings: { ...state.settings, [key]: value }
    });
  };

  return (
    <div className={`space-y-10 animate-in fade-in duration-700 ${state.settings.reduceMotion ? 'animate-none' : ''}`}>
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-2 font-medium">Manage your accessibility, themes, and data.</p>
      </header>

      {/* Premium Badge */}
      <div className="p-8 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
              <Zap size={32} className="text-yellow-400 fill-current" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Pro Access</h3>
              <p className="opacity-60 font-medium">Cloud sync, offline modes, and early AI features.</p>
            </div>
          </div>
          <button 
            onClick={togglePro}
            className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            {state.settings.isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 7: Accessibility Settings */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <h4 className="text-xl font-black flex items-center gap-3">
            <Palette className="text-indigo-600" size={24} /> Appearance
          </h4>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Type size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Font Scale</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.8, 1, 1.2, 1.4].map(scale => (
                  <button 
                    key={scale}
                    onClick={() => updateSetting('fontScale', scale)}
                    className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${state.settings.fontScale === scale ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    {scale === 1 ? 'Normal' : `${scale * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <MousePointer2 size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Experience</p>
              </div>
              <button 
                onClick={() => updateSetting('reduceMotion', !state.settings.reduceMotion)}
                className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${state.settings.reduceMotion ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50'}`}
              >
                <div className="text-left">
                  <p className={`font-black text-sm ${state.settings.reduceMotion ? 'text-indigo-600' : 'text-slate-700'}`}>Reduce Motion</p>
                  <p className="text-xs text-slate-500 font-medium">Disables complex animations for performance.</p>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${state.settings.reduceMotion ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.settings.reduceMotion ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Backup & Storage */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <h4 className="text-xl font-black flex items-center gap-3">
            <Database className="text-indigo-600" size={24} /> Data Sovereignty
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportData}
                className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-indigo-50 group transition-all"
              >
                <Download size={24} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="font-black text-xs uppercase tracking-widest">Export Data</span>
              </button>
              <label className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-indigo-50 group transition-all cursor-pointer">
                <Upload size={24} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="font-black text-xs uppercase tracking-widest">Import Data</span>
                <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
              </label>
            </div>

            <button 
              onClick={() => { if(confirm("Are you sure? This removes all offline assets.")) clearAllDownloads(); }}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
            >
              <Trash2 size={16} /> Purge Cached Assets
            </button>
          </div>
        </section>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <Info size={24} />
          </div>
          <div>
            <p className="font-black text-sm text-slate-800 uppercase tracking-widest">System Architecture</p>
            <p className="text-xs text-slate-500 font-medium">Version 5.1.0 Stable Build</p>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Designed for Focused Learning</p>
      </div>
    </div>
  );
};
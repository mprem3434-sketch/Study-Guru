import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.ts';
import { GeminiGuru } from '../components/GeminiGuru.tsx';
import { 
  ArrowLeft, Video, FileText, Sparkles, Plus, X, Zap, Download, Eye, EyeOff, 
  ChevronRight, ExternalLink, Trash2, FilePlus, Loader2, 
  Clock, AlertCircle, Info, Lock, Share2
} from 'lucide-react';
import { MaterialType, ReaderTheme } from '../types.ts';

export const TopicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, addMaterial, updateMaterialProgress, saveMaterialNotes, deleteMaterial, trackStudyTime } = useStore();
  
  const [showGuru, setShowGuru] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', type: MaterialType.VIDEO, url: '' });
  const [focusMode, setFocusMode] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState(0); 
  const [showAccessHelp, setShowAccessHelp] = useState(false);
  
  const readerTheme = state.settings.readerTheme || ReaderTheme.LIGHT;
  const subject = state.subjects.find(s => s.topics.some(t => t.id === id));
  const topic = subject?.topics.find(t => t.id === id);

  if (!topic || !subject) return <div className="p-8 text-center text-slate-500">Topic not found</div>;

  const activeMaterial = topic.materials.find(m => m.id === (activeMaterialId || topic.materials[0]?.id));

  useEffect(() => {
    if (activeMaterial) {
        setCurrentNotes(activeMaterial.notes || "");
        if (activeMaterial.type === MaterialType.PDF) {
          setPdfLoading(true);
          setShowAccessHelp(false);
        }
    }
  }, [activeMaterial?.id]);

  useEffect(() => {
    let interval: number;
    if (focusMode) {
      interval = window.setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [focusMode]);

  const handleAddMaterial = () => {
    if (!newMat.title.trim()) return;
    addMaterial(id!, newMat.title, newMat.type, newMat.url);
    setNewMat({ title: '', type: MaterialType.VIDEO, url: '' });
    setIsAddMaterialModalOpen(false);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    
    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = cleanUrl.match(ytRegExp);
    const videoId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }

    // Google Drive
    if (cleanUrl.includes('drive.google.com')) {
        return cleanUrl.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview').replace(/\/open(\?.*)?$/, '/preview');
    }
    
    return cleanUrl;
  };

  const themeClasses = {
    [ReaderTheme.LIGHT]: 'bg-white text-slate-800',
    [ReaderTheme.DARK]: 'bg-slate-950 text-slate-200',
    [ReaderTheme.SEPIA]: 'bg-[#F4ECD8] text-[#5B4636]'
  };

  const pdfFilter = {
    [ReaderTheme.LIGHT]: 'none',
    [ReaderTheme.DARK]: 'invert(0.9) hue-rotate(180deg)',
    [ReaderTheme.SEPIA]: 'sepia(0.3) brightness(0.95)'
  };

  return (
    <div className={`transition-all duration-700 ${focusMode ? 'fixed inset-0 z-[100] bg-slate-950 overflow-y-auto pb-20' : 'space-y-6 max-w-6xl mx-auto pb-24 animate-in fade-in'}`} style={{ fontSize: `${state.settings.fontScale || 1}rem` }}>
      
      {focusMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
          <Clock size={16} className="text-emerald-400" />
          <span className="text-white font-black text-xs uppercase tracking-widest">{Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}</span>
        </div>
      )}

      <header className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 transition-all duration-500 ${focusMode ? 'py-6 bg-slate-900 border-b border-white/10 sticky top-0 z-[110]' : ''}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => focusMode ? setFocusMode(false) : navigate(-1)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${focusMode ? 'bg-white/10 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${subject.color}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subject.name}</span>
            </div>
            <h2 className={`text-2xl font-black ${focusMode ? 'text-white' : 'text-slate-900'}`}>{topic.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setFocusMode(!focusMode)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all shadow-sm ${focusMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
              {focusMode ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="font-black text-[10px] uppercase tracking-widest hidden sm:inline">{focusMode ? 'Exit' : 'Focus'}</span>
          </button>
          {!focusMode && (
            <button onClick={() => setShowGuru(!showGuru)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-105 transition-all">
              <Sparkles size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Guru AI</span>
            </button>
          )}
        </div>
      </header>

      <div className={`grid grid-cols-1 ${focusMode ? 'max-w-screen-xl mx-auto py-8 px-4' : 'lg:grid-cols-3'} gap-8 px-4`}>
        <div className={`${focusMode ? 'w-full' : 'lg:col-span-2'} space-y-6`}>
          {activeMaterial ? (
            <div className={`overflow-hidden transition-all duration-500 ${focusMode ? 'rounded-[3rem] shadow-2xl' : 'bg-white rounded-[2.5rem] shadow-xl border border-slate-100'}`}>
              <div className={`relative flex flex-col items-center justify-center transition-colors duration-500 ${focusMode ? 'min-h-[90vh]' : (activeMaterial.type === MaterialType.PDF ? 'min-h-[850px]' : 'aspect-video')} ${themeClasses[readerTheme]}`}>
                
                {activeMaterial.type === MaterialType.VIDEO ? (
                  <div className="w-full h-full relative">
                    <iframe 
                      src={getEmbedUrl(activeMaterial.url)} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title={activeMaterial.title}
                    />
                  </div>
                ) : activeMaterial.type === MaterialType.PDF ? (
                  <div className="w-full h-full flex flex-col relative flex-1">
                    {pdfLoading && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white">
                        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                        <p className="font-black animate-pulse uppercase text-[10px] tracking-widest mb-6">Resolving Document...</p>
                        
                        <div className="max-w-xs text-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <Lock className="mx-auto mb-3 text-amber-500" size={24} />
                          <p className="text-[11px] text-slate-600 font-bold leading-relaxed mb-4">Seeing a "Request Access" message?</p>
                          <button 
                            onClick={() => setShowAccessHelp(true)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
                          >
                            Permission Doctor
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <iframe 
                      src={getEmbedUrl(activeMaterial.url)} 
                      className="w-full h-full flex-1 border-none z-10" 
                      onLoad={() => setPdfLoading(false)} 
                      title={activeMaterial.title} 
                      style={{ filter: pdfFilter[readerTheme], minHeight: focusMode ? 'calc(90vh - 80px)' : '750px' }} 
                    />

                    {showAccessHelp && (
                      <div className="absolute inset-0 z-[60] bg-white/98 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in zoom-in-95">
                        <div className="max-w-md space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-indigo-50">
                          <div className="flex items-center gap-4 text-amber-500">
                             <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <AlertCircle size={32} />
                             </div>
                             <h3 className="text-2xl font-black text-slate-900 leading-tight">Unlock Your Document</h3>
                          </div>
                          
                          <div className="space-y-6 text-slate-600">
                             <p className="font-bold text-sm">Follow these 3 steps in Google Drive to fix the access error:</p>
                             <div className="space-y-4">
                               <div className="flex gap-4">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
                                  <p className="text-xs font-medium">Right-click file & select <strong className="text-indigo-600">Share</strong></p>
                               </div>
                               <div className="flex gap-4">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
                                  <p className="text-xs font-medium">Under General Access, change "Restricted" to <strong className="text-indigo-600">"Anyone with the link"</strong></p>
                               </div>
                               <div className="flex gap-4">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">3</div>
                                  <p className="text-xs font-medium">Refresh this app page and it will load instantly!</p>
                               </div>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                              <Loader2 size={18} className="animate-spin" /> Refresh Now
                            </button>
                            <button onClick={() => setShowAccessHelp(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Close Guide</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full flex flex-col p-12 overflow-auto ${themeClasses[readerTheme]} min-h-[500px]`}>
                     <h1 className="text-4xl font-black tracking-tight mb-8 leading-tight">{activeMaterial.title}</h1>
                     <div className="prose prose-xl opacity-90 leading-relaxed font-serif whitespace-pre-wrap">{currentNotes || "Capture your insights here..."}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] h-[600px] flex flex-col items-center justify-center text-center p-8 border border-slate-100">
              <FilePlus size={64} className="text-slate-100 mb-6" />
              <h4 className="text-2xl font-black text-slate-800">No Content Added</h4>
              <p className="text-slate-500 max-w-xs mt-2 font-medium">Add some materials to start your study journey.</p>
            </div>
          )}
        </div>

        <div className={`space-y-6 ${focusMode ? 'hidden' : ''}`}>
            <div className="p-8 rounded-[3rem] shadow-xl border bg-white border-slate-100">
                <h4 className="font-black text-lg mb-6 flex items-center gap-3"><Zap size={20} className="text-yellow-400 fill-current" /> Study Brain</h4>
                <textarea 
                  value={currentNotes} 
                  onChange={(e) => { setCurrentNotes(e.target.value); saveMaterialNotes(activeMaterial!.id, e.target.value); }} 
                  placeholder="Record definitions, formulas, or sudden insights..."
                  className="w-full h-[500px] border-none bg-slate-50 rounded-[2rem] p-6 text-sm outline-none resize-none font-medium leading-relaxed" 
                />
            </div>
        </div>
      </div>

      {showGuru && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-full max-w-sm px-4">
          <GeminiGuru 
            context={`Subject: ${subject.name}, Topic: ${topic.name}, Asset: ${activeMaterial?.title || 'None'}`} 
            onClose={() => setShowGuru(false)} 
          />
        </div>
      )}
    </div>
  );
};
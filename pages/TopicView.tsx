
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.ts';
import { GeminiGuru } from '../components/GeminiGuru.tsx';
import { 
  ArrowLeft, Video, FileText, Sparkles, Star, Plus, X, PlusCircle, Zap, Download, Eye, EyeOff, 
  ChevronLeft, ChevronRight, ExternalLink, Trash2, Palette, FilePlus, StickyNote, Loader2, 
  Tag as TagIcon, Bookmark, FastForward, Clock, DownloadCloud, CheckCircle, XCircle, AlertCircle, Info
} from 'lucide-react';
import { MaterialType, ReaderTheme } from '../types.ts';

export const TopicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateState, addMaterial, updateMaterialProgress, saveMaterialNotes, deleteMaterial, trackStudyTime, toggleBookmark, downloadMaterial, cancelDownload } = useStore();
  
  const [showGuru, setShowGuru] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', type: MaterialType.VIDEO, url: '' });
  const [focusMode, setFocusMode] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(state.settings.readerTheme || ReaderTheme.LIGHT);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sessionTime, setSessionTime] = useState(0); 
  const [showAccessHelp, setShowAccessHelp] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const getEmbedUrl = (url: string, resumeTime: number = 0) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    
    // YouTube Handling
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = cleanUrl.match(ytRegExp);
    const videoId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

    if (videoId) {
      const start = Math.floor(resumeTime);
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0${start > 0 ? `&start=${start}` : ''}`;
    }

    // Google Drive Handling - FIX FOR "YOU NEED ACCESS"
    if (cleanUrl.includes('drive.google.com')) {
        // Convert /view, /edit, or /open links to /preview which is embed-friendly
        return cleanUrl.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview').replace(/\/open(\?.*)?$/, '/preview');
    }
    
    return cleanUrl;
  };

  const themeClasses = {
    [ReaderTheme.LIGHT]: 'bg-white text-slate-800',
    [ReaderTheme.DARK]: 'bg-slate-900 text-slate-200 border-white/5',
    [ReaderTheme.SEPIA]: 'bg-[#F4ECD8] text-[#5B4636] border-[#DCD3BC]'
  };

  const pdfFilter = {
    [ReaderTheme.LIGHT]: 'none',
    [ReaderTheme.DARK]: 'invert(0.9) hue-rotate(180deg)',
    [ReaderTheme.SEPIA]: 'sepia(0.5) brightness(0.9) contrast(1.1)'
  };

  return (
    <div className={`transition-all duration-700 ${focusMode ? 'fixed inset-0 z-[100] bg-slate-950 overflow-y-auto pb-20' : 'space-y-6 max-w-6xl mx-auto pb-24 animate-in fade-in'}`}>
      
      {focusMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
          <Clock size={16} className="text-emerald-400" />
          <span className="text-white font-black text-sm uppercase tracking-widest">{Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}</span>
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
              <span className="font-black text-xs hidden sm:inline">{focusMode ? 'Exit' : 'Focus Mode'}</span>
          </button>
          {!focusMode && (
            <button onClick={() => setShowGuru(!showGuru)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-105 transition-all">
              <Sparkles size={18} />
              <span className="font-black text-xs">Guru AI</span>
            </button>
          )}
        </div>
      </header>

      <div className={`grid grid-cols-1 ${focusMode ? 'max-w-screen-xl mx-auto py-8 px-4' : 'lg:grid-cols-3'} gap-8 px-4`}>
        <div className={`${focusMode ? 'w-full' : 'lg:col-span-2'} space-y-6`}>
          {activeMaterial ? (
            <div className={`overflow-hidden transition-all duration-500 ${focusMode ? 'rounded-[3rem] shadow-2xl' : 'bg-white rounded-[2.5rem] shadow-xl border border-slate-100'}`}>
              <div className={`relative group flex flex-col items-center justify-center transition-colors duration-500 ${focusMode ? 'min-h-[90vh]' : (activeMaterial.type === MaterialType.PDF ? 'min-h-[850px]' : 'aspect-video')} ${themeClasses[readerTheme]}`}>
                
                {activeMaterial.type === MaterialType.VIDEO ? (
                  <div className="w-full h-full relative group/video">
                    {activeMaterial.url.includes('youtube.com') || activeMaterial.url.includes('youtu.be') ? (
                       <iframe 
                        src={getEmbedUrl(activeMaterial.url, activeMaterial.videoPosition)} 
                        className="w-full h-full" 
                        allowFullScreen 
                        title={activeMaterial.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                       />
                    ) : (
                      <video ref={videoRef} src={activeMaterial.url} className="w-full h-full" controls />
                    )}
                  </div>
                ) : activeMaterial.type === MaterialType.PDF ? (
                  <div className={`w-full h-full flex flex-col relative flex-1 ${themeClasses[readerTheme]}`}>
                    {pdfLoading && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-inherit">
                        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                        <p className="font-black animate-pulse uppercase text-xs tracking-widest mb-4">Resolving PDF...</p>
                        
                        {/* Help for Access Denied Errors */}
                        <div className="max-w-xs text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-[10px] text-amber-700 font-bold leading-tight">Seeing a "Request Access" message?</p>
                          <button 
                            onClick={() => setShowAccessHelp(true)}
                            className="mt-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                          >
                            Click for Permission Help
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <iframe 
                      src={getEmbedUrl(activeMaterial.url)} 
                      className="w-full h-full flex-1 border-none z-10 transition-all duration-500" 
                      onLoad={() => setPdfLoading(false)} 
                      title={activeMaterial.title} 
                      style={{ filter: pdfFilter[readerTheme], minHeight: focusMode ? 'calc(90vh - 120px)' : '750px' }} 
                    />
                    
                    {/* Access Help Overlay */}
                    {showAccessHelp && (
                      <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 text-center animate-in fade-in zoom-in-95">
                        <div className="max-w-md space-y-6">
                          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle size={32} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Permission Required</h3>
                          <div className="text-left space-y-4 text-slate-600">
                             <p className="font-medium text-sm">To embed Google Drive files, you must update the file's sharing settings:</p>
                             <ol className="text-xs space-y-2 list-decimal pl-4">
                               <li>Go to your Google Drive and find this file.</li>
                               <li>Right-click and select <strong>"Share"</strong>.</li>
                               <li>Under "General access", change <strong>"Restricted"</strong> to <strong>"Anyone with the link"</strong>.</li>
                               <li>Ensure the role is set to <strong>"Viewer"</strong>.</li>
                               <li>Refresh this page.</li>
                             </ol>
                          </div>
                          <button onClick={() => setShowAccessHelp(false)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">I've Updated Permissions</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full flex flex-col p-12 overflow-auto ${themeClasses[readerTheme]} min-h-[500px]`}>
                     <h1 className="text-4xl font-black tracking-tight mb-8">{activeMaterial.title}</h1>
                     <div className="prose prose-xl opacity-90 leading-relaxed font-serif whitespace-pre-wrap">{currentNotes || "Write your insights in the sidebar..."}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] h-[600px] flex flex-col items-center justify-center text-center p-8 border border-slate-100">
              <FilePlus size={64} className="text-slate-100 mb-6" />
              <h4 className="text-2xl font-black text-slate-800">Topic is empty</h4>
              <p className="text-slate-400 max-w-xs mt-2 font-medium">Add materials to start studying.</p>
            </div>
          )}
        </div>

        <div className={`space-y-6 ${focusMode ? 'hidden' : ''}`}>
            <div className="p-8 rounded-[2.5rem] shadow-xl border bg-white border-slate-100">
                <h4 className="font-black text-xl mb-6 flex items-center gap-3"><Zap size={24} className="text-yellow-400 fill-current" /> Scratchpad</h4>
                <textarea 
                  value={currentNotes} 
                  onChange={(e) => { setCurrentNotes(e.target.value); saveMaterialNotes(activeMaterial!.id, e.target.value); }} 
                  placeholder="Capture key concepts..."
                  className="w-full h-80 border-none bg-slate-50 rounded-3xl p-6 text-base outline-none resize-none" 
                />
                <button onClick={() => saveMaterialNotes(activeMaterial!.id, currentNotes)} className="w-full mt-6 bg-indigo-600 text-white py-5 rounded-[2rem] font-black">Sync Notes</button>
            </div>
        </div>
      </div>

      {showGuru && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-full max-w-sm px-4">
          <GeminiGuru 
            context={`Subject: ${subject.name}, Topic: ${topic.name}, Current Asset: ${activeMaterial?.title || 'None'}`} 
            onClose={() => setShowGuru(false)} 
          />
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { GeminiGuru } from '../components/GeminiGuru';
import { 
  ArrowLeft, Video, FileText, Sparkles, Star, Plus, X, PlusCircle, Zap, Download, Eye, EyeOff, 
  ChevronLeft, ChevronRight, ExternalLink, Trash2, Palette, FilePlus, StickyNote, Loader2, 
  Tag as TagIcon, Bookmark, FastForward, Clock, DownloadCloud, CheckCircle, XCircle
} from 'lucide-react';
import { MaterialType, ReaderTheme } from '../types';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const subject = state.subjects.find(s => s.topics.some(t => t.id === id));
  const topic = subject?.topics.find(t => t.id === id);

  if (!topic || !subject) return <div className="p-8 text-center text-slate-500">Topic not found</div>;

  const activeMaterial = topic.materials.find(m => m.id === (activeMaterialId || topic.materials[0]?.id));

  useEffect(() => {
    if (activeMaterial) {
        setCurrentNotes(activeMaterial.notes || "");
        if (activeMaterial.type === MaterialType.PDF) setPdfLoading(true);
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

  useEffect(() => {
    if (!activeMaterial) return;
    const interval = setInterval(() => {
        if (!document.hidden) trackStudyTime(1, activeMaterial.type);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeMaterial?.id, activeMaterial?.type]);

  useEffect(() => {
    if (activeMaterial?.type === MaterialType.VIDEO && videoRef.current) {
        videoRef.current.currentTime = activeMaterial.videoPosition || 0;
        videoRef.current.playbackRate = playbackSpeed;
        
        const saveInterval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused) {
                const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                updateMaterialProgress(activeMaterial.id, prog || 0, videoRef.current.currentTime);
            }
        }, 5000);
        return () => clearInterval(saveInterval);
    }
  }, [activeMaterial?.id, activeMaterial?.type, playbackSpeed]);

  const handlePdfPageChange = (newPage: number) => {
    if (newPage < 1 || !activeMaterial) return;
    const prog = (newPage / 100) * 100;
    updateMaterialProgress(activeMaterial.id, prog, newPage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMaterial = () => {
    if (!newMat.title.trim()) return;
    addMaterial(id!, newMat.title, newMat.type, newMat.url);
    setNewMat({ title: '', type: MaterialType.VIDEO, url: '' });
    setIsAddMaterialModalOpen(false);
  };

  const getEmbedUrl = (url: string, resumeTime: number = 0) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    
    // Improved YouTube ID extraction logic to prevent player configuration errors
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      const start = Math.floor(resumeTime);
      // Added enablejsapi and origin for better reliability and avoiding error 153
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0${start > 0 ? `&start=${start}` : ''}`;
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
          <span className="text-white font-black text-sm uppercase tracking-widest">{formatTime(sessionTime)}</span>
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
                    
                    <div className="absolute bottom-16 right-6 opacity-0 group-hover/video:opacity-100 transition-opacity z-40 bg-black/60 backdrop-blur-md p-2 rounded-2xl flex gap-1">
                      {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                        <button 
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeMaterial.type === MaterialType.PDF ? (
                  <div className={`w-full h-full flex flex-col relative flex-1 ${themeClasses[readerTheme]}`}>
                    {pdfLoading && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-inherit"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48} /><p className="font-black animate-pulse uppercase text-xs tracking-widest">Loading PDF...</p></div>}
                    <iframe src={activeMaterial.url} className="w-full h-full flex-1 border-none z-10 transition-all duration-500" onLoad={() => setPdfLoading(false)} title={activeMaterial.title} style={{ filter: pdfFilter[readerTheme], minHeight: focusMode ? 'calc(90vh - 120px)' : '750px' }} />
                    
                    <div className="p-4 z-20">
                      <div className="flex items-center gap-6 bg-slate-900/10 backdrop-blur-md p-3 rounded-2xl">
                         <button onClick={() => handlePdfPageChange((activeMaterial.lastPage || 1) - 1)} className="p-2 hover:bg-black/10 rounded-xl transition-all"><ChevronLeft /></button>
                         <div className="flex-1 text-center font-black text-xs uppercase tracking-tighter">Page {activeMaterial.lastPage || 1}</div>
                         <button 
                           onClick={() => toggleBookmark(activeMaterial.id, activeMaterial.lastPage || 1)}
                           className={`p-2 rounded-xl transition-all ${activeMaterial.bookmarks?.includes(activeMaterial.lastPage || 1) ? 'text-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
                         >
                           <Bookmark size={18} fill={activeMaterial.bookmarks?.includes(activeMaterial.lastPage || 1) ? 'currentColor' : 'none'} />
                         </button>
                         <button onClick={() => handlePdfPageChange((activeMaterial.lastPage || 1) + 1)} className="p-2 hover:bg-black/10 rounded-xl transition-all"><ChevronRight /></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`w-full h-full flex flex-col p-12 overflow-auto ${themeClasses[readerTheme]} min-h-[500px]`}>
                     <h1 className="text-4xl font-black tracking-tight mb-8">{activeMaterial.title}</h1>
                     <div className="prose prose-xl opacity-90 leading-relaxed font-serif whitespace-pre-wrap">{currentNotes || "Write your insights in the sidebar..."}</div>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <button onClick={() => {
                    const newState = {...state};
                    const m = newState.subjects.flatMap(s => s.topics.flatMap(t => t.materials)).find(mat => mat.id === activeMaterial.id);
                    if (m) m.isFavorite = !m.isFavorite;
                    updateState(newState);
                  }} className={`p-3 rounded-2xl transition-all ${activeMaterial.isFavorite ? 'bg-amber-500 text-white' : 'bg-black/30 text-white'}`}><Star size={20} fill={activeMaterial.isFavorite ? 'currentColor' : 'none'} /></button>
                </div>
              </div>

              {!focusMode && (
                <div className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <h3 className="text-2xl font-black text-slate-900">{activeMaterial.title}</h3>
                    <div className="flex items-center gap-3">
                      {activeMaterial.type !== MaterialType.NOTE && (
                        <div className="flex flex-col items-end gap-1.5">
                          <button 
                            onClick={() => {
                              if (activeMaterial.downloadProgress !== undefined && activeMaterial.downloadProgress < 100) {
                                cancelDownload(activeMaterial.id);
                              } else {
                                downloadMaterial(activeMaterial.id);
                              }
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMaterial.isDownloaded ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'}`}
                          >
                            {activeMaterial.isDownloaded ? (
                              <>
                                <CheckCircle size={14} />
                                Offline Ready
                              </>
                            ) : activeMaterial.downloadProgress !== undefined && activeMaterial.downloadProgress < 100 ? (
                              <>
                                <XCircle size={14} />
                                Cancel {activeMaterial.downloadProgress}%
                              </>
                            ) : (
                              <>
                                <DownloadCloud size={14} />
                                Download for Offline
                              </>
                            )}
                          </button>
                          {activeMaterial.downloadProgress !== undefined && activeMaterial.downloadProgress < 100 && (
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${activeMaterial.downloadProgress}%` }} />
                            </div>
                          )}
                        </div>
                      )}
                      <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">{activeMaterial.type}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                      {state.tags.map(tag => (
                          <button 
                            key={tag.id} 
                            onClick={() => {
                              const newState = {...state};
                              const m = newState.subjects.flatMap(s => s.topics.flatMap(t => t.materials)).find(mat => mat.id === activeMaterial.id);
                              if (m) m.tags = m.tags.includes(tag.id) ? m.tags.filter(tid => tid !== tag.id) : [...m.tags, tag.id];
                              updateState(newState);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeMaterial.tags.includes(tag.id) ? `${tag.color} text-white border-transparent` : 'bg-white text-slate-400 border-slate-100'}`}
                          >
                            <TagIcon size={12} className="inline mr-1" /> {tag.name}
                          </button>
                      ))}
                  </div>

                  {activeMaterial.type === MaterialType.PDF && activeMaterial.bookmarks && activeMaterial.bookmarks.length > 0 && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Saved Bookmarks</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeMaterial.bookmarks.map(page => (
                          <button 
                            key={page} 
                            onClick={() => handlePdfPageChange(page)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all text-xs font-bold border border-slate-100"
                          >
                            <Bookmark size={14} className="fill-current" />
                            Page {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] h-[600px] flex flex-col items-center justify-center text-center p-8 border border-slate-100">
              <FilePlus size={64} className="text-slate-100 mb-6" />
              <h4 className="text-2xl font-black text-slate-800">Topic is empty</h4>
              <p className="text-slate-400 max-w-xs mt-2 font-medium">Start adding PDFs, videos, or handwritten notes to this chapter.</p>
              <button 
                onClick={() => setIsAddMaterialModalOpen(true)} 
                className="mt-8 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-90 transition-all"
              >
                Add Your First Material
              </button>
            </div>
          )}
        </div>

        <div className={`space-y-6 ${focusMode && !controlsVisible ? 'opacity-0 scale-95 pointer-events-none translate-x-12' : 'opacity-100 scale-100'}`}>
            <div className={`p-8 rounded-[2.5rem] shadow-xl border ${focusMode ? 'bg-slate-900/80 text-white border-white/5' : 'bg-white border-slate-100'}`}>
                <h4 className="font-black text-xl mb-6 flex items-center gap-3"><Zap size={24} className="text-yellow-400 fill-current" /> Scratchpad</h4>
                <textarea 
                  value={currentNotes} 
                  onChange={(e) => { setCurrentNotes(e.target.value); saveMaterialNotes(activeMaterial!.id, e.target.value); }} 
                  placeholder="Capture key concepts or formulas as you learn..."
                  className={`w-full h-80 border-none rounded-3xl p-6 text-base outline-none resize-none transition-all ${focusMode ? 'bg-white/5 text-white placeholder-white/20' : 'bg-slate-50 text-slate-800'}`} 
                />
                <button onClick={() => saveMaterialNotes(activeMaterial!.id, currentNotes)} className="w-full mt-6 bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">Sync Notes</button>
            </div>
            
            {!focusMode && (
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Session Stack</h4>
                  <button onClick={() => setIsAddMaterialModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                    <PlusCircle size={20} />
                  </button>
                </div>
                <div className="space-y-2">
                  {topic.materials.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => setActiveMaterialId(m.id)} 
                      className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${activeMaterial?.id === m.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMaterial?.id === m.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        {m.type === 'VIDEO' ? <Video size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-black truncate">{m.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] opacity-60 font-black uppercase tracking-tighter">{Math.round(m.progress)}% Mastery</p>
                          {m.isDownloaded && <CheckCircle size={10} className="text-emerald-500" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Guru Overlay */}
      {showGuru && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-full max-w-sm px-4">
          <GeminiGuru 
            context={`Subject: ${subject.name}, Topic: ${topic.name}, Current Asset: ${activeMaterial?.title || 'None'}`} 
            onClose={() => setShowGuru(false)} 
          />
        </div>
      )}

      {/* Floating Action Button (FAB) for adding materials when content exists */}
      {!focusMode && topic.materials.length > 0 && (
        <button 
          onClick={() => setIsAddMaterialModalOpen(true)}
          className="fixed bottom-24 right-8 md:bottom-12 md:right-12 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Add Material Modal */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-900">Add Material</h3>
                <p className="text-slate-400 font-medium">Upload or link a new study resource</p>
              </div>
              <button onClick={() => setIsAddMaterialModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newMat.title}
                  onChange={e => setNewMat({...newMat, title: e.target.value})}
                  placeholder="e.g. Lecture Notes #1"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:ring-0 focus:border-indigo-500 outline-none transition-all font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[MaterialType.PDF, MaterialType.VIDEO, MaterialType.NOTE].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewMat({...newMat, type})}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${newMat.type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Resource Link (URL)</label>
                <input 
                  type="text" 
                  value={newMat.url}
                  onChange={e => setNewMat({...newMat, url: e.target.value})}
                  placeholder={newMat.type === MaterialType.VIDEO ? "YouTube or Direct Link" : "PDF URL"}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 focus:ring-0 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button 
              onClick={handleAddMaterial}
              className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Add to Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

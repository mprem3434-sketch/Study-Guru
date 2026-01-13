
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store.ts';
import { GeminiGuru } from '../components/GeminiGuru.tsx';
import { 
  ArrowLeft, Video, FileText, Sparkles, Plus, X, Zap, Eye, EyeOff, 
  ChevronRight, Trash2, FilePlus, Loader2, 
  Clock, Lock, StickyNote, Link as LinkIcon,
  Box, Activity, Download, UploadCloud, Layers
} from 'lucide-react';
import { MaterialType, ReaderTheme } from '../types.ts';

export const TopicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, isLoaded, addMaterial, updateMaterialProgress, saveMaterialNotes, deleteMaterial, getFileBlob, downloadMaterial, removeDownload } = useStore();
  
  const [showGuru, setShowGuru] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMat, setNewMat] = useState<{ title: string; type: MaterialType; url: string; file: File | null }>({ title: '', type: MaterialType.VIDEO, url: '', file: null });
  const [focusMode, setFocusMode] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const subject = state.subjects.find(s => s.topics.some(t => t.id === id));
  const topic = subject?.topics.find(t => t.id === id);
  const activeMaterial = topic?.materials.find(m => m.id === (activeMaterialId || topic.materials[0]?.id));
  const readerTheme = state.settings.readerTheme || ReaderTheme.LIGHT;
  
  const isAdmin = state.currentUser?.role === 'ADMIN';
  const isTeacher = state.currentUser?.role === 'TEACHER';
  
  const canEdit = isAdmin || isTeacher;
  // Teachers cannot delete material once uploaded
  const canDelete = isAdmin;

  useEffect(() => {
    const loadLocalFile = async () => {
      if (activeMaterial?.localFileKey) {
        const blob = await getFileBlob(activeMaterial.localFileKey);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setLocalBlobUrl(url);
        }
      } else {
        setLocalBlobUrl(null);
      }
    };
    loadLocalFile();
    return () => { if (localBlobUrl) URL.revokeObjectURL(localBlobUrl); };
  }, [activeMaterial?.id, activeMaterial?.localFileKey]);

  useEffect(() => {
    if (activeMaterial) {
        setCurrentNotes(activeMaterial.notes || "");
        if (activeMaterial.type === MaterialType.PDF) setPdfLoading(true);
    }
  }, [activeMaterial?.id]);

  const handleAddMaterial = async () => {
    if (!newMat.title.trim() || !id) return;
    await addMaterial(id, newMat.title, newMat.type, newMat.url, newMat.file || undefined);
    setNewMat({ title: '', type: MaterialType.VIDEO, url: '', file: null });
    setIsAddMaterialModalOpen(false);
  };

  const getEmbedUrl = (mat: any) => {
    if (localBlobUrl) return localBlobUrl;
    const url = mat.url || '';
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const videoId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
    if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
    if (url.includes('drive.google.com')) return url.replace(/\/view(\?.*)?$/, '/preview');
    return url;
  };

  // Handle Loading State
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Restoring Workspace...</p>
      </div>
    );
  }

  if (!topic || !subject) {
    return (
      <div className="text-center py-20 px-6 animate-in fade-in">
        <div className="w-20 h-20 bg-rose-50 text-rose-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Layers size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Unit Not Found</h3>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">This unit may have been archived or deleted.</p>
        <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return to Hub</button>
      </div>
    );
  }

  const themeClasses = {
    [ReaderTheme.LIGHT]: 'bg-white text-slate-800',
    [ReaderTheme.DARK]: 'bg-slate-950 text-slate-200',
    [ReaderTheme.SEPIA]: 'bg-[#F4ECD8] text-[#5B4636]'
  };

  return (
    <div className={`transition-all duration-700 min-h-screen ${focusMode ? 'fixed inset-0 z-[100] bg-slate-950 pb-20 overflow-y-auto' : 'space-y-6 max-w-6xl mx-auto pb-32 animate-in fade-in'}`}>
      
      <header className={`flex flex-col gap-4 px-4 transition-all duration-500 ${focusMode ? 'py-6 bg-slate-900 border-b border-white/10 sticky top-0 z-[110]' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => focusMode ? setFocusMode(false) : navigate(-1)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${focusMode ? 'bg-white/10 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${subject.color}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subject.name}</span>
              </div>
              <h2 className={`text-xl md:text-2xl font-black truncate max-w-[200px] md:max-w-none ${focusMode ? 'text-white' : 'text-slate-900'}`}>{topic.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGuru(!showGuru)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Sparkles size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Guru AI</span>
            </button>
          </div>
        </div>

        {!focusMode && (
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4">
            {topic.materials.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMaterialId(m.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${activeMaterialId === m.id || (!activeMaterialId && topic.materials[0]?.id === m.id) ? 'bg-white border-indigo-600 shadow-lg shadow-indigo-100/50' : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'}`}
              >
                {m.type === MaterialType.VIDEO ? <Video size={18} /> : m.type === MaterialType.PDF ? <FileText size={18} /> : <StickyNote size={18} />}
                <div className="flex flex-col items-start">
                  <span className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeMaterialId === m.id ? 'text-indigo-600' : ''}`}>{m.title}</span>
                  {m.isDownloaded && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Offline Active</span>}
                </div>
              </button>
            ))}
            {canEdit && (
              <button 
                onClick={() => setIsAddMaterialModalOpen(true)}
                className="flex-shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Add Material"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        )}
      </header>

      <div className={`grid grid-cols-1 ${focusMode ? 'max-w-screen-xl mx-auto p-4' : 'lg:grid-cols-3'} gap-6 px-4`}>
        <div className={`${focusMode ? 'w-full' : 'lg:col-span-2'} space-y-6`}>
          {activeMaterial ? (
            <div className={`relative overflow-hidden rounded-[2.5rem] shadow-xl border border-slate-100 ${themeClasses[readerTheme]}`}>
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                 {!activeMaterial.isDownloaded && activeMaterial.url && (
                    <button onClick={() => downloadMaterial(activeMaterial.id)} className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors">
                      {activeMaterial.downloadProgress ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                 )}
                 {activeMaterial.isDownloaded && (
                    <button onClick={() => removeDownload(activeMaterial.id)} className="w-9 h-9 bg-emerald-50 backdrop-blur-md rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                      <CheckCircle2 size={16} />
                    </button>
                 )}
                 <button onClick={() => setFocusMode(!focusMode)} className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                   {focusMode ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
                 {canDelete && (
                    <button onClick={() => deleteMaterial(topic.id, activeMaterial.id)} className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                       <Trash2 size={16} />
                    </button>
                 )}
              </div>

              {activeMaterial.type === MaterialType.VIDEO ? (
                <div className="aspect-video bg-black relative group">
                  <iframe 
                    src={getEmbedUrl(activeMaterial)} 
                    className="w-full h-full" 
                    allowFullScreen 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  {!focusMode && <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest border border-white/30">
                      Playing Source
                    </div>
                  </button>}
                </div>
              ) : activeMaterial.type === MaterialType.PDF ? (
                <div className="h-[80vh] bg-slate-100 relative">
                  {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                  )}
                  <iframe 
                    src={localBlobUrl || activeMaterial.url}
                    className="w-full h-full" 
                    onLoad={() => setPdfLoading(false)}
                  />
                </div>
              ) : (
                <div className="p-8 md:p-12 min-h-[400px]">
                  <h3 className="text-3xl font-black mb-6">{activeMaterial.title}</h3>
                  <textarea 
                    value={currentNotes}
                    onChange={(e) => {
                       setCurrentNotes(e.target.value);
                       saveMaterialNotes(activeMaterial.id, e.target.value);
                    }}
                    placeholder="Start typing your notes..."
                    className={`w-full h-[60vh] resize-none outline-none text-lg leading-relaxed bg-transparent ${readerTheme === ReaderTheme.DARK ? 'text-slate-300 placeholder:text-slate-700' : 'text-slate-700 placeholder:text-slate-300'}`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 rounded-[2.5rem] bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                  <Box size={32} />
               </div>
               <p className="font-black text-xs uppercase tracking-widest">Select a material to study</p>
            </div>
          )}
        </div>

        {/* Sidebar / Notes / AI */}
        {!focusMode && (
          <div className="space-y-6">
            {showGuru && (
               <GeminiGuru context={`Studying ${subject.name}: ${topic.name}. ${activeMaterial ? `Current material: ${activeMaterial.title}` : ''}`} onClose={() => setShowGuru(false)} />
            )}

            {/* Smart Notes Block */}
            <div className="bg-yellow-50/50 p-6 rounded-[2.5rem] border border-yellow-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-10 -mt-10 blur-2xl" />
               <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
                     <StickyNote size={20} />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Smart Notes</h4>
               </div>
               <textarea 
                  value={currentNotes}
                  onChange={(e) => {
                     setCurrentNotes(e.target.value);
                     if (activeMaterial) saveMaterialNotes(activeMaterial.id, e.target.value);
                  }}
                  placeholder={activeMaterial ? "Take notes for this material..." : "Select a material to take notes"}
                  className="w-full h-40 bg-white rounded-2xl border border-yellow-100 p-4 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none mb-2"
               />
               <button className="w-full py-3 bg-yellow-400 text-yellow-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-200/50">
                  Save to Notebook
               </button>
            </div>

            {/* Metadata Card */}
            {activeMaterial && (
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                     <Activity size={16} className="text-indigo-500" />
                     Study Metrics
                  </h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Progress</span>
                        <span className="font-black text-slate-900">{Math.round(activeMaterial.progress)}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activeMaterial.progress}%` }} />
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Access</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(activeMaterial.lastAccessed).toLocaleDateString()}</span>
                     </div>
                     {activeMaterial.createdBy && (
                         <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Uploaded By</span>
                            <span className="text-[10px] font-bold text-indigo-600">{activeMaterial.createdBy}</span>
                         </div>
                     )}
                  </div>
               </div>
            )}
          </div>
        )}
      </div>

      {/* ADD MATERIAL MODAL (ADMIN/TEACHER) */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-2 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="font-black text-slate-900 text-lg">Upload Content</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add to {topic.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                       <UploadCloud size={20} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Title</label>
                       <input 
                          type="text" 
                          value={newMat.title}
                          onChange={e => setNewMat({...newMat, title: e.target.value})}
                          placeholder="Material Name"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all"
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Format</label>
                       <div className="flex gap-2">
                          {[MaterialType.VIDEO, MaterialType.PDF, MaterialType.NOTE].map(t => (
                             <button 
                                key={t}
                                onClick={() => setNewMat({...newMat, type: t})}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newMat.type === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                             >
                                {t}
                             </button>
                          ))}
                       </div>
                    </div>

                    {newMat.type !== MaterialType.NOTE && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Source</label>
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <LinkIcon size={14} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    value={newMat.url}
                                    onChange={e => setNewMat({...newMat, url: e.target.value})}
                                    placeholder={newMat.type === MaterialType.VIDEO ? "YouTube / Drive URL" : "PDF URL"}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all"
                                />
                             </div>
                             <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                   <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-[9px] uppercase font-black">
                                   <span className="bg-slate-50 px-2 text-slate-400">Or Upload</span>
                                </div>
                             </div>
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 bg-white border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                             >
                                {newMat.file ? (
                                    <><CheckCircle2 size={14} className="text-emerald-500" /> {newMat.file.name}</>
                                ) : (
                                    <><UploadCloud size={14} /> Select Local File</>
                                )}
                             </button>
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept={newMat.type === MaterialType.VIDEO ? "video/*" : "application/pdf"}
                                onChange={(e) => {
                                    if(e.target.files?.[0]) setNewMat({...newMat, file: e.target.files[0]});
                                }}
                             />
                          </div>
                        </div>
                    )}
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                       onClick={() => setIsAddMaterialModalOpen(false)}
                       className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleAddMaterial}
                       className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                       Confirm Upload
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

function CheckCircle2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}

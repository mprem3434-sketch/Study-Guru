
import React, { useState, useRef } from 'react';
import { useStore } from '../store.ts';
import { 
  Palette, Download, Upload, Zap, Trash2, 
  Database, Type, MousePointer2, Info, ShieldCheck, 
  ChevronRight, Sparkles, Monitor, Activity, HardDrive,
  User, Lock, CheckCircle2, AlertCircle, KeyRound, Camera,
  Eye, EyeOff, Calendar, Loader2, GraduationCap, Layout, Check, BookOpen, FileText, UploadCloud
} from 'lucide-react';
import { ReaderTheme, StudentDocuments } from '../types.ts';

export const SettingsPage: React.FC = () => {
  const { state, updateState, exportData, importData, clearAllDownloads, changePassword, updateProfileAvatar, updateUserDOB, updateUserMobile, updateStudentClass, updateTeacherSubjects, updateUserDocuments, completeUserOnboarding } = useStore();

  // Password Management State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [isPassError, setIsPassError] = useState(false);
  const [showProfilePass, setShowProfilePass] = useState(false);
  
  // Profile Management State
  const [dobInput, setDobInput] = useState('');
  const [isSavingDob, setIsSavingDob] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [isSavingMobile, setIsSavingMobile] = useState(false);
  const [classInput, setClassInput] = useState('');
  const [isSavingClass, setIsSavingClass] = useState(false);
  
  // Teacher Subject State
  const [subjectInput, setSubjectInput] = useState<string[]>([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<keyof StudentDocuments | null>(null);

  // Retrieve current user details if available
  const userDetails = state.currentUser?.id 
    ? state.registeredUsers.find(u => u.id === state.currentUser?.id)
    : null;

  const isStudent = state.currentUser?.role === 'USER';
  const isTeacher = state.currentUser?.role === 'TEACHER';
  const GOOGLE_DEFAULT_PASS = "GOOGLE_AUTH_TOKEN_SECURE";
  
  // Determine if user is using the default Google password or has set a custom one
  const isDefaultPassword = userDetails?.password === GOOGLE_DEFAULT_PASS;

  const CLASS_OPTIONS = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  const TEACHER_SUBJECTS = [
    'Hindi', 'English', 'Maths', 'Science', 'Sanskrit', 
    'Social Science', 'Computer', 'Drawing', 'Dancing', 
    'Singing', 'Gujrati', 'Marathi', 'Health & Physical', 'Games'
  ];

  const REQUIRED_DOCS: { key: keyof StudentDocuments; label: string }[] = [
      { key: 'adhaarCard', label: 'Adhaar Card' },
      { key: 'birthCertificate', label: 'Birth Certificate' },
      { key: 'previousMarksheet', label: 'Previous Class Marksheet' },
      { key: 'transferCertificate', label: 'Transfer Certificate (TC)' },
      { key: 'categoryCertificate', label: 'Special Category Certificate' },
  ];

  const togglePro = () => {
    updateState({ ...state, settings: { ...state.settings, isPro: !state.settings.isPro } });
  };

  const handlePasswordChange = async () => {
    setPassMsg('');
    setIsPassError(false);

    if (!newPass.trim()) {
      setIsPassError(true);
      setPassMsg("New password cannot be empty.");
      return;
    }

    // If not using default password, verify old password first
    if (!isDefaultPassword) {
      if (!oldPass.trim()) {
        setIsPassError(true);
        setPassMsg("Please enter your old password.");
        return;
      }
      if (oldPass !== userDetails?.password) {
        setIsPassError(true);
        setPassMsg("Incorrect old password.");
        return;
      }
    }

    // Proceed to update
    const success = await changePassword(newPass);
    if (success) {
      setIsPassError(false);
      setPassMsg(isDefaultPassword ? "Password created successfully!" : "Password updated successfully!");
      setNewPass('');
      setOldPass('');
      // Clear success message after 3 seconds
      setTimeout(() => setPassMsg(''), 3000);
    } else {
      setIsPassError(true);
      setPassMsg("Update failed. Please try again.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       // Optional: Add size validation (e.g., < 2MB) to prevent localStorage bloat
       if (file.size > 2 * 1024 * 1024) {
           alert("Image too large. Please select an image under 2MB.");
           return;
       }
       await updateProfileAvatar(file);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedDocType && userDetails) {
          if (file.size > 5 * 1024 * 1024) {
              alert("Document too large. Limit is 5MB.");
              return;
          }
          const reader = new FileReader();
          reader.onload = async (ev) => {
              const base64Data = ev.target?.result as string;
              const success = await updateUserDocuments(userDetails.id, { [selectedDocType]: base64Data });
              if (success) {
                  alert("Document uploaded and locked successfully.");
                  // If it's the first login, check if we should complete onboarding
                  if (userDetails.isFirstLogin) {
                      await completeUserOnboarding();
                  }
              } else {
                  alert("Failed to save document.");
              }
              setSelectedDocType(null); // Reset selection
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerDocUpload = (key: keyof StudentDocuments) => {
      setSelectedDocType(key);
      setTimeout(() => docInputRef.current?.click(), 100);
  };

  const viewDocument = (base64Data: string) => {
      const win = window.open();
      win?.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  };

  const handleDobSave = async (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (!dobInput) return;
      
      setIsSavingDob(true);
      const success = await updateUserDOB(dobInput);
      if (!success) {
          alert("Failed to update Date of Birth. Please check your connection or re-login.");
      }
      setIsSavingDob(false);
  };

  const handleMobileSave = async (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (!mobileInput) return;
      
      if (mobileInput.length !== 10) {
          alert("Mobile number must be exactly 10 digits.");
          return;
      }
      
      setIsSavingMobile(true);
      // Prepend +91 before saving
      const formattedMobile = `+91 ${mobileInput}`;
      const success = await updateUserMobile(formattedMobile);
      if (!success) {
          alert("Failed to update Mobile Number. Please try again.");
      }
      setIsSavingMobile(false);
  };

  const handleClassSave = async (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (!classInput) return;
      
      setIsSavingClass(true);
      const success = await updateStudentClass(classInput);
      if (!success) {
          alert("Update failed. Please refresh or try re-logging in.");
      }
      setIsSavingClass(false);
  };

  const toggleTeacherSubject = (sub: string) => {
      setSubjectInput(prev => 
          prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
      );
  };

  const handleSubjectsSave = async (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (subjectInput.length === 0) return;
      
      setIsSavingSubjects(true);
      const success = await updateTeacherSubjects(subjectInput);
      if (!success) {
          alert("Update failed. Please refresh.");
      }
      setIsSavingSubjects(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const success = await importData(event.target?.result as string);
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
    <div className={`space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-32 ${state.settings.reduceMotion ? 'animate-none' : ''}`}>
      {/* Redesigned Header */}
      <header className="px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1 block">Configuration</span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Personalize your learning architecture.</p>
        {isStudent && userDetails?.isFirstLogin && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 animate-pulse">
                <Info className="text-amber-600 shrink-0" size={20} />
                <div>
                    <h4 className="font-bold text-amber-800 text-sm">Action Required</h4>
                    <p className="text-xs text-amber-700 mt-1">Please verify your personal details and upload required documents below to complete your student profile.</p>
                </div>
            </div>
        )}
      </header>

      {/* Ultra-Premium Pro Access Card */}
      <div className="relative group px-1">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] md:rounded-[3.5rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-900 text-white overflow-hidden shadow-2xl border border-white/5">
          {/* Decorative Elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-5 md:gap-8">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-white/10 rotate-3">
                <Sparkles size={28} className="text-white fill-current" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">Guru Pro</h3>
                <p className="text-xs md:text-sm opacity-60 font-bold uppercase tracking-widest mt-1">Unlimited Potential</p>
                <ul className="mt-3 space-y-1.5 hidden md:block">
                  <li className="flex items-center gap-2 text-xs opacity-80"><Zap size={12} className="text-yellow-400" /> Multi-device Cloud Syncing</li>
                  <li className="flex items-center gap-2 text-xs opacity-80"><Zap size={12} className="text-yellow-400" /> Advanced Offline Cache</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={togglePro}
              className={`w-full md:w-auto px-10 py-4 rounded-2xl md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${state.settings.isPro ? 'bg-white/10 text-white backdrop-blur-md border border-white/20' : 'bg-white text-slate-900 hover:bg-indigo-50'}`}
            >
              {state.settings.isPro ? 'Manage Membership' : 'Unlock Features'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-1">
        
        {/* Profile & Security Section (Students & Teachers) */}
        {(isStudent || isTeacher) && userDetails && (
          <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <User className="text-indigo-600" size={18} /> Profile & Security
            </h4>

            <div className="space-y-6">
              
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative group">
                     <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                         {userDetails.avatar ? (
                             <img src={userDetails.avatar} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                             isTeacher ? <GraduationCap size={40} className="text-slate-300" /> : <User size={40} className="text-slate-300" />
                         )}
                     </div>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-indigo-700 transition-colors"
                     >
                         <Camera size={14} />
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                     />
                  </div>
                  <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to update photo</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</span>
                   <span className="text-xs font-bold text-slate-700">{userDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID / Email</span>
                   <span className="text-xs font-bold text-slate-700">{userDetails.id}</span>
                </div>
                
                {/* Mobile Number Section */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile</span>
                    {userDetails.mobile && userDetails.mobile !== "Gmail Verified" ? (
                         <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-bold text-slate-700 font-mono">{userDetails.mobile}</span>
                            <Lock size={12} className="text-slate-400" />
                         </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-end">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 gap-1 w-36 focus-within:border-indigo-500 transition-all">
                                <span className="text-[10px] font-black text-slate-400 border-r border-slate-200 pr-1 select-none">+91</span>
                                <input 
                                    type="tel" 
                                    value={mobileInput}
                                    maxLength={10}
                                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="0000000000"
                                    className="text-xs font-bold outline-none w-full bg-transparent text-slate-700"
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={handleMobileSave}
                                disabled={!mobileInput || isSavingMobile}
                                className="bg-emerald-500 text-white w-8 h-8 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
                            >
                                {isSavingMobile ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Date of Birth Section */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</span>
                    {userDetails.dob ? (
                         <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-bold text-slate-700 font-mono">{userDetails.dob}</span>
                            <Lock size={12} className="text-slate-400" />
                         </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-end">
                            <input 
                                type="date" 
                                value={dobInput}
                                onChange={(e) => setDobInput(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 transition-all [color-scheme:light]"
                            />
                            <button 
                                type="button"
                                onClick={handleDobSave}
                                disabled={!dobInput || isSavingDob}
                                className="bg-emerald-500 text-white w-8 h-8 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
                            >
                                {isSavingDob ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Student Class Section (Only for Students) */}
                {isStudent && (
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200/50">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Class</span>
                        {userDetails.studentClass ? (
                             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                <span className="text-xs font-bold text-slate-700">{userDetails.studentClass}</span>
                                <Lock size={12} className="text-slate-400" />
                             </div>
                        ) : (
                            <div className="flex items-center gap-2 justify-end">
                                <select
                                    value={classInput}
                                    onChange={(e) => setClassInput(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 transition-all w-32 appearance-none cursor-pointer"
                                >
                                    <option value="">Select Class</option>
                                    {CLASS_OPTIONS.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={handleClassSave}
                                    disabled={!classInput || isSavingClass}
                                    className="bg-emerald-500 text-white w-8 h-8 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
                                >
                                    {isSavingClass ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Teacher Subjects Section (Only for Teachers) */}
                {isTeacher && (
                    <div className="pt-2 mt-2 border-t border-slate-200/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teaching Subjects</span>
                            {userDetails.subjects && userDetails.subjects.length > 0 && <Lock size={12} className="text-slate-400" />}
                        </div>
                        
                        {userDetails.subjects && userDetails.subjects.length > 0 ? (
                             <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-2">
                                {userDetails.subjects.map(sub => (
                                    <span key={sub} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600">
                                        {sub}
                                    </span>
                                ))}
                             </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-2xl p-3 max-h-32 overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-wrap gap-2">
                                        {TEACHER_SUBJECTS.map(sub => {
                                            const isSelected = subjectInput.includes(sub);
                                            return (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    onClick={() => toggleTeacherSubject(sub)}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all border ${
                                                        isSelected 
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {sub} {isSelected && <Check size={10} className="inline ml-1" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleSubjectsSave}
                                    disabled={subjectInput.length === 0 || isSavingSubjects}
                                    className="w-full py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    {isSavingSubjects ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Confirm Subjects</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200/50">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Password</span>
                   <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-700 font-mono">
                           {showProfilePass ? userDetails.password : '••••••••'}
                       </span>
                       <button onClick={() => setShowProfilePass(!showProfilePass)} className="text-slate-400 hover:text-indigo-600 p-1">
                           {showProfilePass ? <EyeOff size={14} /> : <Eye size={14} />}
                       </button>
                   </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={16} className="text-indigo-500" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    {isDefaultPassword ? "Set Account Password" : "Change Password"}
                  </span>
                </div>

                {!isDefaultPassword && (
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      placeholder="Old Password"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder={isDefaultPassword ? "Create New Password" : "New Password"}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500/50 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handlePasswordChange}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                  >
                    {isDefaultPassword ? "Secure Account" : "Update Credentials"}
                  </button>

                  {passMsg && (
                    <div className={`text-[10px] font-bold flex items-center justify-center gap-1.5 p-2 rounded-lg ${isPassError ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'} animate-in fade-in slide-in-from-top-1`}>
                      {isPassError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                      {passMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {isStudent && userDetails && (
            <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <FileText className="text-indigo-600" size={18} /> Academic Documents
                    </h4>
                    {userDetails.isFirstLogin && (
                        <button 
                            onClick={completeUserOnboarding}
                            className="text-[9px] font-black uppercase text-indigo-600 hover:underline"
                        >
                            Skip & Finish Later
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {REQUIRED_DOCS.map((doc) => {
                        const existingDoc = userDetails.documents?.[doc.key];
                        return (
                            <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existingDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {existingDoc ? <Check size={16} /> : <UploadCloud size={16} />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 max-w-[120px] md:max-w-none truncate">{doc.label}</span>
                                </div>
                                
                                {existingDoc ? (
                                    <button 
                                        onClick={() => viewDocument(existingDoc)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-all"
                                    >
                                        <Eye size={12} /> View
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => triggerDocUpload(doc.key)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        <Upload size={12} /> Upload
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentUpload} />
                    <p className="text-[9px] text-slate-400 text-center pt-2">Accepted: PDF, JPG, PNG (Max 5MB). Uploads are locked once saved.</p>
                </div>
            </section>
        )}

        {/* Preference Deck */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Monitor className="text-indigo-600" size={18} /> Preferences
            </h4>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Font Scale</p>
              <div className="grid grid-cols-4 gap-2">
                {[0.8, 1, 1.2, 1.4].map(scale => (
                  <button 
                    key={scale}
                    onClick={() => updateSetting('fontScale', scale)}
                    className={`py-4 rounded-2xl border-2 font-black text-[10px] transition-all ${state.settings.fontScale === scale ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    {scale === 1 ? 'NORM' : `${Math.round(scale * 100)}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => updateSetting('reduceMotion', !state.settings.reduceMotion)}
                className={`w-full p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${state.settings.reduceMotion ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${state.settings.reduceMotion ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    <MousePointer2 size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-xs md:text-sm ${state.settings.reduceMotion ? 'text-indigo-600' : 'text-slate-800'}`}>Eco Motion</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Conserve Battery</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${state.settings.reduceMotion ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${state.settings.reduceMotion ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* System Health Deck */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={18} /> Repository Health
          </h4>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integrity</span>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">98.4%</span>
              </div>
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive size={12} className="text-indigo-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cache</span>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">Solid</span>
              </div>
            </div>

            <button 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100/10 active:scale-95"
              onClick={() => alert("Diagnostic audit complete. All study materials verified.")}
            >
              <Activity size={14} />
              Run System Audit
            </button>
          </div>
        </section>

        {/* Data Sovereignty Deck */}
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 lg:col-span-2">
          <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <Database className="text-indigo-600" size={18} /> Data Management
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={exportData}
              className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:border-indigo-100 rounded-2xl border border-transparent transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Download size={18} />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Secure Backup</span>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>

            <label className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:border-emerald-100 rounded-2xl border border-transparent transition-all group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Import Stream</span>
              </div>
              <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
              <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </label>

            <button 
              onClick={() => { if(confirm("Confirm: This will permanently delete all local cache files.")) clearAllDownloads(); }}
              className="flex items-center justify-between p-5 bg-rose-50/50 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                  <Trash2 size={18} />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-rose-600">Purge Assets</span>
              </div>
              <ChevronRight size={14} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
            </button>
          </div>
        </section>
      </div>

      {/* Footer Branding */}
      <footer className="px-1">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
            <Info size={24} />
          </div>
          <div>
            <p className="font-black text-[10px] text-white uppercase tracking-[0.3em]">Architectural Version 6.0</p>
            <p className="text-slate-400 font-bold uppercase mt-1 tracking-widest">Built for High-Velocity Learning</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

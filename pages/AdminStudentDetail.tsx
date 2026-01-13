
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store.ts';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Lock, 
  ShieldCheck, Ban, CheckCircle2, Clock, Trash2,
  Copy, Eye, EyeOff, Edit3, Save, X, Camera, GraduationCap, Layout, Check, BookOpen, Layers, Plus, FileText, UploadCloud
} from 'lucide-react';
import { UserStatus, StudentDocuments } from '../types.ts';

export const AdminStudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateUserStatus, adminUpdateUser, updateUserDocuments } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  
  const incomingTab = (location.state as any)?.tab;

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
     name: '',
     id: '', // This corresponds to Email
     mobile: '',
     dob: '',
     studentClass: '',
     studentSection: '',
     subjects: [] as string[],
     assignedClasses: [] as string[],
     password: '',
     status: 'PENDING' as UserStatus,
     avatar: ''
  });
  
  // New Assignment State
  const [newAssignment, setNewAssignment] = useState({ class: '', section: '', subject: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocKey, setSelectedDocKey] = useState<keyof StudentDocuments | null>(null);

  const user = state.registeredUsers.find(u => u.id === id);
  const isTeacher = user?.role === 'TEACHER';

  const CLASS_OPTIONS = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

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

  // Sync state when user loads or id changes
  useEffect(() => {
    if (user) {
        // Strip the +91 prefix for the edit input field if it exists
        let rawMobile = '';
        if (user.mobile && user.mobile !== 'Gmail Verified') {
             rawMobile = user.mobile.replace('+91 ', '').replace('+91', '').trim();
        }

        setFormData({
            name: user.name,
            id: user.id,
            mobile: rawMobile,
            dob: user.dob || '',
            studentClass: user.studentClass || '',
            studentSection: user.studentSection || '',
            subjects: user.subjects || [],
            assignedClasses: user.assignedClasses || [],
            password: user.password,
            status: user.status,
            avatar: user.avatar || ''
        });
    }
  }, [user]);

  const handleBack = () => {
      // Determine which tab to return to based on the user's role or the incoming state
      const targetTab = user?.role === 'TEACHER' ? 'TEACHERS' : (incomingTab || 'STUDENTS');
      navigate('/admin', { state: { tab: targetTab } });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 bg-slate-100 rounded-3xl text-slate-400">
           <User size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-800">User Not Found</h3>
        <button onClick={handleBack} className="text-indigo-600 font-bold hover:underline">Return to Registry</button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: UserStatus) => {
     await updateUserStatus(user.id, newStatus);
     setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              alert("Image too large. Please select under 2MB.");
              return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
              setFormData(prev => ({ ...prev, avatar: ev.target?.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleSubject = (sub: string) => {
      setFormData(prev => ({
          ...prev,
          subjects: prev.subjects.includes(sub)
              ? prev.subjects.filter(s => s !== sub)
              : [...prev.subjects, sub]
      }));
  };

  const addAssignment = () => {
      if (!newAssignment.class || !newAssignment.section || !newAssignment.subject) return;
      
      const assignmentString = `${newAssignment.class} - ${newAssignment.section}, ${newAssignment.subject}`;
      
      if (!formData.assignedClasses.includes(assignmentString)) {
          // Add to assignedClasses
          const updatedAssignments = [...formData.assignedClasses, assignmentString];
          
          setFormData(prev => ({
              ...prev,
              assignedClasses: updatedAssignments
          }));
      }
      setNewAssignment({ class: '', section: '', subject: '' });
  };

  const removeAssignment = (assignment: string) => {
      // Logic to remove assignment
      const updatedAssignments = formData.assignedClasses.filter(a => a !== assignment);
      
      setFormData(prev => ({
          ...prev,
          assignedClasses: updatedAssignments
      }));
  };

  const saveChanges = async (e?: React.MouseEvent) => {
      e?.preventDefault();
      
      if (!user) return;

      if (!formData.name.trim() || !formData.id.trim() || !formData.password.trim()) {
          alert("Name, ID/Email, and Password are required.");
          return;
      }
      
      if (formData.mobile && formData.mobile.length !== 10) {
          alert("Mobile number must be exactly 10 digits.");
          return;
      }

      const formattedMobile = formData.mobile ? `+91 ${formData.mobile}` : '';
      
      const success = await adminUpdateUser(user.id, {
          name: formData.name,
          id: formData.id,
          mobile: formattedMobile,
          dob: formData.dob,
          studentClass: formData.studentClass,
          studentSection: formData.studentSection,
          subjects: formData.subjects,
          assignedClasses: formData.assignedClasses,
          password: formData.password,
          status: formData.status,
          avatar: formData.avatar
      });

      if (success) {
          setIsEditing(false);
          if (formData.id !== user.id) {
              navigate(`/admin/student/${formData.id}`, { replace: true, state: { tab: isTeacher ? 'TEACHERS' : 'STUDENTS' } });
          }
      } else {
          alert("Update failed. Email/ID might already exist.");
      }
  };

  const cancelEdit = () => {
      setIsEditing(false);
      let rawMobile = '';
      if (user.mobile && user.mobile !== 'Gmail Verified') {
           rawMobile = user.mobile.replace('+91 ', '').replace('+91', '').trim();
      }
      setFormData({
            name: user.name,
            id: user.id,
            mobile: rawMobile,
            dob: user.dob || '',
            studentClass: user.studentClass || '',
            studentSection: user.studentSection || '',
            subjects: user.subjects || [],
            assignedClasses: user.assignedClasses || [],
            password: user.password,
            status: user.status,
            avatar: user.avatar || ''
      });
  };

  // Document Handling
  const triggerDocUpload = (key: keyof StudentDocuments) => {
      setSelectedDocKey(key);
      setTimeout(() => docInputRef.current?.click(), 100);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedDocKey && user) {
          if (file.size > 5 * 1024 * 1024) {
              alert("File too large (Max 5MB)");
              return;
          }
          const reader = new FileReader();
          reader.onload = async (ev) => {
              const base64 = ev.target?.result as string;
              await updateUserDocuments(user.id, { [selectedDocKey]: base64 });
              alert(`Updated ${selectedDocKey} for ${user.name}`);
              setSelectedDocKey(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const viewDocument = (base64Data: string) => {
      const win = window.open();
      win?.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  };

  const deleteDocument = async (key: keyof StudentDocuments) => {
      if (confirm(`Remove this document from ${user.name}'s profile?`)) {
          await updateUserDocuments(user.id, { [key]: undefined }); // undefined to remove
      }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      
      <header className="flex items-center justify-between px-2">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Registry
        </button>
        
        <div className="flex items-center gap-2">
            {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest hover:bg-indigo-700"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <button 
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button 
                      onClick={saveChanges}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest hover:bg-emerald-600"
                    >
                      <Save size={14} /> Save
                    </button>
                </div>
            )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-full h-32 ${isTeacher ? 'bg-amber-900' : 'bg-slate-900'}`}>
           <div className={`absolute inset-0 bg-gradient-to-r ${isTeacher ? 'from-amber-600 to-orange-500' : 'from-indigo-600 to-violet-600'} opacity-90`} />
           <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative px-8 pt-16 pb-8">
           <div className="flex flex-col md:flex-row gap-6 items-start">
              
              <div className="relative group shrink-0 mx-auto md:mx-0">
                 <div className="w-32 h-32 rounded-[2rem] border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
                    {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        isTeacher ? <GraduationCap size={48} className="text-slate-300" /> : <User size={48} className="text-slate-300" />
                    )}
                    
                    {isEditing && (
                        <div 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="text-white" size={24} />
                        </div>
                    )}
                 </div>
                 
                 {!isEditing && (
                     <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                         user.status === 'APPROVED' ? 'bg-emerald-500' : 
                         user.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-amber-500'
                     }`}>
                         {user.status === 'APPROVED' && <CheckCircle2 size={12} className="text-white" />}
                         {user.status === 'BLOCKED' && <Ban size={12} className="text-white" />}
                         {user.status === 'PENDING' && <Clock size={12} className="text-white" />}
                     </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1 text-center md:text-left pt-2 md:pt-16 space-y-2 w-full">
                 {isEditing ? (
                     <div className="space-y-4 max-w-sm">
                         <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Full Name</label>
                             <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                             />
                         </div>
                         <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Account Status</label>
                             <select 
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as UserStatus})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                             >
                                 <option value="PENDING">PENDING</option>
                                 <option value="APPROVED">APPROVED</option>
                                 <option value="BLOCKED">BLOCKED</option>
                             </select>
                         </div>
                     </div>
                 ) : (
                     <>
                         <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                         <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                user.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                user.status === 'BLOCKED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                Status: {user.status}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                isTeacher ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                                Role: {isTeacher ? 'Faculty' : 'Student'}
                            </span>
                         </div>
                     </>
                 )}
              </div>

              {!isEditing && (
                <div className="flex flex-row md:flex-col gap-2 pt-4 md:pt-16 w-full md:w-auto justify-center">
                    {user.status !== 'APPROVED' && (
                        <button 
                            onClick={() => handleStatusChange('APPROVED')}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Approve
                        </button>
                    )}
                    {user.status !== 'BLOCKED' && (
                        <button 
                            onClick={() => handleStatusChange('BLOCKED')}
                            className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Ban size={16} /> Block User
                        </button>
                    )}
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* ... (Existing Profile Cards - Email, Mobile, DOB, Class) ... */}
         {isEditing ? (
             <EditCard 
                label={isTeacher ? "Faculty Email" : "Student ID / Email"}
                icon={<Mail className="text-indigo-500" />}
             >
                 <input 
                    type="text"
                    value={formData.id}
                    onChange={e => setFormData({...formData, id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                 />
             </EditCard>
         ) : (
             <DetailCard 
                icon={<Mail className="text-indigo-500" />}
                label={isTeacher ? "Faculty Email" : "Student ID / Email"}
                value={user.id}
                action={
                    <button onClick={() => copyToClipboard(user.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <Copy size={16} />
                    </button>
                }
             />
         )}

         {isEditing ? (
             <EditCard 
                label="Mobile Number" 
                icon={<Phone className="text-emerald-500" />}
             >
                 <div className="flex items-center w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                     <span className="text-slate-400 font-bold border-r border-slate-200 pr-2 mr-2 select-none text-sm">+91</span>
                     <input 
                        type="tel"
                        value={formData.mobile}
                        maxLength={10}
                        onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        placeholder="0000000000"
                        className="w-full bg-transparent font-medium text-slate-900 focus:outline-none transition-all tracking-widest"
                     />
                 </div>
             </EditCard>
         ) : (
             <DetailCard 
                icon={<Phone className="text-emerald-500" />}
                label="Mobile Number"
                value={user.mobile || "Not Linked"}
             />
         )}

         {isEditing ? (
             <EditCard 
                label="Date of Birth" 
                icon={<Calendar className="text-amber-500" />}
             >
                 <input 
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-amber-500 transition-all [color-scheme:light]"
                 />
             </EditCard>
         ) : (
             <DetailCard 
                icon={<Calendar className="text-amber-500" />}
                label="Date of Birth"
                value={user.dob || "Not Provided"}
             />
         )}

         {/* Teacher/Student Specific Fields Logic */}
         {isTeacher && (
             isEditing ? (
                 <EditCard 
                    label="Core Subjects (Profile)" 
                    icon={<BookOpen className="text-indigo-500" />}
                 >
                     <p className="text-[9px] text-slate-400 mb-2">Select the subjects this faculty member is qualified to teach.</p>
                     <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                         {TEACHER_SUBJECTS.map(sub => (
                             <button
                                 key={sub}
                                 onClick={() => toggleSubject(sub)}
                                 className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                                     formData.subjects.includes(sub)
                                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                     : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                                 }`}
                             >
                                 {sub}
                             </button>
                         ))}
                     </div>
                 </EditCard>
             ) : (
                 <DetailCard 
                    icon={<BookOpen className="text-indigo-500" />}
                    label="Core Subjects"
                    value=""
                    action={
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {user.subjects && user.subjects.length > 0 ? user.subjects.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-wide border border-indigo-100">{s}</span>
                            )) : <span className="text-xs text-slate-400 italic">None Selected</span>}
                        </div>
                    }
                 />
             )
         )}

         {!isTeacher && (
             isEditing ? (
                 <EditCard 
                    label="Class & Section" 
                    icon={<Layout className="text-indigo-500" />}
                 >
                     <div className="grid grid-cols-2 gap-2">
                         <select
                            value={formData.studentClass}
                            onChange={e => setFormData({...formData, studentClass: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                         >
                            <option value="">Grade</option>
                            {CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                         </select>
                         <select
                            value={formData.studentSection}
                            onChange={e => setFormData({...formData, studentSection: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                         >
                            <option value="">Section</option>
                            {SECTION_OPTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                         </select>
                     </div>
                 </EditCard>
             ) : (
                 <DetailCard 
                    icon={<Layout className="text-indigo-500" />}
                    label="Class & Section"
                    value={`${user.studentClass || "Not Set"} / ${user.studentSection || "N/A"}`}
                 />
             )
         )}

         {isTeacher && (
             isEditing ? (
                 <div className="md:col-span-2 space-y-4">
                     <EditCard 
                        label="Faculty Assignment Manager" 
                        icon={<Layers className="text-indigo-500" />}
                     >
                         <div className="space-y-4">
                             {/* New Combined Assignment Adder */}
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Add New Teaching Assignment</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={newAssignment.class}
                                        onChange={e => setNewAssignment({...newAssignment, class: e.target.value})}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                    >
                                        <option value="">Class</option>
                                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select
                                        value={newAssignment.section}
                                        onChange={e => setNewAssignment({...newAssignment, section: e.target.value})}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                    >
                                        <option value="">Section</option>
                                        {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <select
                                        value={newAssignment.subject}
                                        onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                    >
                                        <option value="">Subject</option>
                                        {/* Dynamic Subject List based on Teacher's Core Subjects */}
                                        {formData.subjects.length > 0 ? (
                                            formData.subjects.map(s => <option key={s} value={s}>{s}</option>)
                                        ) : (
                                            <option value="" disabled>No Core Subjects Defined</option>
                                        )}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    {formData.subjects.length === 0 && (
                                        <span className="text-[8px] text-rose-500 font-bold ml-1">* Select Core Subjects above first</span>
                                    )}
                                    <button 
                                        onClick={addAssignment}
                                        disabled={!newAssignment.class || !newAssignment.section || !newAssignment.subject}
                                        className="ml-auto w-auto px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                    >
                                        + Assign
                                    </button>
                                </div>
                             </div>

                             {/* Assignment List */}
                             <div>
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Current Assignments</label>
                                 <div className="flex flex-wrap gap-2">
                                     {formData.assignedClasses.length > 0 ? formData.assignedClasses.map((assign, idx) => (
                                         <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                             <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">{assign}</span>
                                             <button 
                                                onClick={() => removeAssignment(assign)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                             >
                                                 <X size={12} />
                                             </button>
                                         </div>
                                     )) : (
                                         <span className="text-xs text-slate-400 italic">No classes assigned.</span>
                                     )}
                                 </div>
                             </div>

                             {/* Class Teacher Section */}
                             <div className="pt-4 border-t border-slate-100">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Designate Class Teacher (Optional)</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <select
                                        value={formData.studentClass}
                                        onChange={e => setFormData({...formData, studentClass: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition-all appearance-none text-xs"
                                     >
                                        <option value="">Select Class</option>
                                        {CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                     </select>
                                     <select
                                        value={formData.studentSection}
                                        onChange={e => setFormData({...formData, studentSection: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 transition-all appearance-none text-xs"
                                     >
                                        <option value="">Select Section</option>
                                        {SECTION_OPTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                     </select>
                                 </div>
                             </div>
                         </div>
                     </EditCard>
                 </div>
             ) : (
                 <div className="md:col-span-2">
                     <DetailCard 
                        icon={<Layers className="text-indigo-500" />}
                        label="Faculty Profile"
                        value=""
                        action={
                            <div className="w-full space-y-3 mt-2">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teaching Assignments</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses.map((c, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-white border border-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm">{c}</span>
                                        )) : <span className="text-xs text-slate-400 italic">None</span>}
                                    </div>
                                </div>
                                
                                {(user.studentClass || user.studentSection) && (
                                    <div className="pt-2 border-t border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Teacher Of</p>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100 uppercase tracking-wider">{user.studentClass} - {user.studentSection}</span>
                                    </div>
                                )}
                            </div>
                        }
                     />
                 </div>
             )
         )}

         {isEditing ? (
             <EditCard 
                label="Account Password" 
                icon={<Lock className="text-rose-500" />}
             >
                 <div className="relative">
                     <input 
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-mono text-slate-900 focus:outline-none focus:border-rose-500 transition-all pr-10"
                     />
                     <button 
                         onClick={() => setShowPassword(!showPassword)} 
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                     >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                 </div>
             </EditCard>
         ) : (
             <DetailCard 
                icon={<Lock className="text-rose-500" />}
                label="Account Password"
                value={showPassword ? user.password : "••••••••••••"}
                isMono
                action={
                    <button onClick={() => setShowPassword(!showPassword)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                }
             />
         )}
      </div>

      {/* Document Management Section (Only for Student Profiles) */}
      {!isTeacher && !isEditing && (
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <FileText className="text-indigo-600" size={18} /> Official Documents
              </h4>
              <div className="space-y-3">
                  {REQUIRED_DOCS.map((doc) => {
                      const existingDoc = user.documents?.[doc.key];
                      return (
                          <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existingDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                      {existingDoc ? <Check size={16} /> : <FileText size={16} />}
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 max-w-[120px] md:max-w-none truncate">{doc.label}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                  {existingDoc ? (
                                      <>
                                          <button 
                                              onClick={() => viewDocument(existingDoc)}
                                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-all"
                                          >
                                              <Eye size={12} /> View
                                          </button>
                                          <button 
                                              onClick={() => triggerDocUpload(doc.key)}
                                              className="p-1.5 bg-white text-indigo-500 rounded-lg hover:bg-indigo-50 border border-slate-100 shadow-sm"
                                              title="Replace Document"
                                          >
                                              <Edit3 size={12} />
                                          </button>
                                          <button 
                                              onClick={() => deleteDocument(doc.key)}
                                              className="p-1.5 bg-white text-rose-500 rounded-lg hover:bg-rose-50 border border-slate-100 shadow-sm"
                                              title="Delete Document"
                                          >
                                              <Trash2 size={12} />
                                          </button>
                                      </>
                                  ) : (
                                      <button 
                                          onClick={() => triggerDocUpload(doc.key)}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                                      >
                                          <UploadCloud size={12} /> Upload
                                      </button>
                                  )}
                              </div>
                          </div>
                      );
                  })}
                  <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocUpload} />
              </div>
          </div>
      )}
    </div>
  );
};

const DetailCard = ({ icon, label, value, action, isMono }: { icon: React.ReactNode, label: string, value: string, action?: React.ReactNode, isMono?: boolean }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-50 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-md transition-all shrink-0">
                {icon}
            </div>
            <div className="min-w-0 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                {value && <p className={`text-base font-bold text-slate-900 truncate ${isMono ? 'font-mono' : ''}`}>{value}</p>}
                {action}
            </div>
        </div>
    </div>
);

const EditCard = ({ icon, label, children }: { icon: React.ReactNode, label: string, children?: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-sm flex flex-col gap-2 relative">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        {children}
    </div>
);


import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store.ts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, Users, Database, FileText, 
  Settings, ChevronRight, Activity, Plus,
  Layers, HardDrive, Cpu, Lock, User, CheckCircle2, Ban, Clock, Loader2, AlertCircle, Eye, GraduationCap, Filter, Layout, Search, X, Download, UploadCloud, UserPlus, Trash, Trash2,
  Banknote, ReceiptIndianRupee, AlertTriangle
} from 'lucide-react';
import { UserStatus, RegisteredUser, UserRole } from '../types.ts';

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const AdminDashboard: React.FC = () => {
  const { state, updateUserStatus, adminAssignClassToTeacher, adminAddUser, adminAddUsersBulk, adminDeleteUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Initialize tab from location state if available (preserves selection on back navigation)
  const [registryTab, setRegistryTab] = useState<'STUDENTS' | 'TEACHERS'>((location.state as any)?.tab || 'STUDENTS');
  
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null, name: string | null, role: string | null }>({
      isOpen: false, id: null, name: null, role: null
  });
  
  const csvInputRef = useRef<HTMLInputElement>(null);

  // New User Form State
  const [newUser, setNewUser] = useState<Partial<RegisteredUser>>({
    name: '', id: '', mobile: '', dob: '', studentClass: '', studentSection: '', password: '', status: 'APPROVED', role: 'USER', subjects: []
  });

  const CLASS_OPTIONS = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  // Filter users by role
  const students = useMemo(() => state.registeredUsers.filter(u => u.role === 'USER' || !u.role), [state.registeredUsers]);
  const teachers = useMemo(() => state.registeredUsers.filter(u => u.role === 'TEACHER'), [state.registeredUsers]);

  // Unified Filtering Logic
  const filteredRegistry = useMemo(() => {
      let list = registryTab === 'STUDENTS' ? students : teachers;
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
      }
      if (registryTab === 'STUDENTS' && classFilter !== 'ALL') {
          list = list.filter(s => s.studentClass === classFilter);
      }
      return list;
  }, [registryTab, students, teachers, searchQuery, classFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredRegistry].sort((a, b) => {
        // Sort alphabetically by Name (A-Z)
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, [filteredRegistry]);
  
  const activeStudents = students.filter(u => u.status === 'APPROVED').length;
  const activeTeachers = teachers.filter(u => u.status === 'APPROVED').length;
  const pendingUsers = state.registeredUsers.filter(u => u.status === 'PENDING').length;
  
  const totalStorage = state.subjects.reduce((acc, s) => 
    acc + s.topics.reduce((tAcc, t) => 
        tAcc + t.materials.reduce((mAcc, m) => mAcc + (m.fileSize || 0), 0)
    , 0)
  , 0);

  const formattedStorage = totalStorage > 1024 * 1024 
    ? `${(totalStorage / (1024 * 1024)).toFixed(2)} MB` 
    : `${(totalStorage / 1024).toFixed(2)} KB`;

  const handleStatusChange = async (e: React.MouseEvent, id: string, newStatus: UserStatus) => {
      e.preventDefault();
      e.stopPropagation();
      setProcessingId(id);
      await updateUserStatus(id, newStatus);
      setProcessingId(null);
  };

  const initiateDelete = (e: React.MouseEvent, user: RegisteredUser) => {
      e.preventDefault();
      e.stopPropagation();
      setDeleteConfirm({
          isOpen: true,
          id: user.id,
          name: user.name,
          role: registryTab === 'STUDENTS' ? 'Student' : 'Faculty Member'
      });
  };

  const confirmDelete = async () => {
      if (deleteConfirm.id) {
          await adminDeleteUser(deleteConfirm.id);
          setDeleteConfirm({ isOpen: false, id: null, name: null, role: null });
      }
  };

  const handleRowClick = (id: string) => {
      navigate(`/admin/student/${id}`, { state: { tab: registryTab } });
  };

  const handleManualAdd = async () => {
      if (!newUser.name || !newUser.id || !newUser.password) {
          alert("Required fields missing.");
          return;
      }
      if (newUser.mobile && newUser.mobile.length !== 10) {
          alert("10 digits required for mobile.");
          return;
      }
      
      // Check for duplicates manually
      if (state.registeredUsers.some(u => u.id.toLowerCase() === newUser.id?.toLowerCase())) {
          alert("User with this ID/Email already exists.");
          return;
      }

      const formattedMobile = newUser.mobile ? `+91 ${newUser.mobile}` : '';
      const success = await adminAddUser({
          ...newUser as RegisteredUser,
          mobile: formattedMobile,
          role: registryTab === 'STUDENTS' ? 'USER' : 'TEACHER'
      });
      if (success) {
          setIsManualModalOpen(false);
          setNewUser({ name: '', id: '', mobile: '', dob: '', studentClass: '', studentSection: '', password: '', status: 'APPROVED', role: 'USER', subjects: [] });
      }
  };

  const parseCSVRow = (text: string, delimiter: string = ',') => {
    const res = [];
    let p = '', c = '', quote = false;
    for (let i = 0; i < text.length; i++) {
        c = text[i];
        if (c === '"') {
            if (quote && text[i + 1] === '"') { p += c; i++; } else quote = !quote;
        } else if (c === delimiter && !quote) { res.push(p); p = ''; } else p += c;
    }
    res.push(p);
    return res;
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          let content = event.target?.result as string;
          content = content.replace(/^\uFEFF/, '');
          const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
          if (lines.length < 2) return;
          
          const dataRows = lines.slice(1);
          const usersToAdd: RegisteredUser[] = [];
          const existingIds = new Set(state.registeredUsers.map(u => u.id.toLowerCase()));
          const newIdsInBatch = new Set<string>();
          let duplicatesCount = 0;
          
          for (const row of dataRows) {
              const cols = parseCSVRow(row).map(p => p.replace(/^"|"$/g, '').trim());
              
              if (cols.length < 3) continue;

              // Check ID (Index 2 for both Students and Teachers based on export logic)
              const rawId = cols[2];
              if (!rawId) continue;
              
              const idToCheck = rawId.toLowerCase();

              // Check for duplicates in existing users OR current batch
              if (existingIds.has(idToCheck) || newIdsInBatch.has(idToCheck)) {
                  duplicatesCount++;
                  continue;
              }

              if (registryTab === 'STUDENTS') {
                  // STUDENT PATTERN: Avatar, Name, ID, Mobile, DOB, Class, Section, Password, Status
                  usersToAdd.push({
                      avatar: cols[0] || '', 
                      name: cols[1] || 'Imported Student',
                      id: idToCheck,
                      mobile: cols[3] ? (cols[3].startsWith('+91') ? cols[3] : `+91 ${cols[3]}`) : '',
                      dob: cols[4] || '',
                      studentClass: cols[5] || '',
                      studentSection: cols[6] || '',
                      password: cols[7] || '123456',
                      status: (cols[8] as UserStatus) || 'APPROVED',
                      role: 'USER',
                      joinedAt: Date.now(),
                      assignedClasses: [],
                      subjects: []
                  });
              } else {
                  // TEACHER PATTERN: Avatar, Name, Email ID, Mobile, DOB, Core Subjects, Password, Status
                  const subjectsList = cols[5] ? cols[5].split(';').map(s => s.trim()).filter(Boolean) : [];
                  
                  usersToAdd.push({
                      avatar: cols[0] || '',
                      name: cols[1] || 'Imported Teacher',
                      id: idToCheck,
                      mobile: cols[3] ? (cols[3].startsWith('+91') ? cols[3] : `+91 ${cols[3]}`) : '',
                      dob: cols[4] || '',
                      subjects: subjectsList,
                      password: cols[6] || '123456',
                      status: (cols[7] as UserStatus) || 'APPROVED',
                      role: 'TEACHER',
                      studentClass: '',
                      studentSection: '',
                      joinedAt: Date.now(),
                      assignedClasses: []
                  });
              }
              newIdsInBatch.add(idToCheck);
          }
          
          if (usersToAdd.length > 0) {
              await adminAddUsersBulk(usersToAdd);
              alert(`Imported ${usersToAdd.length} new records.${duplicatesCount > 0 ? ` Skipped ${duplicatesCount} duplicates.` : ''}`);
          } else {
              alert(duplicatesCount > 0 ? `All ${duplicatesCount} records were duplicates and skipped.` : "No valid records found to import.");
          }

          if (csvInputRef.current) csvInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const handleCsvExport = () => {
      const dataToExport = filteredRegistry;
      if (dataToExport.length === 0) {
          alert("No records to export.");
          return;
      }

      let headers: string[] = [];
      let rows: string[][] = [];

      if (registryTab === 'STUDENTS') {
          // Student Pattern
          headers = ["Avatar", "Name", "ID/Email", "Mobile", "Date of Birth", "Class", "Section", "Password", "Status"];
          rows = dataToExport.map(u => [
              `"${u.avatar || ''}"`,
              `"${u.name}"`,
              `"${u.id}"`,
              `"${u.mobile ? u.mobile.replace('+91 ', '') : ''}"`,
              `"${u.dob || ''}"`,
              `"${u.studentClass || ''}"`,
              `"${u.studentSection || ''}"`,
              `"${u.password}"`,
              `"${u.status}"`
          ]);
      } else {
          // Teacher Pattern
          headers = ["Photo of teacher", "Name", "Email ID", "Mobile Number", "Date of Birth", "Core Subjects", "Password", "Status"];
          rows = dataToExport.map(u => [
              `"${u.avatar || ''}"`,
              `"${u.name}"`,
              `"${u.id}"`,
              `"${u.mobile ? u.mobile.replace('+91 ', '') : ''}"`,
              `"${u.dob || ''}"`,
              `"${(u.subjects || []).join(';')}"`, // Export subjects separated by semicolon
              `"${u.password}"`,
              `"${u.status}"`
          ]);
      }

      const csvContent = [
          headers.join(','),
          ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${registryTab.toLowerCase()}_registry_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col gap-2">
         <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 w-fit rounded-full">
            <ShieldCheck size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Administrator Access</span>
         </div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Control</h2>
         <p className="text-slate-500">Manage curriculum architecture and monitor local repository status.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
         <AdminStatCard icon={<Users className="text-emerald-500" />} label="Students" value={activeStudents.toString()} subValue="Active Learners" />
         <AdminStatCard icon={<GraduationCap className="text-amber-500" />} label="Faculty" value={activeTeachers.toString()} subValue="Active Teachers" />
         <AdminStatCard icon={<Clock className="text-blue-500" />} label="Pending" value={pendingUsers.toString()} subValue="Needs Approval" />
         <AdminStatCard icon={<HardDrive className="text-rose-500" />} label="Vault Usage" value={formattedStorage} subValue="Local Storage" />
      </div>

      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Cpu size={20} className="text-indigo-600" /> Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/subjects" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-100 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={20} /></div>
                    <div><h4 className="font-bold text-slate-900 text-xs">Modules</h4><p className="text-[9px] text-slate-500">Upload Content</p></div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
            </Link>
            
            <Link to="/admin/fees" className="flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100/50 rounded-2xl border border-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Banknote size={20} /></div>
                    <div><h4 className="font-bold text-slate-900 text-xs">Finances</h4><p className="text-[9px] text-slate-500">Fees & Salaries</p></div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-600" />
            </Link>

            <Link to="/settings" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Settings size={20} /></div>
                    <div><h4 className="font-bold text-slate-900 text-xs">Config</h4><p className="text-[9px] text-slate-500">System Backup</p></div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900" />
            </Link>

            <button 
                onClick={() => setRegistryTab(registryTab === 'STUDENTS' ? 'TEACHERS' : 'STUDENTS')}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 transition-all group text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shadow-sm"><Users size={20} /></div>
                    <div><h4 className="font-bold text-slate-900 text-xs">Switch Registry</h4><p className="text-[9px] text-slate-500">To {registryTab === 'STUDENTS' ? 'Faculty' : 'Students'}</p></div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
            </button>
        </div>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${registryTab === 'STUDENTS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {registryTab === 'STUDENTS' ? <Users size={24} /> : <GraduationCap size={24} />}
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 leading-none">
                        {registryTab === 'STUDENTS' ? 'Student Registry' : 'Faculty Registry'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{filteredRegistry.length} Records</p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setIsManualModalOpen(true)} className="h-9 px-4 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 shadow-sm active:scale-95"><UserPlus size={14} /> Add Manual</button>
                <button onClick={() => csvInputRef.current?.click()} className="h-9 px-4 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 shadow-sm active:scale-95"><UploadCloud size={14} /> Import CSV</button>
                <button onClick={handleCsvExport} className="h-9 px-4 bg-white text-blue-600 border border-blue-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 shadow-sm active:scale-95"><Download size={14} /> Export CSV</button>
                <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCsvImport} />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-300 group-focus-within:text-indigo-500"><Search size={18} /></div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Name or ID..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-100 transition-all" />
            </div>
            {registryTab === 'STUDENTS' && (
                <div className="md:col-span-4">
                    <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase text-slate-600 appearance-none cursor-pointer">
                        <option value="ALL">All Grades</option>
                        {CLASS_OPTIONS.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                </div>
            )}
        </div>
        
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
           <div className="grid grid-cols-12 bg-slate-50 p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="col-span-1">Photo</div>
              <div className="col-span-3">Name / ID</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2 text-center">{registryTab === 'STUDENTS' ? 'Class / Section' : 'Assignments'}</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
           </div>
           <div className="max-h-[400px] overflow-y-auto">
             {sortedUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-12 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors items-center text-sm group">
                    <div className="col-span-1 cursor-pointer" onClick={() => handleRowClick(user.id)}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-100">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User size={14} className="text-slate-400" />}</div>
                    </div>
                    <div className="col-span-3 cursor-pointer" onClick={() => handleRowClick(user.id)}>
                        <p className="font-bold text-slate-700 truncate">{user.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">{user.id}</p>
                    </div>
                    <div className="col-span-2 text-slate-500 font-mono text-xs truncate cursor-pointer" onClick={() => handleRowClick(user.id)}>{user.mobile || '-'}</div>
                    <div className="col-span-2 text-center cursor-pointer" onClick={() => handleRowClick(user.id)}>
                        {registryTab === 'STUDENTS' ? (
                            <span className="text-[10px] font-bold text-slate-500">
                                {user.studentClass || '-'}{user.studentSection ? `-${user.studentSection}` : ''}
                            </span>
                        ) : (
                            <div className="flex flex-col gap-1 items-center">
                                <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                                    {user.assignedClasses && user.assignedClasses.length > 0 ? (
                                        <>
                                            {user.assignedClasses.slice(0, 2).map((assign, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[7px] font-black uppercase tracking-wider truncate max-w-[120px]">
                                                    {assign}
                                                </span>
                                            ))}
                                            {user.assignedClasses.length > 2 && (
                                                <span className="text-[8px] font-black text-slate-400">+{user.assignedClasses.length - 2}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold text-slate-300">-</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="col-span-2 cursor-pointer" onClick={() => handleRowClick(user.id)}>
                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${user.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{user.status}</span>
                    </div>
                    <div className="col-span-2 text-right flex justify-end gap-2 relative z-20">
                        <button 
                            type="button" 
                            onClick={(e) => handleStatusChange(e, user.id, user.status === 'APPROVED' ? 'BLOCKED' : 'APPROVED')} 
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 ${user.status === 'APPROVED' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            title={user.status === 'APPROVED' ? "Block User" : "Approve User"}
                        >
                            {user.status === 'APPROVED' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => initiateDelete(e, user)} 
                            className="w-8 h-8 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                            title="Delete User"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
             ))}
           </div>
        </div>
      </section>

      <section className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]" />
         <div className="space-y-6 relative z-10 w-full md:w-auto">
            <h3 className="text-xl font-black flex items-center gap-2"><Activity size={20} className="text-emerald-400" /> System Integrity</h3>
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/5 min-w-[200px]">
                  <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm font-bold">Local Database</span></div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/5 min-w-[200px]">
                  <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm font-bold">Cache Node</span></div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Optimal</span>
               </div>
            </div>
         </div>
         <div className="mt-8 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 relative z-10 md:pl-8">
             <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black text-center md:text-right">Admin Console v2.8</p>
         </div>
      </section>

      {/* Manual Modal */}
      {isManualModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-2xl font-black text-slate-900 mb-6">Manual Entry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ... existing form content ... */}
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Name</label>
                          <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email / ID</label>
                          <input type="email" placeholder="Email/ID" value={newUser.id} onChange={e => setNewUser({...newUser, id: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Password</label>
                          <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mobile</label>
                          <input 
                            type="tel" 
                            placeholder="Mobile (10 digits)" 
                            value={newUser.mobile} 
                            maxLength={10}
                            onChange={e => setNewUser({...newUser, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" 
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date of Birth</label>
                          <input type="date" value={newUser.dob} onChange={e => setNewUser({...newUser, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                      </div>
                      {registryTab === 'STUDENTS' && (
                          <>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Class</label>
                                  <select value={newUser.studentClass} onChange={e => setNewUser({...newUser, studentClass: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none">
                                      <option value="">Select Grade</option>
                                      {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Section</label>
                                  <select value={newUser.studentSection} onChange={e => setNewUser({...newUser, studentSection: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none">
                                      <option value="">Select Section</option>
                                      {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                          </>
                      )}
                  </div>
                  <button onClick={handleManualAdd} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs active:scale-95">Confirm Entry</button>
                  <button onClick={() => setIsManualModalOpen(false)} className="w-full mt-2 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                  <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Delete User?</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                          Are you sure you want to permanently remove <strong className="text-slate-800">{deleteConfirm.name}</strong> from the {deleteConfirm.role} registry?
                      </p>
                      <p className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                          Action Cannot be Undone
                      </p>
                      <div className="grid grid-cols-2 gap-3 w-full mt-4">
                          <button 
                              onClick={() => setDeleteConfirm({ isOpen: false, id: null, name: null, role: null })}
                              className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={confirmDelete}
                              className="py-3 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors active:scale-95"
                          >
                              Yes, Delete
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const AdminStatCard = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) => (
   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
      <div className="flex items-start justify-between mb-4">
         <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metric</span>
      </div>
      <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
      <p className="text-sm font-bold text-slate-500 mt-1">{label}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{subValue}</p>
   </div>
);

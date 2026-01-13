
import React, { useMemo } from 'react';
import { useStore } from '../store.ts';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, Users, User, Mail, Phone, Calendar, 
  ChevronRight, BookOpen, Layers
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { state } = useStore();

  // Filter only students
  const students = useMemo(() => {
    return state.registeredUsers.filter(u => u.role === 'USER' || !u.role);
  }, [state.registeredUsers]);

  const activeStudents = students.filter(s => s.status === 'APPROVED');
  const pendingStudents = students.filter(s => s.status === 'PENDING');
  
  // Get teacher's raw assignments (e.g. "5th - A, English")
  const rawAssignments = state.currentUser?.assignedClasses || [];
  
  // Parse out just the class names for module filtering (e.g. "5th")
  // Handles both new format "5th - A, English" and legacy "5th"
  const distinctClasses = useMemo(() => {
      const classes = new Set<string>();
      rawAssignments.forEach(assign => {
          // Extract "5th" from "5th - A..." or just use "5th"
          const cls = assign.split(' - ')[0].trim();
          if (cls) classes.add(cls);
      });
      return Array.from(classes);
  }, [rawAssignments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col gap-2">
         <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 w-fit rounded-full">
            <GraduationCap size={14} className="text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Faculty Access</span>
         </div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tight">Teacher Dashboard</h2>
         <p className="text-slate-500">Curriculum management and student directory.</p>
         {rawAssignments.length > 0 ? (
             <div className="flex flex-col gap-2 mt-2">
                 <span className="text-xs font-bold text-slate-600">My Assignments:</span>
                 <div className="flex flex-wrap gap-2">
                     {rawAssignments.map((assign, idx) => (
                         <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 uppercase tracking-wide shadow-sm">
                             {assign}
                         </span>
                     ))}
                 </div>
             </div>
         ) : (
             <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold w-fit">
                 No classes assigned. Please contact Admin.
             </div>
         )}
      </header>

      {/* Curriculum Management Action */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800">Curriculum Content</h3>
              <p className="text-xs text-slate-500 mt-1">Upload videos, PDFs, and notes to study modules.</p>
            </div>
            <Link 
              to="/subjects" 
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <BookOpen size={16} /> Manage Modules
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {state.subjects.filter(s => distinctClasses.includes(s.targetClass)).slice(0, 3).map(sub => (
               <Link key={sub.id} to={`/subject/${sub.id}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all flex items-center gap-4">
                  <div className={`w-10 h-10 ${sub.color} text-white rounded-xl flex items-center justify-center`}>
                     <Layers size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{sub.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Class {sub.targetClass} • {sub.topics.length} Units</p>
                  </div>
               </Link>
             ))}
             {state.subjects.filter(s => distinctClasses.includes(s.targetClass)).length > 3 && (
               <Link to="/subjects" className="p-4 bg-white rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                  + More Modules
               </Link>
             )}
          </div>
      </section>

      {/* Student Directory - Read Only */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <Users size={20} className="text-emerald-600" />
               Student Directory
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {activeStudents.length} Active / {pendingStudents.length} Pending
            </span>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-slate-100">
           <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="col-span-2 md:col-span-1">Photo</div>
              <div className="col-span-4 md:col-span-3">Name</div>
              <div className="col-span-3 md:col-span-2">Contact</div>
              <div className="col-span-2 hidden md:block">Class</div>
              <div className="col-span-2 hidden md:block text-right">Status</div>
           </div>
           <div className="max-h-[500px] overflow-y-auto">
             {students.length > 0 ? (
                students.map((user, idx) => (
                   <div 
                     key={idx} 
                     className="grid grid-cols-12 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors items-center text-sm"
                   >
                      <div className="col-span-2 md:col-span-1">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm">
                              {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                  <User size={14} className="text-slate-400" />
                              )}
                          </div>
                      </div>
                      
                      <div className="col-span-4 md:col-span-3 pr-2">
                        <div className="font-bold text-slate-700 truncate">{user.name}</div>
                        <div className="text-[9px] text-slate-400">{user.id}</div>
                      </div>

                      <div className="col-span-3 md:col-span-2">
                         <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                            <Phone size={12} /> {user.mobile || 'N/A'}
                         </div>
                      </div>

                      <div className="col-span-2 hidden md:block text-slate-500 text-xs font-bold">
                        {user.studentClass || '-'}
                      </div>

                      <div className="col-span-2 hidden md:block text-right">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${user.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {user.status}
                        </span>
                      </div>
                   </div>
                ))
             ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium italic">
                   No student records available.
                </div>
             )}
           </div>
        </div>
      </section>
    </div>
  );
};


import React, { useState } from 'react';
import { useStore } from '../store.ts';
import { 
  ShieldCheck, User, ArrowRight, BookOpen, Lock, 
  Mail, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle,
  UserPlus, LogIn, Phone, Clock, Calendar, GraduationCap, Layout, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types.ts';

export const LoginPage: React.FC = () => {
  const { login, signup, state } = useStore();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  
  // Auth State (Shared for Student and Teacher with role distinction)
  const [isSignup, setIsSignup] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userDob, setUserDob] = useState('');
  const [userClass, setUserClass] = useState(''); // Student Only
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]); // Teacher Only
  const [userPassword, setUserPassword] = useState('');
  const [userShowPassword, setUserShowPassword] = useState(false);
  
  // Admin Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const CLASS_OPTIONS = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  const TEACHER_SUBJECTS = [
    'Hindi', 'English', 'Maths', 'Science', 'Sanskrit', 
    'Social Science', 'Computer', 'Drawing', 'Dancing', 
    'Singing', 'Gujrati', 'Marathi', 'Health & Physical', 'Games'
  ];

  const resetForm = () => {
      setUserName('');
      setUserId('');
      setUserMobile('');
      setUserDob('');
      setUserClass('');
      setTeacherSubjects([]);
      setUserPassword('');
      setError('');
      setSuccessMsg('');
  };

  const handleTabChange = (tab: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
      setActiveTab(tab);
      resetForm();
      setIsSignup(false);
  };

  const toggleSubject = (subject: string) => {
      setTeacherSubjects(prev => 
          prev.includes(subject) 
          ? prev.filter(s => s !== subject)
          : [...prev, subject]
      );
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    setSuccessMsg('');
    
    // Simulate Google OAuth Popup & Network Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Google User Data
    const mockGoogleUser = {
        name: activeTab === 'TEACHER' ? "Teacher Alex (Gmail)" : "Alex (Gmail)",
        email: activeTab === 'TEACHER' ? "teacher.alex@gmail.com" : "alex.google@gmail.com",
        password: "GOOGLE_AUTH_TOKEN_SECURE",
        mobile: "Gmail Verified" 
    };

    const normalizedEmail = mockGoogleUser.email.toLowerCase();
    const currentRole: UserRole = activeTab === 'TEACHER' ? 'TEACHER' : 'USER';
    
    // Check if this google user is already in our local database
    const existingUser = state.registeredUsers.find(u => u.id === normalizedEmail);

    if (!existingUser) {
        // New Google User -> Signup automatically as PENDING
        // Note: studentClass/subjects are undefined initially, set in Profile later
        await signup(mockGoogleUser.name, mockGoogleUser.email, mockGoogleUser.password, mockGoogleUser.mobile, "", "", [], currentRole);
        setSuccessMsg("Account request sent via Gmail! Please wait for Admin approval to login.");
        setIsLoading(false);
        return;
    } 

    // Logic for existing Gmail user trying to login
    // Ensure they are logging into the correct portal
    if (existingUser.role !== currentRole) {
        setError(`This account is registered as a ${existingUser.role}. Please switch tabs.`);
        setIsLoading(false);
        return;
    }

    if (existingUser.status === 'PENDING') {
        setError("Account created but still Pending. Please contact Admin.");
        setIsLoading(false);
        return;
    }
    if (existingUser.status === 'BLOCKED') {
        setError("Account Blocked. Contact System Administrator.");
        setIsLoading(false);
        return;
    }

    setSuccessMsg("Gmail authentication successful.");
    await login(existingUser.name, currentRole, normalizedEmail);
    setTimeout(() => {
        navigate(currentRole === 'TEACHER' ? '/teacher' : '/');
    }, 500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    const currentRole: UserRole = activeTab === 'TEACHER' ? 'TEACHER' : 'USER';

    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isSignup) {
        // Signup Logic
        if (!userName.trim() || !userId.trim() || !userPassword.trim() || !userMobile.trim() || !userDob.trim()) {
            setError("All fields (Name, Email, Mobile, DOB, Password) are required.");
            setIsLoading(false);
            return;
        }

        // Student Class validation (only for students)
        if (activeTab === 'STUDENT' && !userClass) {
            setError("Please select your Class/Grade.");
            setIsLoading(false);
            return;
        }

        // Teacher Subject validation (only for teachers)
        if (activeTab === 'TEACHER' && teacherSubjects.length === 0) {
            setError("Please select at least one Subject.");
            setIsLoading(false);
            return;
        }

        // Validate Mobile Number (Exactly 10 digits)
        if (userMobile.length !== 10) {
            setError("Mobile number must be exactly 10 digits.");
            setIsLoading(false);
            return;
        }

        // Add Country Code
        const formattedMobile = `+91 ${userMobile}`;

        const success = await signup(userName, userId, userPassword, formattedMobile, userDob, userClass, teacherSubjects, currentRole);
        if (success) {
            setSuccessMsg("Registration successful! Your account is PENDING approval from Admin.");
            // Clear all form fields
            resetForm();
            // Redirect to Login View so user sees the login form with the success message
            setIsSignup(false);
        } else {
            setError("ID/Email already exists.");
        }
        setIsLoading(false);
    } else {
        // Login Logic
        const normalizedId = userId.trim().toLowerCase();
        const trimmedPassword = userPassword.trim();
        
        const user = state.registeredUsers.find(u => u.id === normalizedId && u.password === trimmedPassword);
        
        if (user) {
            // Check Role Match
            // Note: If 'role' is missing in legacy data, assume 'USER'
            const userRole = user.role || 'USER'; 
            
            if (userRole !== currentRole) {
                 setError(`Invalid Portal. This account is registered as ${userRole}.`);
                 setIsLoading(false);
                 return;
            }

            if (user.status === 'PENDING') {
                setError("Account is awaiting Admin approval. You cannot login yet.");
                setIsLoading(false);
                return;
            }
            if (user.status === 'BLOCKED') {
                setError("Account access has been restricted by Admin.");
                setIsLoading(false);
                return;
            }

            setSuccessMsg("Credentials verified. Entering...");
            await login(user.name, currentRole, user.id);
            setTimeout(() => {
                navigate(currentRole === 'TEACHER' ? '/teacher' : '/');
            }, 500);
        } else {
            setError("Invalid ID or Password.");
            setIsLoading(false);
        }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Hardcoded credentials for the demo (Offline First App)
    if (email.toLowerCase() === 'admin@studyguru.com' && password === 'admin123') {
      await login('Administrator', 'ADMIN', 'admin');
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } else {
      setError('Invalid ID or Password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6 rotate-3 border border-white/10">
             <BookOpen size={40} className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Study Guru</h1>
          <p className="text-slate-400 mt-2 font-medium">Offline Learning Environment</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-2 shadow-2xl">
          
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-black/20 rounded-[2rem] mb-2">
            <button
              onClick={() => handleTabChange('STUDENT')}
              className={`py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'STUDENT' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Student
            </button>
            <button
              onClick={() => handleTabChange('TEACHER')}
              className={`py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TEACHER' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Teacher
            </button>
            <button
              onClick={() => handleTabChange('ADMIN')}
              className={`py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Admin
            </button>
          </div>

          <div className="p-6">
            {(activeTab === 'STUDENT' || activeTab === 'TEACHER') ? (
              <form onSubmit={handleAuth} className="space-y-5 animate-in slide-in-from-left-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white">
                      {isSignup ? `Create ${activeTab === 'TEACHER' ? 'Faculty' : 'Student'} Account` : `${activeTab === 'TEACHER' ? 'Faculty' : 'Student'} Login`}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                      {isSignup ? "Join the hub. Approval required." : "Welcome back to your dashboard."}
                  </p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold animate-in zoom-in-95">
                      <AlertCircle size={14} /> {error}
                    </div>
                )}
                {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in zoom-in-95">
                      {successMsg.includes("Approval") ? <Clock size={14} /> : <CheckCircle2 size={14} />} {successMsg}
                    </div>
                )}

                <div className="space-y-4">
                  {isSignup && (
                      <div className="space-y-1 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Full Name</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <User size={18} />
                          </div>
                          <input 
                            type="text" 
                            aria-label="Full Name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="e.g. Alex Doe" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm"
                          />
                        </div>
                      </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">
                        {activeTab === 'TEACHER' ? 'Faculty Email' : 'Student ID / Email'}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="text" 
                        aria-label="Email or ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder={activeTab === 'TEACHER' ? 'teacher@school.com' : 'student@id.com'}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  {isSignup && (
                    <>
                      {activeTab === 'STUDENT' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Current Class</label>
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Layout size={18} />
                              </div>
                              <select
                                aria-label="Select Grade"
                                value={userClass}
                                onChange={(e) => setUserClass(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm appearance-none"
                              >
                                <option value="" disabled className="text-slate-500">Select Grade</option>
                                {CLASS_OPTIONS.map(cls => (
                                    <option key={cls} value={cls} className="bg-slate-900 text-white">{cls}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                      )}

                      {activeTab === 'TEACHER' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Teaching Subjects</label>
                           <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-3 max-h-32 overflow-y-auto custom-scrollbar">
                              <div className="flex flex-wrap gap-2">
                                 {TEACHER_SUBJECTS.map(subject => {
                                     const isSelected = teacherSubjects.includes(subject);
                                     return (
                                         <button
                                            type="button"
                                            key={subject}
                                            onClick={() => toggleSubject(subject)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${
                                                isSelected 
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-md' 
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'
                                            }`}
                                         >
                                            {subject} {isSelected && <Check size={10} className="inline ml-1" />}
                                         </button>
                                     );
                                 })}
                              </div>
                           </div>
                           <p className="text-[9px] text-slate-500 text-center">Select all that apply</p>
                        </div>
                      )}

                      <div className="space-y-1 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Mobile Number</label>
                          <div className="relative">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Phone size={18} className="text-slate-500" />
                                <span className="text-slate-400 font-black text-sm pt-0.5 border-r border-slate-700 pr-2">+91</span>
                             </div>
                             <input 
                                type="tel" 
                                aria-label="Mobile Number"
                                value={userMobile}
                                maxLength={10}
                                onChange={(e) => setUserMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="0000000000" 
                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-24 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm tracking-widest"
                             />
                          </div>
                      </div>

                      <div className="space-y-1 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Date of Birth</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Calendar size={18} />
                          </div>
                          <input 
                            type="date" 
                            aria-label="Date of Birth"
                            value={userDob}
                            onChange={(e) => setUserDob(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-4">Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={userShowPassword ? "text" : "password"} 
                        aria-label="Password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold text-sm"
                      />
                      <button 
                        type="button"
                        aria-label={userShowPassword ? "Hide password" : "Show password"}
                        onClick={() => setUserShowPassword(!userShowPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {userShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 ${activeTab === 'TEACHER' ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/20' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/20'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : (isSignup ? <><UserPlus size={16} /> Request Access</> : <><LogIn size={16} /> Login Hub</>)}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-3 text-[8px] text-slate-500 font-black uppercase tracking-widest">Or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full bg-white text-slate-900 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-70 shadow-lg"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Signup with Gmail</span>
                  </button>

                  <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => { setIsSignup(!isSignup); resetForm(); }}
                        className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest font-bold border-b border-transparent hover:border-white/20 pb-0.5 transition-all"
                      >
                          {isSignup ? "Already have an account? Login" : `New ${activeTab === 'TEACHER' ? 'Teacher' : 'Student'}? Request Access`}
                      </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white">Admin Portal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Secure access for curriculum management.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold animate-in zoom-in-95">
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Admin ID</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        aria-label="Admin ID"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@studyguru.com" 
                        required
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        aria-label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        required
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium text-sm"
                      />
                      <button 
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Authenticate</>}
                  </button>
                </form>

                {/* Demo Credentials Hint */}
                <div className="text-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Demo Credentials</p>
                  <p className="text-[10px] text-slate-300 font-mono">admin@studyguru.com / admin123</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] mt-8">Secure Environment v2.4</p>
      </div>
    </div>
  );
};

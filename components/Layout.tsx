
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store.ts';
import { 
  Home, BookOpen, Star, BarChart3, Settings, Search, X, 
  Download, ArrowLeft, Video, FileText, Hash, Zap,
  Menu as MenuIcon, ChevronLeft, ChevronRight, Sparkles,
  Command, Box, Activity, ShieldCheck, LogOut, User, GraduationCap
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout } = useStore();
  const [searchActive, setSearchActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic SEO Title Updates
  useEffect(() => {
    const path = location.pathname;
    let title = 'Study Guru | Premium Learning Hub';
    
    if (path === '/') title = 'Dashboard | Study Guru';
    else if (path.startsWith('/admin/student')) title = 'Student Profile | Study Guru';
    else if (path.startsWith('/admin/fees')) title = 'Fee Management | Study Guru';
    else if (path.startsWith('/admin/revenue')) title = 'Revenue Analytics | Study Guru';
    else if (path.startsWith('/admin')) title = 'Admin Console | Study Guru';
    else if (path.startsWith('/teacher')) title = 'Faculty Dashboard | Study Guru';
    else if (path.startsWith('/subject')) title = 'Module Content | Study Guru';
    else if (path.startsWith('/topic')) title = 'Study Session | Study Guru';
    else if (path === '/subjects') title = 'Curriculum Modules | Study Guru';
    else if (path === '/favorites') title = 'My Favorites | Study Guru';
    else if (path === '/downloads') title = 'Offline Vault | Study Guru';
    else if (path === '/stats') title = 'Performance Analytics | Study Guru';
    else if (path === '/settings') title = 'Settings & Config | Study Guru';
    else if (path === '/search') title = 'Search Results | Study Guru';
    else if (path === '/login') title = 'Secure Login | Study Guru';

    document.title = title;
  }, [location]);

  // If no user is logged in, and we are not on the login page, redirect
  useEffect(() => {
    if (!state.currentUser && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [state.currentUser, location.pathname, navigate]);

  // Redirect First-Time Students to Settings/Profile Page
  useEffect(() => {
    if (state.currentUser?.role === 'USER' && state.currentUser.isFirstLogin && location.pathname !== '/settings') {
        navigate('/settings', { replace: true });
    }
  }, [state.currentUser, location.pathname, navigate]);

  // Tablet Optimization: Auto-collapse on standard tablet widths
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1280) {
        setIsExpanded(false);
      } else if (window.innerWidth >= 1280) {
        setIsExpanded(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSearchActive(false);
  }, [location.pathname]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchActive(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If on login page, render children directly without layout
  // This check must happen AFTER all hooks are called
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const isAdmin = state.currentUser?.role === 'ADMIN';
  const isTeacher = state.currentUser?.role === 'TEACHER';
  
  const motionClass = state.settings.reduceMotion ? 'reduce-motion' : '';

  return (
    <div className={`flex flex-col min-h-screen bg-slate-50 ${motionClass}`}>
      
      {/* PERSISTENT TOP HEADER: Branding & Global Actions (Tablet/Desktop) */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white/60 backdrop-blur-2xl border-b border-slate-100 z-[60] px-6 items-center justify-between shadow-sm">
        <div 
          className="flex items-center gap-3 group cursor-pointer" 
          onClick={() => navigate('/')}
          role="button"
          aria-label="Go to Dashboard"
          tabIndex={0}
        >
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 transition-transform group-hover:scale-110">
            <Command size={18} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">Guru Core</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : isTeacher ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
               <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400">
                 {isAdmin ? 'Admin Mode' : isTeacher ? 'Teacher Mode' : 'Student Mode'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* REDESIGNED NANO-PRISM SCANNER (ULTRA COMPACT TABLET VIEW) */}
           <div className="relative group md:w-20 lg:w-32 focus-within:md:w-44 lg:focus-within:w-56 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
              <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                 <div className="relative w-6 h-6 flex items-center justify-center">
                    {/* Multi-Color Glossy Prism Icon Container */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-orange-400 rounded-lg shadow-[0_2px_10px_rgba(99,102,241,0.5)] border border-white/40 transition-all duration-700 group-focus-within:rotate-[360deg] group-hover:scale-110" />
                    <div className="absolute inset-[1.5px] bg-white/10 backdrop-blur-[2px] rounded-md border border-white/20 z-[1]" />
                    <Search size={9} strokeWidth={5} className="relative z-[5] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                 </div>
              </div>
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="SCAN..." 
                  aria-label="Global search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 bg-white/40 backdrop-blur-3xl border border-white/90 rounded-xl pl-9 pr-3 text-[8px] font-black text-slate-800 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-400/30 transition-all placeholder:text-slate-200 uppercase tracking-[0.4em] shadow-inner"
                />
              </form>
              {/* Spectral Reflection Layer */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/40 via-transparent to-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 border border-white/50" />
           </div>
           
           {/* User Profile & Logout Menu */}
           <div className="relative group z-50">
               {/* Trigger Button */}
               <button 
                 className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all group-hover:border-indigo-200"
                 aria-label="User Profile Menu"
               >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-md transition-transform group-hover:scale-110 ${isAdmin ? 'bg-indigo-600' : isTeacher ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {state.currentUser?.name.charAt(0).toUpperCase()}
                  </div>
               </button>
               
               {/* Hover Panel */}
               <div className="absolute top-full right-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 w-60">
                 <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-5 relative overflow-hidden">
                    {/* Decorative Gradient Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100/50">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg ${isAdmin ? 'bg-indigo-600' : isTeacher ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                          {state.currentUser?.name.charAt(0).toUpperCase()}
                       </div>
                       <div className="overflow-hidden">
                          <h4 className="font-black text-slate-800 text-xs truncate">{state.currentUser?.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {isAdmin ? 'System Admin' : isTeacher ? 'Faculty' : 'Student'}
                          </p>
                       </div>
                    </div>
                    
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group/logout shadow-sm hover:shadow-lg hover:shadow-rose-200"
                    >
                       <LogOut size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Secure Logout</span>
                    </button>
                 </div>
               </div>
           </div>
        </div>
      </header>

      {/* ULTRA-COMPACT "NANO DOCK" SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? 'w-60' : 'w-20'}`}
      >
        <div className="h-full p-2 md:p-3">
          <div className="glass-panel gloss-reflection h-full rounded-[2.5rem] flex flex-col border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.03)] overflow-hidden bg-white/40 backdrop-blur-3xl">
            <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto hide-scrollbar">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
                className={`w-full flex items-center rounded-2xl transition-all duration-500 group h-12 mb-6 ${
                  isExpanded ? 'px-4 bg-slate-900 text-white shadow-xl' : 'justify-center bg-slate-100/50 text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className="transition-transform duration-500 group-active:scale-90 flex-shrink-0">
                  {isExpanded ? <ChevronLeft size={20} /> : <MenuIcon size={20} />}
                </div>
                {isExpanded && (
                  <span className="ml-3 text-[10px] font-black tracking-[0.2em] uppercase">Control</span>
                )}
              </button>

              {isAdmin && (
                <MenuLink to="/admin" icon={<ShieldCheck />} label="Admin" expanded={isExpanded} activeColor="text-indigo-600" activeBg="bg-indigo-600" />
              )}
              {isTeacher && (
                <MenuLink to="/teacher" icon={<GraduationCap />} label="Faculty" expanded={isExpanded} activeColor="text-amber-500" activeBg="bg-amber-500" />
              )}
              <MenuLink to="/" icon={<Home />} label="Hub" expanded={isExpanded} activeColor="text-blue-500" activeBg="bg-blue-500" />
              <MenuLink to="/subjects" icon={<BookOpen />} label="Modules" expanded={isExpanded} activeColor="text-emerald-500" activeBg="bg-emerald-500" />
              <MenuLink to="/favorites" icon={<Star />} label="Saved" expanded={isExpanded} activeColor="text-amber-500" activeBg="bg-amber-500" />
              <MenuLink to="/downloads" icon={<Download />} label="Vault" expanded={isExpanded} activeColor="text-rose-500" activeBg="bg-rose-500" />
              <MenuLink to="/stats" icon={<BarChart3 />} label="Analytic" expanded={isExpanded} activeColor="text-violet-500" activeBg="bg-violet-500" />
              <MenuLink to="/settings" icon={<Settings />} label="Config" expanded={isExpanded} activeColor="text-slate-500" activeBg="bg-slate-500" />
            </nav>

            <div className="p-2 mt-auto border-t border-slate-50">
               <div className={`flex flex-col gap-2 p-2 rounded-2xl bg-slate-50 transition-all ${isExpanded ? 'items-start' : 'items-center'}`}>
                  <Activity size={14} className="text-emerald-400" />
                  {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-left-2">
                       <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 leading-none">
                         {state.currentUser?.name}
                       </p>
                       <p className="text-[8px] font-black text-emerald-600 mt-1">Online</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-[60]">
        <div className={`bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 py-3 transition-all duration-300 ${searchActive ? 'h-auto shadow-lg' : 'h-[60px]'}`}>
          {!searchActive ? (
            <div className="flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Command size={18} />
                </div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Guru Core</h1>
              </div>
              <button 
                onClick={() => setSearchActive(true)}
                aria-label="Open Search"
                className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shadow-sm"
              >
                <Search size={20} />
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
              <div className="flex items-center gap-2 h-12 mt-1">
                <button 
                  onClick={() => setSearchActive(false)}
                  aria-label="Close Search"
                  className="flex items-center justify-center w-10 h-10 -ml-1 text-slate-400"
                >
                  <ArrowLeft size={22} />
                </button>
                <form onSubmit={handleSearch} className="flex-1 relative h-10">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search node..." 
                    aria-label="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-full bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-900 focus:bg-white transition-all outline-none"
                  />
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className={`flex-1 w-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] pt-4 md:pt-24 pb-32 md:pb-12 ${isExpanded ? 'md:pl-60' : 'md:pl-24'}`}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] flex items-center justify-around py-2.5 px-2 z-50 shadow-2xl shadow-indigo-200/20 ring-1 ring-slate-900/5">
        <MobileNavLink to="/" icon={<Home size={20} />} label="Hub" activeColor="text-indigo-600" activeBg="bg-indigo-50" />
        <MobileNavLink to="/subjects" icon={<BookOpen size={20} />} label="Study" activeColor="text-emerald-600" activeBg="bg-emerald-50" />
        {isAdmin && <MobileNavLink to="/admin" icon={<ShieldCheck size={20} />} label="Admin" activeColor="text-indigo-600" activeBg="bg-indigo-50" />}
        {isTeacher && <MobileNavLink to="/teacher" icon={<GraduationCap size={20} />} label="Faculty" activeColor="text-amber-600" activeBg="bg-amber-50" />}
        <MobileNavLink to="/stats" icon={<BarChart3 size={20} />} label="Stats" activeColor="text-violet-600" activeBg="bg-violet-50" />
        <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 transition-all duration-500 flex-1 py-1.5 relative group text-slate-400 font-medium">
           <div className="relative z-10"><LogOut size={20} /></div>
           <span className="relative z-10 text-[8px] uppercase tracking-widest opacity-60">Exit</span>
        </button>
      </nav>
    </div>
  );
};

const MenuLink = ({ to, icon, label, expanded, activeColor, activeBg }: { to: string; icon: React.ReactElement; label: string; expanded: boolean; activeColor: string; activeBg: string }) => (
  <NavLink
    to={to}
    title={label}
    className={({ isActive }) =>
      `flex items-center rounded-2xl transition-all duration-500 group h-12 relative overflow-hidden ${
        expanded ? 'px-4' : 'justify-center w-full'
      } ${
        isActive 
          ? `shadow-xl ${activeBg} text-white` 
          : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-60 animate-pulse" />
        )}
        <div className={`relative z-10 transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110 group-hover:rotate-[6deg]'}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { 
            size: 20, 
            strokeWidth: isActive ? 3 : 2,
            className: isActive ? 'fill-current opacity-20' : ''
          })}
        </div>
        {expanded && (
          <span className={`relative z-10 ml-3 text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-500 animate-in fade-in slide-in-from-left-2`}>
            {label}
          </span>
        )}
        {!expanded && (
           <div className={`absolute left-full ml-4 px-3 py-1.5 rounded-xl opacity-0 scale-90 translate-x-[-10px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all pointer-events-none z-[70] shadow-2xl border border-white/20 whitespace-nowrap text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white`}>
             {label}
           </div>
        )}
      </>
    )}
  </NavLink>
);

const MobileNavLink = ({ to, icon, label, activeColor, activeBg }: { to: string; icon: React.ReactElement; label: string; activeColor: string; activeBg: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center gap-1 transition-all duration-500 flex-1 py-1.5 relative group ${
        isActive ? `${activeColor} font-black` : 'text-slate-400 font-medium'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div className={`absolute inset-0 mx-1 rounded-xl transition-all duration-500 ${isActive ? `${activeBg} scale-100 opacity-100` : 'scale-75 opacity-0'}`} />
        <div className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-active:scale-90'}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { 
            size: 20, 
            strokeWidth: isActive ? 2.5 : 2,
            className: isActive ? 'fill-current opacity-10' : ''
          })}
        </div>
        <span className={`relative z-10 text-[8px] uppercase tracking-widest transition-all duration-500 ${isActive ? 'opacity-100 font-black' : 'opacity-60'}`}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);

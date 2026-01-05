
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Star, BarChart3, Settings, Search, X, Download } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pl-64 lg:pl-72 bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 lg:w-72 bg-white border-r border-slate-200 p-8 z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
            <BookOpen size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">StudyGuru</h1>
        </div>

        <div className="mb-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
            />
          </form>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
          <MenuLink to="/" icon={<Home size={20} />} label="Dashboard" />
          <MenuLink to="/subjects" icon={<BookOpen size={20} />} label="Subjects" />
          <MenuLink to="/favorites" icon={<Star size={20} />} label="Favorites" />
          <MenuLink to="/downloads" icon={<Download size={20} />} label="Offline Access" />
          <MenuLink to="/stats" icon={<BarChart3 size={20} />} label="Analytics" />
        </nav>

        <div className="pt-8 border-t border-slate-100 space-y-4">
          <div className="bg-indigo-600/5 p-4 rounded-3xl border border-indigo-100/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">PRO ACCOUNT</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Unlock Cloud Sync & Reader Themes.</p>
          </div>
          <MenuLink to="/settings" icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 md:px-10 md:py-10">
        {children}
      </main>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between z-40">
        <h1 className="text-xl font-black text-slate-900">StudyGuru</h1>
        <button onClick={() => setSearchOpen(true)} className="p-2 text-slate-500 hover:text-indigo-600">
          <Search size={22} />
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-white z-[100] p-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSearchOpen(false)} className="p-2 -ml-2 text-slate-400">
              <X size={24} />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <input 
                autoFocus
                type="text" 
                placeholder="Search anything..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-xl font-bold border-none outline-none focus:ring-0"
              />
            </form>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Shortcuts</p>
          <div className="space-y-4">
            {['Physics Notes', 'Math Exam', 'Recent Videos'].map(item => (
              <button key={item} onClick={() => { setQuery(item); navigate(`/search?q=${item}`); setSearchOpen(false); }} className="block w-full text-left font-medium text-slate-600 hover:text-indigo-600">{item}</button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-3 px-2 z-50">
        <MobileNavLink to="/" icon={<Home size={24} />} label="Home" />
        <MobileNavLink to="/subjects" icon={<BookOpen size={24} />} label="Studies" />
        <MobileNavLink to="/downloads" icon={<Download size={24} />} label="Offline" />
        <MobileNavLink to="/favorites" icon={<Star size={24} />} label="Starred" />
        <MobileNavLink to="/stats" icon={<BarChart3 size={24} />} label="Stats" />
      </nav>
    </div>
  );
};

const MenuLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
        isActive 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <span className="transition-transform group-hover:scale-110">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

const MobileNavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center gap-1 transition-all flex-1 py-1 ${
        isActive ? 'text-indigo-600' : 'text-slate-400'
      }`
    }
  >
    {icon}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </NavLink>
);

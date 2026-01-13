
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store.ts';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Banknote, Plus, Search, Filter, 
  ChevronRight, Calendar, User, Receipt, 
  TrendingUp, TrendingDown, Wallet, Zap,
  Droplets, Bus, Wrench, IndianRupee, Trash2,
  CheckCircle2, Clock, X, LayoutGrid, Info,
  SearchCheck, UserSearch, FileSpreadsheet, Settings,
  Download, Printer, Scale, ShieldCheck
} from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType, RegisteredUser } from '../types.ts';

export const FeesManagement: React.FC = () => {
  const { state, adminAddTransaction, adminDeleteTransaction, adminSetClassFee, adminSetStudentCustomFee } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'SETTINGS'>('LEDGER');
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Student Lookup State
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<RegisteredUser | null>(null);

  // Receipt State
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Transaction Form State
  const [formData, setFormData] = useState({
    type: 'INCOME' as TransactionType,
    category: 'STUDENT_FEES' as TransactionCategory,
    subCategory: 'Monthly Fee',
    amount: '',
    description: '',
    payerName: '',
    payerId: '',
    payerClass: '',
    payerSection: '',
    status: 'PAID' as 'PAID' | 'PENDING',
    date: new Date().toISOString().split('T')[0]
  });

  const isAdmin = state.currentUser?.role === 'ADMIN';
  const students = useMemo(() => state.registeredUsers.filter(u => u.role === 'USER' || !u.role), [state.registeredUsers]);

  const searchedStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return [];
    const q = studentSearchTerm.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5);
  }, [studentSearchTerm, students]);

  // Calculate Student Financial Summary
  const studentBalance = useMemo(() => {
    if (!selectedStudent) return { total: 0, paid: 0, balance: 0 };
    
    // 1. Get Base Fee (Either Class base or Custom override)
    const baseFee = selectedStudent.customFee ?? (state.classFees[selectedStudent.studentClass || ''] || 0);
    
    // 2. Add GST (18%)
    const gst = baseFee * 0.18;
    const totalRequired = baseFee + gst;

    // 3. Get Paid History
    const paidAmount = state.ledger
      .filter(t => t.payerId === selectedStudent.id && t.category === 'STUDENT_FEES' && t.status === 'PAID')
      .reduce((acc, t) => acc + t.amount, 0);

    return { 
      total: Math.round(totalRequired), 
      paid: Math.round(paidAmount), 
      balance: Math.round(totalRequired - paidAmount),
      base: baseFee,
      gst: Math.round(gst)
    };
  }, [selectedStudent, state.ledger, state.classFees]);

  // Calculate Global Financial Stats
  const stats = useMemo(() => {
    const income = state.ledger.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
    const expense = state.ledger.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
    const pendingFees = state.ledger.filter(t => t.category === 'STUDENT_FEES' && t.status === 'PENDING').reduce((a, b) => a + b.amount, 0);
    
    return { income, expense, balance: income - expense, pendingFees };
  }, [state.ledger]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    let list = state.ledger;
    if (activeCategory !== 'ALL') {
      list = list.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => 
        t.description.toLowerCase().includes(q) || 
        t.payerName.toLowerCase().includes(q) ||
        t.payerClass?.toLowerCase().includes(q) ||
        t.payerId?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.ledger, activeCategory, search]);

  const handleAddTransaction = () => {
    if (!formData.amount || !formData.payerName || !formData.description) {
      alert("Please fill all required fields.");
      return;
    }

    const amt = parseFloat(formData.amount);
    const gst = formData.category === 'STUDENT_FEES' ? amt * 0.18 : 0;
    
    const transData: Omit<Transaction, 'id'> = {
      type: formData.type,
      category: formData.category,
      subCategory: formData.subCategory,
      amount: amt,
      gstAmount: Math.round(gst),
      totalWithGst: Math.round(amt + gst),
      description: formData.description,
      payerName: formData.payerName,
      payerId: formData.payerId,
      payerClass: formData.payerClass,
      payerSection: formData.payerSection,
      status: formData.status,
      date: new Date(formData.date).getTime()
    };

    adminAddTransaction(transData);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'INCOME',
      category: 'STUDENT_FEES',
      subCategory: 'Monthly Fee',
      amount: '',
      description: '',
      payerName: '',
      payerId: '',
      payerClass: '',
      payerSection: '',
      status: 'PAID',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedStudent(null);
    setStudentSearchTerm('');
  };

  const selectStudent = (student: RegisteredUser) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      payerName: student.name,
      payerId: student.id,
      payerClass: student.studentClass || '',
      payerSection: student.studentSection || '',
      description: `Fees - ${student.studentClass || ''}${student.studentSection ? `-${student.studentSection}` : ''}`
    }));
    setStudentSearchTerm('');
  };

  const getCategoryIcon = (cat: TransactionCategory) => {
    switch(cat) {
      case 'STUDENT_FEES': return <IndianRupee size={16} />;
      case 'STAFF_SALARY': return <User size={16} />;
      case 'UTILITY_ELECTRICITY': return <Zap size={16} />;
      case 'UTILITY_WATER': return <Droplets size={16} />;
      case 'TRANSPORT_BUS': return <Bus size={16} />;
      case 'MAINTENANCE': return <Wrench size={16} />;
      default: return <Receipt size={16} />;
    }
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=500,top=500,width=900,height=900');
    
    printWindow?.document.write(`
      <html>
        <head>
          <title>Study Guru - Fee Receipt</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };

  const categories: { id: TransactionCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'STUDENT_FEES', label: 'Student Fees', icon: <IndianRupee size={16} />, color: 'bg-emerald-500' },
    { id: 'STAFF_SALARY', label: 'Staff Salaries', icon: <User size={16} />, color: 'bg-indigo-500' },
    { id: 'UTILITY_ELECTRICITY', label: 'Electricity', icon: <Zap size={16} />, color: 'bg-yellow-500' },
    { id: 'UTILITY_WATER', label: 'Water Bills', icon: <Droplets size={16} />, color: 'bg-blue-500' },
    { id: 'TRANSPORT_BUS', label: 'Bus Service', icon: <Bus size={16} />, color: 'bg-orange-500' },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench size={16} />, color: 'bg-rose-500' },
    { id: 'OTHER', label: 'Misc Services', icon: <LayoutGrid size={16} />, color: 'bg-slate-500' }
  ];

  const subCategories = {
    STUDENT_FEES: ['Monthly Fee', 'Admission Fee', 'Exam Fee', 'Computer Fee', 'Library Fee', 'Development Fee', 'Transport Fee'],
    STAFF_SALARY: ['Monthly Salary', 'Bonus', 'Advance Payment', 'PF Contribution'],
    TRANSPORT_BUS: ['Fuel Cost', 'Maintenance', 'Driver Wages', 'Permit Renewal'],
    MAINTENANCE: ['Building Repair', 'Plumbing', 'Electrical Works', 'Furniture Fix', 'Gardening'],
    OTHER: ['Uniforms', 'Books & Stationery', 'Events', 'Canteen']
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Admin
          </button>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-[1.2rem]">
              <Banknote size={32} />
            </div>
            Financial Hub
          </h2>
          <p className="text-slate-500 font-medium ml-1">Fee Management & Institutional Ledger</p>
        </div>

        <div className="flex gap-2">
            {isAdmin && (
                <button 
                  onClick={() => setActiveTab(activeTab === 'LEDGER' ? 'SETTINGS' : 'LEDGER')}
                  className={`h-14 px-6 rounded-2xl border flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <Settings size={18} />
                  Fee Structure
                </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-14 px-8 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"
            >
              <Plus size={20} />
              Record Transaction
            </button>
        </div>
      </header>

      {activeTab === 'LEDGER' ? (
        <>
          {/* Stats Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
            <StatsCard label="Total Revenue" value={`₹${stats.income.toLocaleString()}`} sub="Current Month" icon={<TrendingUp size={24} />} color="emerald" />
            <StatsCard label="Total Outflow" value={`₹${stats.expense.toLocaleString()}`} sub="Salaries & Bills" icon={<TrendingDown size={24} />} color="rose" />
            <StatsCard label="Net Balance" value={`₹${stats.balance.toLocaleString()}`} sub="School Liquidity" icon={<Wallet size={24} />} color="indigo" />
            <StatsCard label="Pending Fees" value={`₹${stats.pendingFees.toLocaleString()}`} sub="Target Students" icon={<Clock size={24} />} color="amber" />
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            
            {/* Search Bar Feature */}
            <div className="mb-6">
                <div className="relative group w-full">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 text-slate-400">
                        <Search size={20} className="group-focus-within:text-indigo-500 transition-colors" />
                        <div className="h-4 w-[1px] bg-slate-200"></div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search Students, Faculty, Receipts or Services..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-inner placeholder:text-slate-400" 
                    />
                    {search && (
                        <button 
                            onClick={() => setSearch('')}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter - Wrapped Layout */}
            <div className="mb-8">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Filter by Category</p>
               <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setActiveCategory('ALL')} 
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                        All Transactions
                    </button>
                    {categories.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => setActiveCategory(c.id)} 
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === c.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}`}
                        >
                            <span className={activeCategory === c.id ? 'text-white' : 'text-slate-400'}>{c.icon}</span>
                            {c.label}
                        </button>
                    ))}
               </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="grid grid-cols-12 bg-slate-50 p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-1">Ref</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-3">Payer / Receiver</div>
                <div className="col-span-2">Class / Sec</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-2 text-right">Receipt</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto hide-scrollbar">
                 {filteredLedger.map((t, idx) => (
                   <div key={t.id} className={`grid grid-cols-12 p-4 border-b border-slate-50 items-center transition-all hover:bg-slate-50/80 group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                     <div className="col-span-1 font-mono text-[9px] text-slate-400">#{t.id}</div>
                     <div className="col-span-1 text-[10px] font-bold text-slate-500">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}</div>
                     <div className="col-span-3">
                        <p className="font-black text-slate-800 text-sm truncate">{t.payerName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.payerId || t.description}</p>
                     </div>
                     <div className="col-span-2">
                        {t.payerClass ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">{t.payerClass}-{t.payerSection || 'A'}</span> : '-'}
                     </div>
                     <div className="col-span-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg w-fit">
                           <span className="text-slate-400">{getCategoryIcon(t.category)}</span>
                           <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">{t.subCategory || 'General'}</span>
                        </div>
                     </div>
                     <div className="col-span-1 text-right">
                        <span className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>₹{t.amount.toLocaleString()}</span>
                     </div>
                     <div className="col-span-2 text-right flex justify-end gap-1">
                        {t.category === 'STUDENT_FEES' && (
                            <button onClick={() => setShowReceipt(t)} className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors" title="View Receipt"><Printer size={16} /></button>
                        )}
                        <button onClick={() => { if(confirm("Delete record?")) adminDeleteTransaction(t.id); }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 px-2">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Scale size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Class-wise Fee Structure</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Base Annual Fee Settings (Excl. GST)</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(Object.entries(state.classFees) as [string, number][]).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([cls, fee]) => (
                        <div key={cls} className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{cls} Class</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input 
                                    type="number" 
                                    value={fee} 
                                    onChange={(e) => adminSetClassFee(cls, parseInt(e.target.value) || 0)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-sm font-black text-slate-900 focus:border-indigo-500 outline-none" 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><ShieldCheck size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Student Fee Adjustments</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Apply Scholarships or Custom Rates</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {students.filter(s => !!s.customFee).length > 0 ? (
                        students.filter(s => !!s.customFee).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{s.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{s.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Class {s.studentClass} • {s.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modified Fee</p>
                                        <p className="text-sm font-black text-emerald-600">₹{s.customFee?.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => adminSetStudentCustomFee(s.id, undefined)} className="p-2 text-slate-300 hover:text-rose-500"><X size={18} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-slate-300 italic text-sm">No custom overrides applied yet. Adjust from the payment modal for individual students.</div>
                    )}
                </div>
            </section>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Record Transaction</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Institutional Ledger Input</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2 hide-scrollbar">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button onClick={() => setFormData({...formData, type: 'INCOME'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>Credit (Income)</button>
                    <button onClick={() => setFormData({...formData, type: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Debit (Expense)</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Category</label>
                       <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as TransactionCategory, subCategory: subCategories[e.target.value as keyof typeof subCategories]?.[0] || 'General'})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Date</label>
                       <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 [color-scheme:light]" />
                    </div>
                 </div>

                 {formData.category === 'STUDENT_FEES' && (
                    <div className="space-y-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><UserSearch size={14} /> Find Student</label>
                          {selectedStudent && <button onClick={() => setSelectedStudent(null)} className="text-[8px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-200">Clear</button>}
                       </div>
                       
                       {!selectedStudent ? (
                          <div className="relative">
                             <input type="text" placeholder="Type name or ID..." value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all shadow-sm" />
                             {searchedStudents.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-50 animate-in slide-in-from-top-2">
                                   {searchedStudents.map(s => (
                                      <button key={s.id} onClick={() => selectStudent(s)} className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left">
                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-indigo-600">{s.name.charAt(0)}</div>
                                         <div>
                                            <p className="text-xs font-black text-slate-800">{s.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{s.studentClass} • {s.id}</p>
                                         </div>
                                      </button>
                                   ))}
                                </div>
                             )}
                          </div>
                       ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-indigo-200">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">{selectedStudent.name.charAt(0)}</div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-900 text-sm leading-none">{selectedStudent.name}</h4>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Class {selectedStudent.studentClass} • {selectedStudent.id}</p>
                                </div>
                                <CheckCircle2 size={24} className="text-emerald-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Fees (incl. GST)</p>
                                    <p className="text-sm font-black text-slate-800">₹{studentBalance.total.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Already Paid</p>
                                    <p className="text-sm font-black text-emerald-600">₹{studentBalance.paid.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-indigo-600 rounded-xl text-white flex justify-between items-center shadow-lg">
                                <span className="text-[9px] font-black uppercase tracking-widest">Current Balance Due</span>
                                <span className="text-base font-black">₹{studentBalance.balance.toLocaleString()}</span>
                            </div>

                            {isAdmin && (
                                <div className="space-y-1 pt-2 border-t border-indigo-100">
                                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1">Modify Fees for this student</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="Override base fee..."
                                            value={(selectedStudent as RegisteredUser).customFee ?? ''}
                                            onChange={(e) => adminSetStudentCustomFee((selectedStudent as RegisteredUser).id, parseInt(e.target.value) || undefined)}
                                            className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-indigo-600" 
                                        />
                                        <button onClick={() => adminSetStudentCustomFee((selectedStudent as RegisteredUser).id, undefined)} className="px-3 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-50"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            )}
                          </div>
                       )}
                    </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Payer / Beneficiary Name</label>
                       <input type="text" placeholder="Full Legal Name" value={formData.payerName} onChange={e => setFormData({...formData, payerName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Amount to Pay (INR)</label>
                       <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Description / Remarks</label>
                    <input type="text" placeholder="Audit reference..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" />
                 </div>

                 <button onClick={handleAddTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-2 shrink-0">Commit to Ledger</button>
              </div>
           </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[400] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-4 relative animate-in zoom-in-95 duration-500 my-4"> 
                <button onClick={() => setShowReceipt(null)} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
                
                {/* Print View Content */}
                <div ref={receiptRef} className="receipt-print-wrapper text-slate-900 font-sans">
                    <div className="border-2 border-slate-900 p-3 md:p-5 space-y-3">
                        {/* Receipt Header */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-2">
                            <div className="text-center md:text-left space-y-0.5">
                                <h1 className="text-xl font-black tracking-tighter uppercase italic">STUDY GURU CORE</h1>
                                <p className="text-[9px] font-bold uppercase tracking-widest">Premium Institutional Learning Hub</p>
                                <p className="text-[8px] text-slate-500 font-medium">LMS Block, Knowledge Park, New Delhi - 110001</p>
                                <p className="text-[8px] text-slate-500 font-medium">Contact: +91 99999 88888 | admin@studyguru.com</p>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="bg-slate-900 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest mb-1">Fee Receipt</div>
                                <p className="text-[9px] font-bold">Serial No: <span className="font-mono">{showReceipt.id}</span></p>
                                <p className="text-[9px] font-bold">Date: {new Date(showReceipt.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                            </div>
                        </div>

                        {/* Student Details Grid */}
                        <div className="grid grid-cols-2 gap-y-1 text-[10px] py-1">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Student Name</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{showReceipt.payerName}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Student ID</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{showReceipt.payerId}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Class & Section</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{showReceipt.payerClass} - {showReceipt.payerSection || 'A'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Date of Birth</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{students.find(s => s.id === showReceipt.payerId)?.dob || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Mobile No.</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{students.find(s => s.id === showReceipt.payerId)?.mobile || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Payment Category</p>
                                <p className="font-bold border-b border-slate-100 pb-0.5">{showReceipt.subCategory || 'General Fee'}</p>
                            </div>
                        </div>

                        {/* Ledger Breakdown Table */}
                        <div className="border-t-2 border-slate-900 border-b-2 py-1">
                            <table className="w-full text-left text-[10px]">
                                <thead>
                                    <tr className="font-black uppercase border-b border-slate-200">
                                        <th className="py-1">Description</th>
                                        <th className="py-1 text-right">Tax (GST 18%)</th>
                                        <th className="py-1 text-right">Current Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="font-medium">
                                    <tr>
                                        <td className="py-1">{showReceipt.description}</td>
                                        <td className="py-1 text-right">₹{showReceipt.gstAmount?.toLocaleString() || '0'}</td>
                                        <td className="py-1 text-right font-bold">₹{showReceipt.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Final Calculation Summary */}
                        <div className="flex justify-end pt-2">
                            <div className="w-56 space-y-1">
                                <div className="flex justify-between text-[9px] font-bold">
                                    <span className="uppercase">Total Annual Fee</span>
                                    <span>₹{(students.find(s => s.id === showReceipt.payerId)?.customFee || state.classFees[showReceipt.payerClass || ''] || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold">
                                    <span className="uppercase">Total with GST</span>
                                    <span>₹{Math.round((students.find(s => s.id === showReceipt.payerId)?.customFee || state.classFees[showReceipt.payerClass || ''] || 0) * 1.18).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-1 bg-slate-50 px-2 py-0.5">
                                    <span className="uppercase">Paid Amount</span>
                                    <span className="text-emerald-700">₹{showReceipt.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black pt-0.5 px-2">
                                    <span className="uppercase text-slate-400">Rem. Balance</span>
                                    <span className="text-rose-600">₹{(Math.round((students.find(s => s.id === showReceipt.payerId)?.customFee || state.classFees[showReceipt.payerClass || ''] || 0) * 1.18) - 
                                        state.ledger.filter(tl => tl.payerId === showReceipt.payerId && tl.status === 'PAID' && tl.date <= showReceipt.date).reduce((a,b) => a+b.amount, 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Footer */}
                        <div className="pt-4 flex justify-between items-end">
                            <div className="space-y-2">
                                <div className="w-24 h-12 border-2 border-slate-100 rounded-lg flex items-center justify-center relative">
                                    <span className="text-[6px] font-black text-slate-200 uppercase tracking-tighter rotate-12">Institutional Seal</span>
                                </div>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Guardian Signature</p>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="w-32 border-b-2 border-slate-900 mx-auto"></div>
                                <p className="text-[8px] font-bold uppercase tracking-widest">Accounts Department</p>
                            </div>
                        </div>

                        <div className="text-center pt-2 border-t border-dashed border-slate-200">
                            <p className="text-[7px] font-medium text-slate-400 uppercase tracking-[0.3em]">This is a computer generated document. No physical signature required.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 md:mt-6 flex gap-3 shrink-0">
                    <button onClick={printReceipt} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Printer size={16} /> Print & Save PDF</button>
                    <button onClick={() => setShowReceipt(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Close Viewer</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) => {
  const themes: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    amber: 'text-amber-600 bg-amber-50'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-indigo-100 transition-colors">
       <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl ${themes[color] || 'bg-slate-50 text-slate-500'}`}>{icon}</div>
          <Info size={14} className="text-slate-200 group-hover:text-slate-400" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{sub}</p>
       </div>
    </div>
  );
};

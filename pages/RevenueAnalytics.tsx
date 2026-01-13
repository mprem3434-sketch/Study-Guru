
import React, { useMemo } from 'react';
import { useStore } from '../store.ts';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, PieChart as PieChartIcon, ArrowUpRight, DollarSign } from 'lucide-react';

export const RevenueAnalytics: React.FC = () => {
  const { state } = useStore();
  const navigate = useNavigate();

  // --- DATA PREPARATION ---

  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 1. Line Chart Data (Cumulative Revenue Trend for Current Year)
  const lineChartData = useMemo(() => {
    const data = new Array(12).fill(0);
    // Filter income transactions for current year
    const incomeTxns = state.ledger.filter(t => 
        t.type === 'INCOME' && new Date(t.date).getFullYear() === currentYear
    );
    
    // Aggregate by month
    incomeTxns.forEach(t => {
        const month = new Date(t.date).getMonth();
        data[month] += t.amount;
    });

    // Create cumulative or simple trend points
    // Let's do simple monthly trend for the line
    const maxVal = Math.max(...data, 1);
    const points = data.map((val, idx) => {
        const x = (idx / 11) * 100; // X percentage (0 to 100)
        const y = 100 - (val / maxVal) * 100; // Y percentage (inverted for SVG)
        return `${x},${y}`;
    }).join(' ');

    return { points, data, maxVal };
  }, [state.ledger, currentYear]);

  // 2. Bar Graph Data (Monthly Revenue)
  const barChartData = useMemo(() => {
      // Reuse the same aggregation logic for consistency
      return lineChartData.data.map((val, idx) => ({
          month: months[idx],
          value: val,
          heightPct: (val / lineChartData.maxVal) * 100
      }));
  }, [lineChartData, months]);

  // 3. Pie Chart Data (Expenditure by Category)
  const expenseData = useMemo(() => {
      const expenses = state.ledger.filter(t => t.type === 'EXPENSE');
      const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
      
      const categoryMap: Record<string, number> = {};
      expenses.forEach(t => {
          categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

      // Calculate slices
      let currentAngle = 0;
      const slices = Object.entries(categoryMap).map(([cat, amount], idx) => {
          const pct = (amount / totalExpense) * 100;
          const start = currentAngle;
          currentAngle += pct;
          return {
              category: cat.replace(/_/g, ' '),
              amount,
              pct,
              start, // for conic-gradient start %
              end: currentAngle, // for conic-gradient end %
              color: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6366f1'][idx % 6]
          };
      });

      return { totalExpense, slices };
  }, [state.ledger]);

  // Helper to get formatted currency
  const formatCurr = (val: number) => `₹${(val / 1000).toFixed(1)}k`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex items-center gap-4 px-2">
        <button 
          onClick={() => navigate('/admin/fees')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Analytics</h2>
          <p className="text-slate-500 text-sm font-medium">Financial Performance • {currentYear}</p>
        </div>
      </header>

      {/* 1. Annual Revenue Line Chart */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24} /></div>
               <div>
                  <h3 className="text-lg font-black text-slate-900">Annual Revenue Trend</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Progression</p>
               </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-black text-slate-900">₹{lineChartData.data.reduce((a,b)=>a+b, 0).toLocaleString()}</span>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                    <ArrowUpRight size={12} /> YTD Total
                </p>
            </div>
         </div>

         <div className="h-64 w-full relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-slate-300 font-bold pointer-events-none">
               {[100, 75, 50, 25, 0].map((pct) => (
                   <div key={pct} className="border-b border-slate-100 w-full h-0 relative">
                       <span className="absolute -top-2 left-0">{formatCurr((lineChartData.maxVal * pct) / 100)}</span>
                   </div>
               ))}
            </div>

            {/* SVG Chart */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pl-8 pb-4" preserveAspectRatio="none">
               <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                     <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
               </defs>
               {/* Area under curve */}
               <path 
                  d={`M0,100 ${lineChartData.points.split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`} 
                  fill="url(#lineGradient)" 
                  stroke="none"
               />
               {/* The Line */}
               <polyline 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="3" 
                  points={lineChartData.points}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-md"
               />
               {/* Data Points */}
               {lineChartData.points.split(' ').map((p, i) => {
                   const [x, y] = p.split(',');
                   return (
                       <circle 
                         key={i} 
                         cx={x + '%'} 
                         cy={y + '%'} 
                         r="4" 
                         className="fill-white stroke-indigo-600 stroke-[3px] hover:r-6 transition-all cursor-pointer"
                       >
                         <title>{months[i]}: ₹{lineChartData.data[i].toLocaleString()}</title>
                       </circle>
                   );
               })}
            </svg>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. Monthly Revenue Bar Graph */}
          <section className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Calendar size={24} /></div>
                <div>
                   <h3 className="text-lg font-black text-slate-900">Monthly Breakdown</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income Distribution</p>
                </div>
             </div>

             <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                {barChartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="relative w-full bg-slate-50 rounded-xl overflow-hidden flex items-end h-full transition-all group-hover:bg-slate-100">
                            {d.value > 0 && (
                                <div 
                                    className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-emerald-600 relative group/bar"
                                    style={{ height: `${Math.max(d.heightPct, 2)}%` }} // Min height 2% for visibility
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ₹{d.value.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{d.month}</span>
                    </div>
                ))}
             </div>
          </section>

          {/* 3. Expenditure Pie Chart */}
          <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><PieChartIcon size={24} /></div>
                <div>
                   <h3 className="text-lg font-black text-slate-900">Expenditure</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost Analysis</p>
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center relative">
                 {/* CSS Conic Gradient Pie Chart */}
                 <div 
                    className="w-48 h-48 rounded-full relative"
                    style={{
                        background: `conic-gradient(${
                            expenseData.slices.length > 0 
                            ? expenseData.slices.map(s => `${s.color} 0 ${s.end}%`).join(', ') 
                            : '#f1f5f9 0 100%' // Gray if no data
                        })`
                    }}
                 >
                    {/* Donut Hole */}
                    <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Exp</span>
                        <span className="text-xl font-black text-slate-900">₹{(expenseData.totalExpense / 1000).toFixed(1)}k</span>
                    </div>
                 </div>

                 {/* Legend */}
                 <div className="w-full mt-8 space-y-3">
                    {expenseData.slices.length > 0 ? (
                        expenseData.slices.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="font-bold text-slate-600 capitalize truncate max-w-[100px]">{s.category.toLowerCase()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-900">₹{s.amount.toLocaleString()}</span>
                                    <span className="text-[9px] font-black text-slate-400 w-8 text-right">{Math.round(s.pct)}%</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-xs text-slate-400 italic">No expenses recorded yet.</p>
                    )}
                 </div>
             </div>
          </section>
      </div>
    </div>
  );
};

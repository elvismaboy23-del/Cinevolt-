import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TrendingUp, Coins, Film, Award, HelpCircle, Sparkles, FolderOpen, ArrowUpRight } from 'lucide-react';
import { Movie, User } from '../types';

interface ProducerFinancialsProps {
  movies: Movie[];
  activeUser: User;
}

// Sandbox Industry Demo Data for empty state preview
const DEMO_FINANCIALS = [
  { title: "The Burial of Kojo", priceCedis: 50, purchaseCount: 120, revenue: 6000, color: "#00F0FF" },
  { title: "Keteke", priceCedis: 40, purchaseCount: 85, revenue: 3400, color: "#8B5CF6" },
  { title: "Aloe Vera", priceCedis: 45, purchaseCount: 72, revenue: 3240, color: "#EC4899" },
  { title: "Azali", priceCedis: 50, purchaseCount: 40, revenue: 2000, color: "#10B981" },
  { title: "Coz of Moni", priceCedis: 30, purchaseCount: 45, revenue: 1350, color: "#F59E0B" }
];

export default function ProducerFinancials({ movies, activeUser }: ProducerFinancialsProps) {
  // Filter movies created by the currently logged-in producer
  const producerMovies = useMemo(() => {
    return movies.filter(m => m.producerId === activeUser.id);
  }, [movies, activeUser.id]);

  // Compute live performance metrics
  const liveFinancials = useMemo(() => {
    return producerMovies.map(movie => {
      const revenue = movie.purchaseCount * movie.priceCedis;
      return {
        title: movie.title,
        priceCedis: movie.priceCedis,
        purchaseCount: movie.purchaseCount,
        revenue: revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [producerMovies]);

  // Check if producer has any real sales of listed movies
  const hasRealSales = useMemo(() => {
    return liveFinancials.length > 0 && liveFinancials.some(f => f.revenue > 0);
  }, [liveFinancials]);

  // Handle demo mode state: Auto-enable if no real sales exist, but allow toggle if producer has listed movies
  const [useDemoMode, setUseDemoMode] = useState(!hasRealSales);

  // Toggle fallback state safely if they want to peek
  const toggleDemoMode = () => {
    setUseDemoMode(prev => !prev);
  };

  // Select active dataset based on mode
  const activeDataset = useDemoMode ? DEMO_FINANCIALS : liveFinancials;

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return activeDataset.reduce((sum, item) => sum + item.revenue, 0);
  }, [activeDataset]);

  const totalTickets = useMemo(() => {
    return activeDataset.reduce((sum, item) => sum + item.purchaseCount, 0);
  }, [activeDataset]);

  const avgTicketPrice = useMemo(() => {
    if (activeDataset.length === 0) return 0;
    const totalPrices = activeDataset.reduce((sum, item) => sum + item.priceCedis, 0);
    return totalPrices / activeDataset.length;
  }, [activeDataset]);

  const topPerformingMovie = useMemo(() => {
    if (activeDataset.length === 0) return null;
    return activeDataset.reduce((max, item) => item.revenue > max.revenue ? item : max, activeDataset[0]);
  }, [activeDataset]);

  // Palette matching the sleek cyber-dark aesthetic of CineVault
  const COLORS = ["#00F0FF", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#06B6D4"];

  // Format dataset for Recharts Pie chart
  const chartData = useMemo(() => {
    return activeDataset
      .filter(item => item.revenue > 0)
      .map((item, index) => ({
        name: item.title,
        value: Number(item.revenue),
        tickets: item.purchaseCount,
        color: item.color || COLORS[index % COLORS.length]
      }));
  }, [activeDataset]);

  // Custom tooltips for nice styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-sleek-dark border border-sleek-border p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white uppercase tracking-wider">{payload[0].name}</p>
          <p className="font-mono text-brand flex items-center gap-1.5 font-bold">
            Revenue: GH₵ {payload[0].value.toFixed(2)}
          </p>
          <p className="text-zinc-400 font-sans">
            Tickets Sold: <span className="text-zinc-200 font-medium">{data.tickets} units</span>
          </p>
          <p className="text-[10px] text-zinc-500 italic">
            {((payload[0].value / totalRevenue) * 100).toFixed(1)}% revenue share
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-sleek-card border border-sleek-border rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Background visual elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Segment and Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sleek-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
              <Coins className="w-5 h-5" />
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-brand">BOX OFFICE DATA</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase font-display">
            Producer Financial Dashboard
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            Track box office results, individual catalog item performance, and digital stream revenue settled via Mobile Money secure channels.
          </p>
        </div>

        {/* Dynamic Simulator Toggle banner if needed */}
        {hasRealSales ? (
          <button
            onClick={toggleDemoMode}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
              useDemoMode
                ? 'bg-brand/10 border-brand/35 text-brand hover:bg-brand/20'
                : 'bg-sleek-dark border-sleek-border text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useDemoMode ? 'Showing Sandbox Data' : 'View Sandbox Preview'}</span>
          </button>
        ) : (
          <div className="bg-brand/5 border border-brand/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 max-w-xs shrink-0">
            <Sparkles className="w-4 h-4 text-brand shrink-0 animate-pulse" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-wider uppercase text-brand">SANDBOX PREVIEW LOADED</p>
              <p className="text-[9px] text-zinc-400">Showing demo box office data until your first movie purchase is completed.</p>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total settled revenue */}
        <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-2 relative group hover:border-brand/25 transition-colors">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">LIFETIME BOX OFFICE</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-bold font-mono text-brand">GH₵ {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <p className="text-[10px] text-zinc-450 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Settled directly to MoMo</span>
          </p>
        </div>

        {/* Tickets sold */}
        <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-2 hover:border-brand/25 transition-colors">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">TICKETS REDEEMED</p>
          <p className="text-xl font-bold font-mono text-white">{totalTickets} passes</p>
          <p className="text-[10px] text-zinc-450">Unique customer streams unlocked</p>
        </div>

        {/* Avg ticket price */}
        <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-2 hover:border-brand/25 transition-colors">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">AVERAGE LISTING TICKET</p>
          <p className="text-xl font-bold font-mono text-white">GH₵ {avgTicketPrice.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-450">Weighted across catalog size</p>
        </div>

        {/* Top title */}
        <div className="bg-sleek-dark p-4 rounded-xl border border-sleek-border space-y-2 hover:border-brand/25 transition-colors">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">BOX OFFICE GOLD-TIER</p>
          <p className="text-xs font-bold text-white truncate max-w-full block">
            {topPerformingMovie ? topPerformingMovie.title : 'None Listed'}
          </p>
          <p className="text-[10px] text-brand font-mono font-medium truncate">
            {topPerformingMovie && topPerformingMovie.revenue > 0 
              ? `GH₵ ${topPerformingMovie.revenue.toFixed(2)} total`
              : 'No commercial stream yet'
            }
          </p>
        </div>
      </div>

      {/* Split section: Pie Chart on Left/Right, Detailed tabular breakdown on the other */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
        
        {/* Visual Analytics Segment (Pie Chart) */}
        <div className="lg:col-span-5 bg-sleek-dark/65 p-6 rounded-xl border border-sleek-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand" />
              <span>Revenue Distribution Share</span>
            </h3>
            <p className="text-[10px] text-zinc-500">Relative contribution percentage per video mastercut.</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center p-4">
              <FolderOpen className="w-8 h-8 text-zinc-650 mb-2" />
              <p className="text-xs font-bold text-zinc-450">No Active Data Stream</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Publish your film cuts to view interactive data shares.</p>
            </div>
          ) : (
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#12141C" strokeWidth={1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center total overlay */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-[55%] text-center pointer-events-none">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">TOTAL GH₵</p>
                <p className="text-sm font-bold font-mono text-white mt-0.5">
                  {totalRevenue > 9999 ? `${(totalRevenue / 1000).toFixed(1)}k` : Math.round(totalRevenue)}
                </p>
              </div>

              {/* Integrated Compact Legend */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 pt-2">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[90px]">{item.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">({Math.round((item.value / totalRevenue) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabular Performance Ledger Card */}
        <div className="lg:col-span-7 bg-sleek-dark/65 p-6 rounded-xl border border-sleek-border flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
              Movie Performance Ledger
            </h3>
            <p className="text-[10px] text-zinc-500">Granular audit stream of published cinematic listings.</p>
          </div>

          {activeDataset.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-sleek-border rounded-xl">
              <Film className="w-8 h-8 text-zinc-650 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-zinc-400">Your Mastercut Registry holds no published listings</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-sm">
                Unlock catalog monetization by filling out and submitting the movie upload form above.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className="border-b border-sleek-border text-zinc-500 uppercase tracking-wider text-[9px] font-black">
                    <th className="py-2.5">Title</th>
                    <th className="py-2.5 text-right">Fixed Price</th>
                    <th className="py-2.5 text-right">Passes Sold</th>
                    <th className="py-2.5 text-right text-brand">Total Gross</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sleek-border/40">
                  {activeDataset.map((item, idx) => {
                    const share = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-sleek-card/30 transition-colors">
                        <td className="py-3 font-medium text-zinc-200">
                          <p className="truncate max-w-[180px] text-xs" title={item.title}>{item.title}</p>
                          {share > 0 && (
                            <div className="w-full bg-zinc-900 rounded-full h-1 mt-1 overflow-hidden">
                              <div 
                                className="bg-brand h-full" 
                                style={{ 
                                  width: `${share}%`, 
                                  backgroundColor: item.color || COLORS[idx % COLORS.length] 
                                }} 
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-400">GH₵ {item.priceCedis.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-zinc-300">{item.purchaseCount}</td>
                        <td className="py-3 text-right font-mono text-brand font-bold">GH₵ {item.revenue.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Secure channels settlement notice footnote */}
          <div className="flex items-center gap-2 bg-sleek-card/65 border border-sleek-border p-3 rounded-xl text-[10px] text-zinc-450">
            <Award className="w-4 h-4 text-brand shrink-0" />
            <p className="leading-relaxed">
              Ghanaian creators accumulate 100% of standard ticket gross immediately. Transactions process directly via safe escrow vaults to register transparent box office ratios.
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
}

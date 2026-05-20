import React, { useMemo } from 'react';
import { BarangayData } from '../types';
import { calculateWSM } from '../utils';
import { 
  CheckCircle2, 
  Cpu, 
  BarChart, 
  TrendingUp, 
  Layers,
  Info
} from 'lucide-react';

interface EvaluationProps {
  data: BarangayData[];
}

export default function Evaluation({ data }: EvaluationProps) {
  const assessed = data.filter(b => b.lastUpdated);
  const [benchmarkStatus, setBenchmarkStatus] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [perfMetrics, setPerfMetrics] = React.useState({ total: 0, perRecord: 0 });
  
  // Group data by disaster for the "Priority Schedule" section
  const groupedData = useMemo<Record<string, BarangayData[]>>(() => {
    const groups: Record<string, BarangayData[]> = {};
    assessed.forEach(item => {
      const d = item.disaster || 'General / Current';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    
    // Within each group, the data is already ranked by WSM (but we should ensure it's sorted)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.rank - b.rank);
    });
    
    return groups;
  }, [assessed]);

  const runBenchmark = () => {
    setBenchmarkStatus('running');
    setTimeout(() => {
      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const _ = calculateWSM(assessed);
      }
      const end = performance.now();
      const totalMs = (end - start) / iterations;
      setPerfMetrics({ total: totalMs, perRecord: assessed.length > 0 ? totalMs / assessed.length : 0 });
      setBenchmarkStatus('done');
    }, 800);
  };

  const jaccardResults = useMemo(() => {
    if (assessed.length < 3) return null;
    const disasters = Object.keys(groupedData);
    
    return disasters.map(disasterName => {
      const group = groupedData[disasterName];
      const kValues = [3, 5, 10].filter(k => k <= group.length);
      
      const getTopK = (arr: BarangayData[], key: keyof BarangayData, k: number) => {
        const sorted = [...arr].sort((a, b) => (b[key] as number) - (a[key] as number));
        return new Set(sorted.slice(0, k).map(b => b.id));
      };

      const wpsTopK = (arr: BarangayData[], k: number) => {
        return new Set(arr.slice(0, k).map(b => b.id));
      };

      const calculateJaccard = (setA: Set<string>, setB: Set<string>) => {
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return union.size === 0 ? 1 : intersection.size / union.size;
      };

      const kMetrics = kValues.map(k => {
        const wpsSet = wpsTopK(group, k);
        return {
          k,
          families: calculateJaccard(wpsSet, getTopK(group, 'affectedFamilies', k)),
          casualties: calculateJaccard(wpsSet, getTopK(group, 'casualties', k)),
          houses: calculateJaccard(wpsSet, getTopK(group, 'damagedHouses', k))
        };
      });

      return { disasterName, kMetrics, count: group.length };
    });
  }, [groupedData, assessed]) as { disasterName: string; kMetrics: { k: number; families: number; casualties: number; houses: number }[]; count: number }[] | null;

  if (assessed.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart className="text-blue-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Assessment Data Found</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Please upload a CSV file in the <strong>Assessment Input</strong> tab to begin the Algorithm Assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h3 className="text-2xl font-bold text-slate-900 uppercase">Weighted Priority Scheduler Assessment</h3>
            <p className="text-slate-500 font-medium">Evaluation report based on multi-criteria decision analysis (MCDA)</p>
         </div>
         <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Disasters</p>
               <p className="text-sm font-black text-slate-900">{Object.keys(groupedData).length}</p>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Records</p>
               <p className="text-sm font-black text-slate-900">{assessed.length}</p>
            </div>
         </div>
      </div>

      {/* Priority Schedule - Grouped Tables */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <Layers className="text-blue-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">PRIORITY SCHEDULE</h4>
        </div>
        
        {(Object.entries(groupedData) as [string, BarangayData[]][]).map(([name, group]) => (
          <div key={name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
               <h5 className="text-white font-bold text-sm tracking-wide">{name.toUpperCase()} ({group.length} BARANGAYS)</h5>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Algorithm Output</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-tighter">
                  <tr>
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Barangay</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-center">Fam</th>
                    <th className="px-6 py-3 text-center">Cas</th>
                    <th className="px-6 py-3 text-center">Dam</th>
                    <th className="px-6 py-3 text-center">Norm_F</th>
                    <th className="px-6 py-3 text-center">Norm_C</th>
                    <th className="px-6 py-3 text-center">Norm_D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-2.5 font-bold text-slate-900">{row.rank}</td>
                      <td className="px-6 py-2.5 font-sans font-bold text-slate-700">{row.name}</td>
                      <td className="px-6 py-2.5 text-center text-blue-600 font-bold">{(row.priorityScore * 100).toFixed(1)}</td>
                      <td className="px-6 py-2.5 text-center text-slate-500">{row.affectedFamilies}</td>
                      <td className="px-6 py-2.5 text-center text-slate-500">{row.casualties}</td>
                      <td className="px-6 py-2.5 text-center text-slate-500">{row.damagedHouses}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedFamilies.toFixed(3)}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedCasualties.toFixed(3)}</td>
                      <td className="px-6 py-2.5 text-center text-slate-400">{row.normalizedHouses.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Jaccard Analysis */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <CheckCircle2 className="text-emerald-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">EVALUATION (A): JACCARD INDEX (TOP-K AGREEMENT)</h4>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest">Disaster Event</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Top-K Depth</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Families</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Casualties</th>
                  <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-center">Houses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jaccardResults?.map((res, rid) => (
                  <React.Fragment key={rid}>
                    {res.kMetrics.map((kRow, kid) => (
                      <tr key={`${rid}-${kid}`} className="hover:bg-slate-50/30 transition-colors">
                        {kid === 0 && (
                          <td rowSpan={res.kMetrics.length} className="px-8 py-5 align-top border-r border-slate-50">
                            <p className="font-bold text-slate-900 mb-1">{res.disasterName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.count} records</p>
                          </td>
                        )}
                        <td className="px-8 py-5 font-mono font-bold text-slate-400 text-center">K={kRow.k}</td>
                        <td className="px-8 py-5 text-center font-bold text-blue-600">{kRow.families.toFixed(4)}</td>
                        <td className="px-8 py-5 text-center font-bold text-red-600">{kRow.casualties.toFixed(4)}</td>
                        <td className="px-8 py-5 text-center font-bold text-orange-600">{kRow.houses.toFixed(4)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Computational Efficiency */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <Cpu className="text-violet-600" size={20} />
           <h4 className="text-lg font-bold text-slate-900">EVALUATION (B): COMPUTATIONAL EFFICIENCY</h4>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-700">WPS Execution Lifecycle</p>
                 <p className="text-xs text-slate-400">Benchmarking across browser runtime environment</p>
              </div>
              <button 
                onClick={runBenchmark}
                disabled={benchmarkStatus === 'running'}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {benchmarkStatus === 'running' ? 'BENCHMARKING...' : 'START PERFORMANCE TEST'}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Execution</span>
                 <div>
                    <h5 className="text-2xl font-black text-slate-900 mb-1">
                       {perfMetrics.total > 0 ? `${perfMetrics.total.toFixed(4)} ms` : '--'}
                    </h5>
                    <p className="text-xs text-emerald-600 font-bold tracking-tight">System ready</p>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Time per Record</span>
                 <div>
                    <h5 className="text-2xl font-black text-slate-900 mb-1">
                       {perfMetrics.perRecord > 0 ? `${perfMetrics.perRecord.toFixed(6)} ms` : '--'}
                    </h5>
                    <p className="text-xs text-blue-600 font-bold tracking-tight">Optimal performance</p>
                 </div>
              </div>

              <div className="p-6 rounded-2xl bg-blue-600 text-white flex flex-col justify-between shadow-lg shadow-blue-200">
                 <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-4">Algorithm Complexity</span>
                 <div>
                    <h5 className="text-2xl font-black mb-1">O(n log n)</h5>
                    <p className="text-xs text-blue-100 font-medium">Sorting-bound complexity</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer Branding */}
      <div className="border-t border-slate-200 pt-12 pb-6 text-center">
         <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em]">WEIGHTED PRIORITY SCHEDULER - COMPLETE</p>
            <div className="h-px bg-slate-200 flex-1"></div>
         </div>
      </div>
    </div>
  );
}

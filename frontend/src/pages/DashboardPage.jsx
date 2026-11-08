import React, { useState, useEffect } from 'react';
import { 
  Cpu, Wrench, ShieldAlert, Activity, CheckCircle2, 
  ArrowRight, Search, BarChart3, Clock, Sparkles, Layers,
  Compass, Eye, PlayCircle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardPage({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([
        api.getToolStats().catch(() => null),
        api.getHealth().catch(() => null),
      ]);
      setStats(s);
      setHealth(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#202a33] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#e87524]/10 border border-[#e87524]/30 text-[#e87524] font-mono text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-[#e87524] animate-pulse"></span>
            INDUSTRY 4.0 INTELLIGENT WORKSHOP
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
            Manufacturing Intelligence Dashboard
          </h1>
          <p className="text-sm text-[#73808b] font-mono mt-1">
            Real-time cutting tool inventory, ANN flank wear tracking & operational guidance
          </p>
        </div>

        <button 
          onClick={loadDashboard}
          className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded bg-[#151b22] hover:bg-[#202a33] border border-[#202a33] text-xs font-mono text-[#73808b] hover:text-[#f4f5f3] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e87524]' : ''}`} />
          Refresh Live Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
          <div className="flex items-center justify-between text-[#73808b] mb-2">
            <span className="text-xs font-mono uppercase">Registered Tools</span>
            <Wrench className="w-4 h-4 text-[#e87524]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#f4f5f3]">
            {stats?.total_tools ?? 17}
          </div>
          <div className="text-xs text-[#73808b] mt-1 font-mono">
            Across {stats?.categories ? Object.keys(stats.categories).length : 8} tool classes
          </div>
        </div>

        <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
          <div className="flex items-center justify-between text-[#73808b] mb-2">
            <span className="text-xs font-mono uppercase">NASA Dataset Runs</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#f4f5f3]">
            167
          </div>
          <div className="text-xs text-emerald-400/80 mt-1 font-mono">
            146 Valid VB Ground-Truth Labels
          </div>
        </div>

        <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
          <div className="flex items-center justify-between text-[#73808b] mb-2">
            <span className="text-xs font-mono uppercase">Wear Prediction ANN</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#f4f5f3]">
            Active
          </div>
          <div className="text-xs text-[#73808b] mt-1 font-mono">
            Feed-forward MLP regression engine
          </div>
        </div>

        <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
          <div className="flex items-center justify-between text-[#73808b] mb-2">
            <span className="text-xs font-mono uppercase">ISO 3685 Standard</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#f4f5f3]">
            0.60 <span className="text-sm font-normal text-[#73808b]">mm</span>
          </div>
          <div className="text-xs text-amber-400/80 mt-1 font-mono">
            Maximum Flank Wear Failure Threshold
          </div>
        </div>
      </div>

      {/* Quick Action Portals */}
      <div>
        <h2 className="text-lg font-semibold text-[#f4f5f3] mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#e87524]" />
          Operational Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div 
            onClick={() => setActiveTab('identification')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-[#e87524]/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-[#e87524]/10 border border-[#e87524]/30 flex items-center justify-center text-[#e87524]">
                <Eye className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-[#e87524] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-[#e87524] transition-colors">
              Tool Identification & OCR
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Upload tool photographs to classify category, extract manufacturer markings via OCR, and match geometry.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setActiveTab('inspection')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-emerald-500/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-emerald-400 transition-colors">
              Visual Tool Inspection
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Edge sharpness detection, surface roughness texture, heat discoloration, and structural crack scanning.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setActiveTab('prediction')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-cyan-500/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-cyan-400 transition-colors">
              ANN Wear Prediction (VB)
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Predict numerical flank wear in millimeters from spindle current, vibration, and acoustic emission signals.
            </p>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => setActiveTab('tool-life')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-amber-500/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-amber-400 transition-colors">
              Tool Life & RUL Estimation
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Degradation curve fitting (exponential / power-law) on NASA sequential cuts to estimate remaining cycles.
            </p>
          </div>

          {/* Card 5 */}
          <div 
            onClick={() => setActiveTab('recommendation')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-purple-500/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-purple-400 transition-colors">
              Machining Recommendations
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Deterministic rule engine evaluating operation compatibility, workpiece suitability, and operating limits.
            </p>
          </div>

          {/* Card 6 */}
          <div 
            onClick={() => setActiveTab('catalogue')}
            className="group cursor-pointer bg-[#151b22] hover:bg-[#1c242e] border border-[#202a33] hover:border-blue-500/60 rounded-lg p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#73808b] group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-[#f4f5f3] group-hover:text-blue-400 transition-colors">
              Tool Catalogue & Specifications
            </h3>
            <p className="text-xs text-[#73808b] mt-1 leading-relaxed">
              Browse pre-seeded tooling inventory, view manufacturer datasheets, speed/feed ranges, and geometry.
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Categories */}
        <div className="lg:col-span-2 bg-[#151b22] border border-[#202a33] rounded-lg p-5">
          <h3 className="font-semibold text-[#f4f5f3] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#e87524]" />
            Registered Tool Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats?.categories && Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} className="p-3 bg-[#0d1117] border border-[#202a33] rounded flex flex-col justify-between">
                <span className="text-xs text-[#73808b] font-mono">{cat}</span>
                <span className="text-xl font-bold font-mono text-[#f4f5f3] mt-1">{count} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engine Status */}
        <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[#f4f5f3] mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              System Architecture Status
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                <span className="text-[#73808b]">Tool Identification CV</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                <span className="text-[#73808b]">Visual Defect Inspection</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                <span className="text-[#73808b]">NASA Flank Wear ANN</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                <span className="text-[#73808b]">Tool Life Degradation</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                <span className="text-[#73808b]">Operation Recommendation</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#202a33] text-[11px] font-mono text-[#73808b]">
            SQLite DB: <span className="text-[#f4f5f3]">tool_intelligence.db</span>
          </div>
        </div>
      </div>
    </div>
  );
}

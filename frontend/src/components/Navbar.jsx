import React from 'react';
import { 
  Cpu, Database, Sliders, GitBranch, PlayCircle, 
  BarChart3, Gauge, FileText, Activity, Eye, ShieldAlert,
  Clock, Sparkles, Layers, LayoutDashboard
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, modelTrained }) {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'identification', label: 'Tool CV & OCR', icon: Eye },
    { id: 'catalogue', label: 'Tool Catalogue', icon: Layers },
    { id: 'inspection', label: 'Visual Defect', icon: ShieldAlert },
    { id: 'prediction', label: 'ANN Wear (VB)', icon: Gauge },
    { id: 'tool-life', label: 'Tool Life (RUL)', icon: Clock },
    { id: 'recommendation', label: 'Recommendations', icon: Sparkles },
    { id: 'explorer', label: 'NASA Dataset', icon: Database },
    { id: 'training', label: 'ANN Training', icon: PlayCircle },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#151b22]/95 backdrop-blur border-b border-[#202a33] px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e87524] to-[#315a73] flex items-center justify-center shadow-lg shadow-[#e87524]/20 border border-[#e87524]/40">
            <Cpu className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-[#f4f5f3]">
                SMART<span className="text-[#e87524]">TOOL</span>.AI
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#202a33] text-[#73808b] border border-[#315a73]/40">
                v2.0 INDUSTRY 4.0
              </span>
            </div>
            <p className="text-[11px] text-[#73808b] font-mono tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              NASA Milling Wear · CV · OCR · RUL · Expert Systems
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#e87524] text-white shadow-md shadow-[#e87524]/25 font-semibold'
                    : 'text-[#73808b] hover:text-[#f4f5f3] hover:bg-[#202a33]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#73808b]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status Pill */}
        <div className="hidden xl:flex items-center gap-2 font-mono text-xs text-[#73808b] bg-[#0d1117] px-3 py-1 rounded-full border border-[#202a33] shrink-0">
          <span className="text-gray-400">Target:</span>
          <span className="text-[#e87524] font-semibold">VB (mm)</span>
          <span className="text-[#202a33]">|</span>
          <span className="text-gray-400">Model:</span>
          <span className={modelTrained ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {modelTrained ? 'ONLINE' : 'READY'}
          </span>
        </div>
      </div>
    </header>
  );
}

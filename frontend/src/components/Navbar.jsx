import React from 'react';
import { 
  Cpu, 
  Database, 
  Sliders, 
  GitBranch, 
  PlayCircle, 
  BarChart3, 
  Gauge, 
  FileText,
  Activity
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, modelTrained }) {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Activity },
    { id: 'explorer', label: 'Dataset Explorer', icon: Database },
    { id: 'preprocessing', label: 'Preprocessing', icon: Sliders },
    { id: 'methodology', label: 'Methodology', icon: GitBranch },
    { id: 'training', label: 'ANN Training', icon: PlayCircle },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'prediction', label: 'Wear Inference', icon: Gauge },
    { id: 'report', label: 'Project Report', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#151b22]/95 backdrop-blur border-b border-[#202a33] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo / Brand */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#e87524] to-[#315a73] flex items-center justify-center shadow-lg shadow-[#e87524]/20 border border-[#e87524]/40">
            <Cpu className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-[#f4f5f3]">
                MILLING<span className="text-[#e87524]">WEAR</span>.AI
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#202a33] text-[#73808b] border border-[#315a73]/40">
                ANN v1.0
              </span>
            </div>
            <p className="text-xs text-[#73808b] font-mono tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              NASA Milling Wear Benchmark · VB Regression
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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

        {/* Tool Status Pill */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-[#73808b] bg-[#0d1117] px-3 py-1 rounded-full border border-[#202a33]">
          <span className="text-gray-400">Target:</span>
          <span className="text-[#e87524] font-semibold">VB (mm)</span>
          <span className="text-[#202a33]">|</span>
          <span className="text-gray-400">Model:</span>
          <span className={modelTrained ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {modelTrained ? 'TRAINED' : 'READY'}
          </span>
        </div>
      </div>
    </header>
  );
}


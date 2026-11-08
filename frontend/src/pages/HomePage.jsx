import React from 'react';
import { 
  Activity, 
  Database, 
  Cpu, 
  Gauge, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Settings2,
  AlertTriangle,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function HomePage({ setActiveTab, auditData }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-[#202a33] bg-gradient-to-br from-[#151b22] via-[#0d1117] to-[#151b22] p-8 md:p-12 shadow-2xl">
        {/* Decorative Grid & Glow */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#e87524]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#315a73]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e87524]/15 border border-[#e87524]/30 text-[#e87524] text-xs font-mono mb-4">
            <Zap className="w-3.5 h-3.5" />
            INDUSTRY 4.0 INTELLIGENT MACHINING · ANN REGRESSION
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#f4f5f3] leading-tight">
            Generalized Tool Wear Prediction <br />
            <span className="bg-gradient-to-r from-[#e87524] to-[#f4f5f3] bg-clip-text text-transparent">
              for Advanced Manufacturing
            </span>
          </h1>

          <p className="mt-4 text-[#73808b] text-base md:text-lg leading-relaxed max-w-3xl">
            A comprehensive, scientifically rigorous machine learning system for estimating cutting tool flank land wear (<span className="text-[#f4f5f3] font-semibold">VB</span>) on high-speed CNC milling cutters. Trained on multi-sensor experimental trials from the <span className="text-[#e87524] font-medium">NASA Milling Dataset</span> using feed-forward Artificial Neural Networks.
          </p>

          {/* Quick Metrics Banner */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0d1117]/80 border border-[#202a33]">
            <div>
              <p className="text-xs font-mono text-[#73808b]">TOTAL CUTS</p>
              <p className="text-2xl font-bold text-[#f4f5f3]">{auditData?.total_runs || 167}</p>
              <p className="text-[11px] text-[#73808b]">16 Machining Cases</p>
            </div>
            <div>
              <p className="text-xs font-mono text-[#73808b]">VALID LABELS (VB)</p>
              <p className="text-2xl font-bold text-emerald-400">{auditData?.valid_wear_labels || 146}</p>
              <p className="text-[11px] text-[#73808b]">Optical Microscope</p>
            </div>
            <div>
              <p className="text-xs font-mono text-[#73808b]">SENSOR CHANNELS</p>
              <p className="text-2xl font-bold text-[#e87524]">6</p>
              <p className="text-[11px] text-[#73808b]">Current, Vib & AE</p>
            </div>
            <div>
              <p className="text-xs font-mono text-[#73808b]">PREDICTION GOAL</p>
              <p className="text-2xl font-bold text-blue-400">VB (mm)</p>
              <p className="text-[11px] text-[#73808b]">ISO 3685 Standard</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('explorer')}
              className="px-6 py-3 rounded-lg bg-[#e87524] text-white font-semibold text-sm hover:bg-[#d0641b] transition-all shadow-lg shadow-[#e87524]/25 flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Explore Dataset & Waveforms
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className="px-6 py-3 rounded-lg bg-[#202a33] text-[#f4f5f3] border border-[#315a73]/50 font-semibold text-sm hover:bg-[#202a33]/80 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#e87524]" />
              Train ANN Architecture
            </button>
            <button
              onClick={() => setActiveTab('prediction')}
              className="px-6 py-3 rounded-lg bg-[#151b22] text-[#73808b] hover:text-[#f4f5f3] border border-[#202a33] font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              Real-Time Inference
            </button>
          </div>
        </div>
      </div>

      {/* Industrial Machine & Sensor Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#315a73]/20 border border-[#315a73]/50 flex items-center justify-center text-blue-400">
            <Settings2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#f4f5f3]">Machining Testbed</h3>
          <p className="text-sm text-[#73808b] leading-relaxed">
            Matsuura MC-510V 3-axis CNC vertical milling center operating a 68 mm face milling cutter with KC710 titanium-carbide coated inserts across diverse workpiece materials (Cast Iron & J45 Steel).
          </p>
          <ul className="text-xs text-[#73808b] space-y-1.5 font-mono pt-2 border-t border-[#202a33]">
            <li>· Depth of Cut (DOC): 0.75 mm / 1.50 mm</li>
            <li>· Feed Rate: 0.25 mm/rev / 0.50 mm/rev</li>
            <li>· Constant Spindle Speed: 826 RPM</li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#e87524]/20 border border-[#e87524]/50 flex items-center justify-center text-[#e87524]">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#f4f5f3]">Multi-Sensor Fusion</h3>
          <p className="text-sm text-[#73808b] leading-relaxed">
            Synchronous capture of 6 high-speed physical signals at 250 Hz (9,000 observations per run) representing current load, structural acceleration, and microscopic acoustic stress waves.
          </p>
          <ul className="text-xs text-[#73808b] space-y-1.5 font-mono pt-2 border-t border-[#202a33]">
            <li>· Spindle Motor: AC & DC Currents</li>
            <li>· Accelerometers: Table & Spindle Vib</li>
            <li>· Acoustic Emission: High-frequency AE</li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#f4f5f3]">ISO 3685 Standard Wear</h3>
          <p className="text-sm text-[#73808b] leading-relaxed">
            Flank land wear (VB) physically measured under optical toolmaker's microscope. The regression model predicts exact numerical wear rather than a synthetic proxy or ungrounded RUL estimate.
          </p>
          <ul className="text-xs text-[#73808b] space-y-1.5 font-mono pt-2 border-t border-[#202a33]">
            <li>· Break-in Wear: VB &lt; 0.20 mm</li>
            <li>· Steady Wear: 0.20 &le; VB &lt; 0.40 mm</li>
            <li>· Tool Replacement: VB &ge; 0.40 mm</li>
          </ul>
        </div>
      </div>

      {/* System Pipeline Overview */}
      <div className="p-6 md:p-8 rounded-xl bg-[#151b22] border border-[#202a33] space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#f4f5f3]">End-to-End Operational Pipeline</h3>
          <p className="text-sm text-[#73808b]">
            How raw milling experiments transform into verified tool wear predictions without data leakage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-2 relative">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">STAGE 01</span>
            <h4 className="font-semibold text-sm text-[#f4f5f3]">1. Signal Processing</h4>
            <p className="text-xs text-[#73808b] leading-relaxed">
              Extract run-level statistical features (RMS, Peak, Kurtosis, Skewness, Energy) across 9,000 data points per channel.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-2 relative">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">STAGE 02</span>
            <h4 className="font-semibold text-sm text-[#f4f5f3]">2. Grouped Case Split</h4>
            <p className="text-xs text-[#73808b] leading-relaxed">
              Strictly hold out entire experimental cutting cases in test set (e.g. Cases 14-16) to test genuine generalization.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-2 relative">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">STAGE 03</span>
            <h4 className="font-semibold text-sm text-[#f4f5f3]">3. ANN Regression</h4>
            <p className="text-xs text-[#73808b] leading-relaxed">
              Multi-Layer feed-forward network with ReLU activations, Adam optimizer, early stopping, and MSE loss monitoring.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-2 relative">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">STAGE 04</span>
            <h4 className="font-semibold text-sm text-[#f4f5f3]">4. Wear Assessment</h4>
            <p className="text-xs text-[#73808b] leading-relaxed">
              Instantaneous VB prediction in mm mapped against ISO 3685 industrial thresholds for actionable tool replacement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


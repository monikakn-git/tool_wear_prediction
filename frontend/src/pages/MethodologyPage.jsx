import React, { useState } from 'react';
import { 
  GitBranch, 
  ArrowDown, 
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  Database, 
  Sliders, 
  Gauge, 
  BarChart3, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export default function MethodologyPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: 'NASA Milling Dataset Ingestion',
      category: 'DATA ACQUISITION',
      summary: 'Experimental face-milling records on Matsuura MC-510V CNC center with KC710 coated carbide inserts.',
      details: [
        'Distributed by NASA Ames Prognostics Center of Excellence.',
        '167 milling runs captured across 16 experimental cutting cases.',
        'Machining varied across 2 materials (Cast Iron, J45 Steel), 2 Depths of Cut (0.75 mm, 1.50 mm), and 2 Feed Rates (0.25 mm/rev, 0.50 mm/rev).',
        'Spindle speed held constant at 826 RPM.'
      ]
    },
    {
      id: 2,
      title: 'Dataset Inspection & Struct Parsing',
      category: 'AUDITING',
      summary: 'Parsing MATLAB 5.0 hierarchical binary arrays without synthetic substitution.',
      details: [
        'Direct parsing using SciPy loadmat of 1x167 struct array.',
        'Verified presence of 6 synchronous sensor channels sampled at 250 Hz (9,000 points per signal).',
        'Physical units: Spindle currents (Amperes), Vibrations (g acceleration), Acoustic Emission (Volts).',
        'Inspection of ground-truth tool flank wear target: VB (mm).'
      ]
    },
    {
      id: 3,
      title: 'Data Cleaning & Missing Label Isolation',
      category: 'QUALITY CONTROL',
      summary: 'Isolating 21 unmeasured cuts from supervised regression to ensure 100% ground-truth integrity.',
      details: [
        'Flank wear was optically measured at intermittent cutter inspection intervals.',
        '21 runs lacked optical measurement: strictly isolated and omitted from supervised ANN training.',
        '146 verified ground-truth runs retained for supervised regression modeling.',
        'No synthetic data invention, interpolation, or label duplication permitted.'
      ]
    },
    {
      id: 4,
      title: 'Run-Level Statistical Feature Extraction',
      category: 'FEATURE ENGINEERING',
      summary: 'Compressing 9,000-point time-series into 9 descriptive statistical domain indicators per sensor.',
      details: [
        'Mean: DC bias and steady baseline offset.',
        'Root Mean Square (RMS): Proportional to cutting mechanical power and vibration energy flux.',
        'Standard Deviation (Std) & Peak-to-Peak: Dynamic oscillatory range.',
        'Kurtosis & Crest Factor: High sensitivity to transient micro-chipping and chatter impulses.',
        'Skewness: Asymmetry in chip formation and cutting edge engagement dynamics.'
      ]
    },
    {
      id: 5,
      title: 'Feature Selection & Identifier Exclusion',
      category: 'REPRESENTATION',
      summary: 'Excluding Case and Run numbers from model inputs to enforce learning of physical sensor signatures.',
      details: [
        'Case and Run IDs are reserved exclusively for grouping and generalization evaluation.',
        'Model inputs comprise: 54 statistical sensor features + 3 operating parameters (DOC, feed, material).',
        'Prevents spurious memorization of experiment sequence or tool serial numbers.'
      ]
    },
    {
      id: 6,
      title: 'Grouped Case Train / Val / Test Partitioning',
      category: 'VALIDATION DESIGN',
      summary: 'Holding out entire experimental tool cases in test set to prove true unseen generalization.',
      details: [
        'Random row splitting across identical tool runs causes severe data leakage and artificially optimistic metrics.',
        'Grouped Partitioning strictly assigns entire independent cases (e.g. Cases 14, 15, 16) to the test set.',
        'Guarantees the ANN is evaluated on cutters it has never previously encountered.'
      ]
    },
    {
      id: 7,
      title: 'Leakage-Free Feature Normalization',
      category: 'SCALING',
      summary: 'Fitting StandardScaler exclusively on the training matrix and applying unchanged to test data.',
      details: [
        'Computes mean and variance parameters strictly from training observations: z = (x - mu_train) / sigma_train.',
        'Validation and test vectors are transformed using frozen training parameters.',
        'Guarantees zero future-information leakage into the model pipeline.'
      ]
    },
    {
      id: 8,
      title: 'ANN Architecture & Adaptive Training',
      category: 'NEURAL REGRESSION',
      summary: 'Multi-Layer Feed-Forward ANN optimized via Adam with validation-loss early stopping.',
      details: [
        'Input Layer: Matches feature dimensions (57 neurons).',
        'Hidden Layer 1: 32 neurons with Rectified Linear Unit (ReLU) activation and 0.05 dropout.',
        'Hidden Layer 2: 16 neurons with ReLU activation and 0.05 dropout.',
        'Output Layer: Single linear neuron predicting continuous flank wear VB (mm).',
        'Loss Criterion: Mean Squared Error (MSE), optimized with Adam and early stopping patience.'
      ]
    },
    {
      id: 9,
      title: 'Model Evaluation & Baseline Benchmarking',
      category: 'PERFORMANCE AUDIT',
      summary: 'Unbiased evaluation on held-out test cases against Mean Baseline and Linear Regression.',
      details: [
        'Calculates Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and R² score.',
        'Benchmarks against Mean-Value Baseline (predicts training mean wear).',
        'Benchmarks against Ordinary Least Squares Linear Regression on identical split.',
        'Generates actual vs predicted scatter, residual distribution, and per-case generalization analysis.'
      ]
    },
    {
      id: 10,
      title: 'Real-Time Flank Wear Inference',
      category: 'DEPLOYMENT',
      summary: 'Deploying trained ANN for instant wear prediction mapped against ISO 3685 industrial thresholds.',
      details: [
        'Transforms live sensor statistics using frozen scaler parameters.',
        'Predicts instantaneous flank wear VB in millimetres.',
        'Classifies wear state according to ISO 3685: Break-in (<0.20 mm), Steady (0.20-0.40 mm), and Critical Replacement (>=0.40 mm).'
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-4">
        <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-[#e87524]" />
          Methodology & Mathematical Formulation
        </h2>
        <p className="text-sm text-[#73808b]">
          A formal 10-stage engineering pipeline from raw acoustic/vibration signals to verified tool flank wear regression.
        </p>
      </div>

      {/* Main Flowchart & Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Navigation Flowchart */}
        <div className="lg:col-span-5 space-y-2">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div key={step.id}>
                <div
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#e87524]/15 border-[#e87524] text-[#f4f5f3] shadow-md shadow-[#e87524]/10'
                      : 'bg-[#151b22] border-[#202a33] text-[#73808b] hover:border-[#315a73]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      isActive ? 'bg-[#e87524] text-white' : 'bg-[#0d1117] text-[#73808b]'
                    }`}>
                      {step.id}
                    </span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#e87524]">
                        {step.category}
                      </p>
                      <p className="text-xs font-semibold text-[#f4f5f3] line-clamp-1">
                        {step.title}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90 text-[#e87524]' : 'text-[#73808b]'}`} />
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-0.5 h-2 bg-[#202a33] mx-auto my-0.5"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Deep Dive Card */}
        <div className="lg:col-span-7">
          <div className="sticky top-24 p-6 md:p-8 rounded-xl bg-[#151b22] border border-[#202a33] space-y-6">
            <div className="flex items-center justify-between border-b border-[#202a33] pb-4">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#e87524]/20 text-[#e87524] border border-[#e87524]/40">
                  STAGE {steps[activeStep].id} OF 10 · {steps[activeStep].category}
                </span>
                <h3 className="text-xl font-bold text-[#f4f5f3] mt-2">
                  {steps[activeStep].title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#73808b] leading-relaxed italic">
              "{steps[activeStep].summary}"
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase text-[#e87524] tracking-wider font-semibold">
                Technical Specifications & Scientific Rationale:
              </h4>
              <ul className="space-y-2.5">
                {steps[activeStep].details.map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2.5 text-xs text-[#f4f5f3] leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formula box for feature extraction & evaluation */}
            {activeStep === 3 && (
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] font-mono text-xs space-y-2 text-[#73808b]">
                <p className="text-[#e87524] font-bold">Signal Mathematics:</p>
                <p>· RMS = sqrt( (1/N) * sum( x_i^2 ) )</p>
                <p>· Kurtosis = ( (1/N) * sum( (x_i - mu)^4 ) ) / (sigma^4)</p>
                <p>· Crest Factor = max(|x_i|) / RMS</p>
              </div>
            )}

            {activeStep === 7 && (
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] font-mono text-xs space-y-2 text-[#73808b]">
                <p className="text-[#e87524] font-bold">Neural Regression Formulation:</p>
                <p>· h_1 = ReLU( W_1 * X + b_1 )</p>
                <p>· h_2 = ReLU( W_2 * h_1 + b_2 )</p>
                <p>· VB_pred = W_3 * h_2 + b_3</p>
                <p>· Loss = (1/M) * sum( (VB_actual - VB_pred)^2 )</p>
              </div>
            )}

            {activeStep === 8 && (
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] font-mono text-xs space-y-2 text-[#73808b]">
                <p className="text-[#e87524] font-bold">Regression Evaluation Metrics:</p>
                <p>· MAE = (1/N) * sum( |VB_i - VB_pred_i| )</p>
                <p>· RMSE = sqrt( (1/N) * sum( (VB_i - VB_pred_i)^2 ) )</p>
                <p>· R^2 = 1 - ( SS_res / SS_tot )</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


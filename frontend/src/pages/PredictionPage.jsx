import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  ShieldAlert,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function PredictionPage() {
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  
  // Input features state
  const [inputs, setInputs] = useState({
    DOC: 1.5,
    feed: 0.5,
    material: 1,
    smcAC_rms: 1.52,
    smcDC_rms: 1.25,
    vib_table_rms: 0.12,
    vib_spindle_rms: 0.38,
    AE_table_rms: 0.14,
    AE_spindle_rms: 0.18,
  });

  const [activePresetMeta, setActivePresetMeta] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const res = await api.getPresetSamples();
      setPresets(res.presets || []);
      if (res.presets && res.presets.length > 0) {
        applyPreset(res.presets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.preset_id);
    setActivePresetMeta(preset);
    setInputs(prev => ({
      ...prev,
      ...preset.full_features,
      DOC: preset.DOC,
      feed: preset.feed,
      material: preset.material,
      smcAC_rms: preset.smcAC_rms,
      smcDC_rms: preset.smcDC_rms,
      vib_table_rms: preset.vib_table_rms,
      vib_spindle_rms: preset.vib_spindle_rms,
      AE_table_rms: preset.AE_table_rms,
      AE_spindle_rms: preset.AE_spindle_rms,
    }));
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    setActivePresetMeta(null); // customized
  };

  const handlePredict = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.predictToolWear(inputs);
      setPrediction(res);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-4">
        <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
          <Gauge className="w-6 h-6 text-[#e87524]" />
          Instantaneous Flank Wear Inference Laboratory
        </h2>
        <p className="text-sm text-[#73808b]">
          Supply sensor dynamics and cutting conditions to predict tool flank wear (VB in mm) using the saved ANN model.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Preset Cuts Selector */}
      <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[#f4f5f3] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#e87524]" />
            1-Click NASA Ground-Truth Benchmark Presets:
          </span>
          <span className="text-[11px] text-[#73808b]">Click any preset to auto-populate sensors</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.preset_id}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                selectedPresetId === p.preset_id
                  ? 'bg-[#e87524] text-white border-[#e87524] font-bold shadow-md shadow-[#e87524]/20'
                  : 'bg-[#0d1117] text-[#73808b] border-[#202a33] hover:text-[#f4f5f3]'
              }`}
            >
              {p.preset_id} ({p.material_name}, VB={p.actual_vb_mm}mm)
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs vs Prediction Outcome */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-5">
          <h3 className="text-base font-bold text-[#f4f5f3] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#e87524]" />
            Machining Operating Parameters & Sensor Descriptors
          </h3>

          {/* Cutting Conditions */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#0d1117] border border-[#202a33]">
            <div>
              <label className="text-[11px] font-mono text-[#73808b] block mb-1">Depth of Cut (DOC)</label>
              <select
                value={inputs.DOC}
                onChange={(e) => handleInputChange('DOC', e.target.value)}
                className="w-full bg-[#151b22] border border-[#202a33] rounded px-2.5 py-1.5 text-xs text-[#f4f5f3] font-mono focus:border-[#e87524] focus:outline-none"
              >
                <option value="0.75">0.75 mm</option>
                <option value="1.5">1.50 mm</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#73808b] block mb-1">Feed Rate (feed)</label>
              <select
                value={inputs.feed}
                onChange={(e) => handleInputChange('feed', e.target.value)}
                className="w-full bg-[#151b22] border border-[#202a33] rounded px-2.5 py-1.5 text-xs text-[#f4f5f3] font-mono focus:border-[#e87524] focus:outline-none"
              >
                <option value="0.25">0.25 mm/rev</option>
                <option value="0.5">0.50 mm/rev</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#73808b] block mb-1">Material</label>
              <select
                value={inputs.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className="w-full bg-[#151b22] border border-[#202a33] rounded px-2.5 py-1.5 text-xs text-[#f4f5f3] font-mono focus:border-[#e87524] focus:outline-none"
              >
                <option value="1">Cast Iron (1)</option>
                <option value="2">J45 Steel (2)</option>
              </select>
            </div>
          </div>

          {/* Sensor Signals */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#f4f5f3] block">
              Multi-Channel Sensor Dynamic Metrics (RMS & Energy)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">smcAC (AC Spindle Current RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.smcAC_rms}
                  onChange={(e) => handleInputChange('smcAC_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Amperes (A)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">smcDC (DC Spindle Current RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.smcDC_rms}
                  onChange={(e) => handleInputChange('smcDC_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Amperes (A)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">vib_table (Table Vibration RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.vib_table_rms}
                  onChange={(e) => handleInputChange('vib_table_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Acceleration (g)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">vib_spindle (Spindle Vib RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.vib_spindle_rms}
                  onChange={(e) => handleInputChange('vib_spindle_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Acceleration (g)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">AE_table (Acoustic Emission RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.AE_table_rms}
                  onChange={(e) => handleInputChange('AE_table_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Volts (V)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                <label className="text-[11px] font-mono text-[#73808b] block mb-1">AE_spindle (Acoustic Emission RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.AE_spindle_rms}
                  onChange={(e) => handleInputChange('AE_spindle_rms', e.target.value)}
                  className="w-full bg-transparent border-b border-[#202a33] text-sm font-mono text-[#f4f5f3] focus:border-[#e87524] focus:outline-none"
                />
                <span className="text-[10px] text-[#73808b]">Volts (V)</span>
              </div>
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-[#e87524] hover:bg-[#d0641b] text-white font-bold text-sm transition-all shadow-lg shadow-[#e87524]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Computing Forward ANN Pass...
              </>
            ) : (
              <>
                <Gauge className="w-5 h-5" />
                Predict Flank Wear (VB)
              </>
            )}
          </button>
        </div>

        {/* Prediction Output & Industrial Wear Gauge */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-5">
              <div className="flex justify-between items-center border-b border-[#202a33] pb-3">
                <span className="text-xs font-mono font-bold text-[#73808b] uppercase">ANN INFERENCE RESULT</span>
                <span 
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${prediction.color_code}20`, color: prediction.color_code }}
                >
                  {prediction.wear_state}
                </span>
              </div>

              {/* Giant Numerical VB Display */}
              <div className="text-center p-6 rounded-xl bg-[#0d1117] border border-[#202a33] relative overflow-hidden">
                <p className="text-xs font-mono text-[#73808b] uppercase">PREDICTED FLANK WEAR (VB)</p>
                <p 
                  className="text-5xl font-black mt-2 font-mono tracking-tight"
                  style={{ color: prediction.color_code }}
                >
                  {prediction.predicted_vb_mm} <span className="text-xl font-normal text-[#73808b]">mm</span>
                </p>

                {/* Ground Truth comparison if preset loaded */}
                {activePresetMeta && (
                  <div className="mt-4 pt-3 border-t border-[#202a33] flex justify-around text-xs font-mono">
                    <div>
                      <span className="text-[#73808b] block">Optical Actual:</span>
                      <span className="text-[#f4f5f3] font-bold">{activePresetMeta.actual_vb_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-[#73808b] block">Absolute Error:</span>
                      <span className="text-blue-400 font-bold">
                        {Math.abs(prediction.predicted_vb_mm - activePresetMeta.actual_vb_mm).toFixed(4)} mm
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Industrial ISO 3685 Gauge Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#73808b]">
                  <span>0.00 mm (Fresh)</span>
                  <span>0.20 mm</span>
                  <span>0.40 mm (Limit)</span>
                  <span>1.00+ mm</span>
                </div>
                <div className="h-3 rounded-full bg-[#0d1117] p-0.5 border border-[#202a33] flex overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-l" style={{ width: '20%' }} title="Initial Wear"></div>
                  <div className="h-full bg-amber-500" style={{ width: '20%' }} title="Steady Wear"></div>
                  <div className="h-full bg-red-500 rounded-r" style={{ width: '60%' }} title="Severe Wear"></div>
                </div>
                <p className="text-[11px] font-mono text-[#73808b] text-center">
                  Criterion: ISO 3685 Standard Milling Tool Life
                </p>
              </div>

              {/* Maintenance Recommendation */}
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-2">
                <div className="flex items-center gap-2">
                  {prediction.severity_level === 'critical' ? (
                    <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                  <p className="text-xs font-bold text-[#f4f5f3]">Operational Recommendation</p>
                </div>
                <p className="text-xs text-[#73808b] leading-relaxed">
                  {prediction.action_recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-[#151b22] border border-[#202a33] text-center space-y-3">
              <Gauge className="w-10 h-10 text-[#e87524] mx-auto opacity-70" />
              <h4 className="text-base font-bold text-[#f4f5f3]">Inference Awaiting Input</h4>
              <p className="text-xs text-[#73808b] max-w-xs mx-auto">
                Select an authentic NASA cut preset or customize cutting parameters, then click <strong className="text-[#f4f5f3]">"Predict Flank Wear (VB)"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


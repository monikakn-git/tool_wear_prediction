import React, { useState } from 'react';
import { 
  ShieldAlert, Upload, AlertTriangle, CheckCircle2, 
  Activity, RefreshCw, HelpCircle, Layers, ArrowRight,
  Flame, Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function VisualInspectionPage({ setActiveTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setInspection(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.inspectImage(selectedFile);
      setInspection(data);
    } catch (err) {
      setError(err.message || 'Inspection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          MODULE 2 · COMPUTER VISION DEFECT INSPECTION
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
          Visual Tool Condition & Surface Defect Inspection
        </h1>
        <p className="text-sm text-[#73808b] font-mono mt-1">
          Detect cutting-edge chipping, thermal discoloration, surface corrosion, and macroscopic fractures
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
            <h2 className="font-semibold text-sm text-[#f4f5f3] mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Tool Macro Photograph
            </h2>

            <label className="border-2 border-dashed border-[#202a33] hover:border-emerald-500/60 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0d1117] min-h-[220px]">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              {previewUrl ? (
                <div className="relative w-full h-48 flex items-center justify-center overflow-hidden rounded">
                  <img 
                    src={previewUrl} 
                    alt="Inspection preview" 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#202a33] flex items-center justify-center mx-auto text-[#73808b]">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-[#f4f5f3] font-mono font-medium">
                    Upload Tool Cutting Edge Photo
                  </div>
                  <div className="text-[11px] text-[#73808b] font-mono">
                    High-contrast macro image recommended
                  </div>
                </div>
              )}
            </label>

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-mono font-semibold transition-all ${
                selectedFile && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer'
                  : 'bg-[#202a33] text-[#73808b] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Laplacian & Morphology Kernels...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Analyze Physical Defects
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Academic Integrity Notice */}
          <div className="p-4 bg-[#151b22] border border-[#202a33] rounded-lg text-xs font-mono text-[#73808b] space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              ISO 3685 Measurement Limitation
            </div>
            <p className="leading-relaxed">
              {inspection?.disclaimer || (
                "Visual condition assessment provides qualitative surface indicators. Accurate numerical flank wear (VB in mm) cannot be measured from standard photographs and requires calibrated microscope metrology."
              )}
            </p>
          </div>
        </div>

        {/* Right Column: Findings & Defect Detection */}
        <div className="lg:col-span-7 space-y-6">
          {inspection ? (
            <div className="space-y-6">
              {/* Overall Condition Banner */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#202a33]">
                  <h3 className="font-semibold text-[#f4f5f3] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Overall Physical Condition Assessment
                  </h3>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    inspection.overall_condition === 'Good' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    inspection.overall_condition === 'Fair' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {inspection.overall_condition.toUpperCase()} CONDITION ({inspection.condition_score}/100)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                  <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Edge Sharpness</span>
                    <span className="text-[#f4f5f3] font-bold text-sm">
                      {inspection.edge_analysis?.sharpness_score ?? 50}/100
                    </span>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Surface Texture</span>
                    <span className="text-[#f4f5f3] font-bold text-sm capitalize">
                      {inspection.surface_analysis?.roughness_indicator ?? 'Normal'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Thermal Burn</span>
                    <span className={`font-bold text-sm ${inspection.surface_analysis?.heat_damage_detected ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {inspection.surface_analysis?.heat_damage_detected ? 'Detected' : 'None'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Crack Lines</span>
                    <span className={`font-bold text-sm ${inspection.crack_detection?.cracks_detected > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {inspection.crack_detection?.cracks_detected ?? 0} Found
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Defect Issues */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                <h3 className="font-semibold text-sm text-[#f4f5f3] mb-3 font-mono flex items-center justify-between">
                  <span>Detected Physical Anomalies ({inspection.detected_issues?.length ?? 0})</span>
                  <span className="text-xs text-[#73808b] font-normal">Ranked by severity</span>
                </h3>

                {inspection.detected_issues?.length > 0 ? (
                  <div className="space-y-2">
                    {inspection.detected_issues.map((iss, idx) => (
                      <div key={idx} className="p-3 bg-[#0d1117] border border-[#202a33] rounded text-xs font-mono flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#f4f5f3] font-semibold">{iss.type}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                              iss.severity === 'critical' ? 'text-red-400 bg-red-500/10' :
                              iss.severity === 'high' ? 'text-amber-400 bg-amber-500/10' :
                              'text-yellow-400 bg-yellow-500/10'
                            }`}>
                              {iss.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[#73808b] text-[11px]">{iss.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0d1117] border border-emerald-500/20 rounded text-center text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    No macroscopic surface defects detected across cutting edge
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5 space-y-3 font-mono text-xs">
                <h3 className="font-semibold text-[#f4f5f3]">Operator Action Directives</h3>
                <ul className="space-y-1.5 list-disc list-inside text-[#73808b]">
                  {inspection.recommendations?.map((r, idx) => (
                    <li key={idx} className="text-[#f4f5f3]">{r}</li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-[#202a33] flex gap-3">
                  <button
                    onClick={() => setActiveTab('prediction')}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-[#0d1117] hover:bg-[#202a33] border border-cyan-500/40 text-cyan-400 font-mono text-xs font-semibold cursor-pointer"
                  >
                    Run ANN Sensor Flank Wear (VB)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#202a33] flex items-center justify-center text-[#73808b]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#f4f5f3]">No Surface Analysis Executed</h3>
              <p className="text-xs text-[#73808b] font-mono max-w-sm">
                Upload a tool macro photograph on the left panel to execute edge irregularity and discoloration scanning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

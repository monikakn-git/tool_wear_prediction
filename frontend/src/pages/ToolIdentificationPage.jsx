import React, { useState } from 'react';
import { 
  Upload, Eye, CheckCircle2, AlertTriangle, Cpu, FileText, 
  Sparkles, RefreshCw, Layers, ArrowRight, Tag, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ToolIdentificationPage({ setActiveTab, setSelectedTool }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualCategory, setManualCategory] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.identifyTool(selectedFile);
      setResult(data);
      if (data.classification?.category) {
        setManualCategory(data.classification.category);
      }
    } catch (err) {
      setError(err.message || 'Identification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#e87524]/10 border border-[#e87524]/30 text-[#e87524] font-mono text-xs mb-2">
          <span className="w-2 h-2 rounded-full bg-[#e87524] animate-pulse"></span>
          MODULE 1 · COMPUTER VISION & OCR
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
          AI-Based Tool Identification & Markings Reader
        </h1>
        <p className="text-sm text-[#73808b] font-mono mt-1">
          Upload cutting tool photographs to classify geometry, read laser markings, and query catalogue specifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
            <h2 className="font-semibold text-sm text-[#f4f5f3] mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#e87524]" />
              Tool Image Acquisition
            </h2>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-[#202a33] hover:border-[#e87524]/60 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0d1117] min-h-[220px]">
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
                    alt="Cutting tool preview" 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#202a33] flex items-center justify-center mx-auto text-[#73808b]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-[#f4f5f3] font-mono font-medium">
                    Click or Drag Cutting Tool Photograph
                  </div>
                  <div className="text-[11px] text-[#73808b] font-mono">
                    Supports JPG, PNG, WEBP (Max 20MB)
                  </div>
                </div>
              )}
            </label>

            <button
              onClick={handleIdentify}
              disabled={!selectedFile || loading}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-mono font-semibold transition-all ${
                selectedFile && !loading
                  ? 'bg-[#e87524] hover:bg-[#d6671a] text-white shadow-lg shadow-[#e87524]/20 cursor-pointer'
                  : 'bg-[#202a33] text-[#73808b] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Geometry & Reading Markings...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Run AI Identification & OCR
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Academic Transparency Note */}
          <div className="p-4 bg-[#151b22] border border-[#202a33] rounded-lg text-xs font-mono text-[#73808b] space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              Engineering Integrity Notice
            </div>
            <p className="leading-relaxed">
              Standard photographs do not contain scale calibration or metallurgical data. The AI engine classifies generic tool geometry and reads visible markings. Always confirm identified dimensions before high-speed CNC execution.
            </p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Classification Card */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#202a33]">
                  <h3 className="font-semibold text-[#f4f5f3] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#e87524]" />
                    Geometry & Category Prediction
                  </h3>
                  <span className={`px-2 py-0.5 rounded font-mono text-xs ${
                    result.classification?.confidence === 'high' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {result.classification?.confidence?.toUpperCase() ?? 'MODERATE'} CONFIDENCE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-xs font-mono text-[#73808b]">Identified Category</span>
                    <div className="text-xl font-bold text-[#f4f5f3] font-mono mt-0.5">
                      {result.classification?.category || 'Unknown Tool'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-[#73808b]">Inference Engine</span>
                    <div className="text-sm font-mono text-[#73808b] mt-1">
                      {result.classification?.model_available 
                        ? 'Gradient Boosting Vision Classifier' 
                        : 'Morphological & Feature Heuristic Engine'}
                    </div>
                  </div>
                </div>

                {/* Top 3 Predictions if available */}
                {result.classification?.top_3_predictions && (
                  <div className="mt-4 pt-4 border-t border-[#202a33]">
                    <span className="text-xs font-mono text-[#73808b] block mb-2">Class Probability Distribution:</span>
                    <div className="space-y-1.5">
                      {result.classification.top_3_predictions.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#f4f5f3]">{p.category}</span>
                          <span className="text-[#e87524]">{(p.probability * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Reader Card */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                <h3 className="font-semibold text-[#f4f5f3] mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Optical Character Recognition (OCR Markings)
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-[#0d1117] border border-[#202a33] rounded">
                    <span className="text-[#73808b] block mb-1">Manufacturer Markings Detected:</span>
                    <span className="text-[#f4f5f3] font-semibold text-sm">
                      {result.ocr_results?.manufacturer?.best_match || 'No explicit manufacturer logo detected'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0d1117] border border-[#202a33] rounded">
                    <span className="text-[#73808b] block mb-1">Product / Insert Designation Code:</span>
                    <span className="text-cyan-400 font-semibold">
                      {result.ocr_results?.product_codes?.best_match || 'No alphanumeric product code detected'}
                    </span>
                  </div>

                  {result.ocr_results?.raw_text && (
                    <div className="p-3 bg-[#0d1117] border border-[#202a33] rounded">
                      <span className="text-[#73808b] block mb-1">Raw Extracted Text:</span>
                      <p className="text-[#73808b] text-[11px] whitespace-pre-wrap">
                        {result.ocr_results.raw_text.trim() || 'None'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons to Continue Workflow */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('inspection')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#151b22] hover:bg-[#202a33] border border-emerald-500/40 text-emerald-400 font-mono text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Proceed to Visual Defect Inspection
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('recommendation')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#151b22] hover:bg-[#202a33] border border-purple-500/40 text-purple-400 font-mono text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Check Operation Suitability
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#202a33] flex items-center justify-center text-[#73808b]">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#f4f5f3]">No Analysis Executed Yet</h3>
              <p className="text-xs text-[#73808b] font-mono max-w-sm">
                Acquire or upload a cutting tool image on the left panel to begin category classification and OCR markings extraction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

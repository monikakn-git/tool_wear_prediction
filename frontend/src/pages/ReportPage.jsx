import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Layers, 
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.generateReport();
      setReport(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(api.getReportDownloadUrl(), '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#202a33] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#e87524]" />
            Official Project Technical Report
          </h2>
          <p className="text-sm text-[#73808b]">
            Comprehensive academic project report suitable for engineering faculty demonstration.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-[#151b22] hover:bg-[#202a33] border border-[#202a33] text-xs font-semibold text-[#f4f5f3] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e87524]' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            disabled={!report}
            className="px-4 py-2 rounded-lg bg-[#e87524] hover:bg-[#d0641b] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#e87524]/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download Markdown (.MD)
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-[#202a33] hover:bg-[#315a73]/60 border border-[#315a73]/50 text-xs font-semibold text-[#f4f5f3] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading && !report ? (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#e87524]" />
          <p className="text-sm font-mono text-[#73808b]">Compiling audit metrics, validation curves, and project report...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33] space-y-1">
              <span className="text-[10px] font-mono text-[#73808b]">MODEL GENERALIZATION</span>
              <p className="text-xl font-bold text-emerald-400">
                MAE: {report.summary_metrics?.mae} mm
              </p>
              <p className="text-[11px] text-[#73808b]">On strictly held-out cutting tools</p>
            </div>
            <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33] space-y-1">
              <span className="text-[10px] font-mono text-[#73808b]">ERROR DISPERSION</span>
              <p className="text-xl font-bold text-blue-400">
                RMSE: {report.summary_metrics?.rmse} mm
              </p>
              <p className="text-[11px] text-[#73808b]">Root Mean Squared Error</p>
            </div>
            <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33] space-y-1">
              <span className="text-[10px] font-mono text-[#73808b]">EXPLAINED VARIANCE</span>
              <p className="text-xl font-bold text-[#e87524]">
                R² = {report.summary_metrics?.r2}
              </p>
              <p className="text-[11px] text-[#73808b]">Versus Zero for Mean Baseline</p>
            </div>
          </div>

          {/* Full Markdown Report Document Viewer */}
          <div className="p-8 rounded-xl bg-[#151b22] border border-[#202a33] shadow-xl">
            <div className="max-w-4xl mx-auto prose prose-invert font-mono text-xs text-[#f4f5f3] leading-relaxed whitespace-pre-wrap select-text">
              {report.markdown_content}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-[#151b22] border border-[#202a33] text-center space-y-3">
          <FileText className="w-10 h-10 text-[#e87524] mx-auto opacity-70" />
          <h4 className="text-base font-bold text-[#f4f5f3]">Report Compilation Pending</h4>
          <p className="text-xs text-[#73808b] max-w-sm mx-auto">
            Click "Regenerate" above to compile the final academic and experimental evaluation report.
          </p>
        </div>
      )}
    </div>
  );
}


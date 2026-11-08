import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Sliders,
  Scale
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  Cell,
  Legend 
} from 'recharts';
import { api } from '../services/api';

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const fetchEvaluation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.evaluateModel();
      setEvaluation(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testMetrics = evaluation?.ann_metrics?.test || {};
  const valMetrics = evaluation?.ann_metrics?.validation || {};
  const trainMetrics = evaluation?.ann_metrics?.train || {};

  const actualVsPred = evaluation?.actual_vs_predicted || [];
  const residualData = evaluation?.residual_plot_data || [];
  const modelComparison = evaluation?.model_comparison || [];
  const caseGeneralization = evaluation?.case_generalization || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#202a33] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#e87524]" />
            Model Evaluation & Generalization Benchmarking
          </h2>
          <p className="text-sm text-[#73808b]">
            Rigorous evaluation on untouched test cutting cases held out during training.
          </p>
        </div>

        <button
          onClick={fetchEvaluation}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#202a33] text-[#f4f5f3] hover:bg-[#315a73]/60 border border-[#315a73]/50 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e87524]' : ''}`} />
          Re-evaluate Test Split
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading && !evaluation ? (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#e87524]" />
          <p className="text-sm font-mono text-[#73808b]">Computing test metrics and baseline comparisons...</p>
        </div>
      ) : evaluation ? (
        <div className="space-y-8">
          {/* Top Primary Test Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-[#151b22] border border-[#202a33] space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#73808b]">MEAN ABSOLUTE ERROR (MAE)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">TEST SET</span>
              </div>
              <p className="text-3xl font-extrabold text-[#f4f5f3]">
                {testMetrics.mae} <span className="text-sm font-normal text-[#73808b]">mm</span>
              </p>
              <p className="text-xs text-[#73808b] leading-tight">
                Average deviation from optical microscope ground truth.
              </p>
              <div className="pt-2 border-t border-[#202a33] flex justify-between text-[11px] font-mono text-[#73808b]">
                <span>Train: {trainMetrics.mae} mm</span>
                <span>Val: {valMetrics.mae} mm</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#151b22] border border-[#202a33] space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#73808b]">ROOT MEAN SQUARED ERROR (RMSE)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">TEST SET</span>
              </div>
              <p className="text-3xl font-extrabold text-blue-400">
                {testMetrics.rmse} <span className="text-sm font-normal text-[#73808b]">mm</span>
              </p>
              <p className="text-xs text-[#73808b] leading-tight">
                Penalizes large anomalous errors across aggressive cuts.
              </p>
              <div className="pt-2 border-t border-[#202a33] flex justify-between text-[11px] font-mono text-[#73808b]">
                <span>Train: {trainMetrics.rmse} mm</span>
                <span>Val: {valMetrics.rmse} mm</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#151b22] border border-[#202a33] space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#73808b]">COEFFICIENT OF DETERMINATION (R²)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202a33] text-[#e87524]">TEST SET</span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {testMetrics.r2}
              </p>
              <p className="text-xs text-[#73808b] leading-tight">
                Proportion of wear variance explained on unseen cuts.
              </p>
              <div className="pt-2 border-t border-[#202a33] flex justify-between text-[11px] font-mono text-[#73808b]">
                <span>Train R²: {trainMetrics.r2}</span>
                <span>Val R²: {valMetrics.r2}</span>
              </div>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
            <h3 className="text-base font-bold text-[#f4f5f3] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#e87524]" />
              Comparative Benchmarking Against Baselines
            </h3>
            <p className="text-xs text-[#73808b]">
              All models evaluated on the exact same held-out test split (Cases {evaluation.test_cases_evaluated?.join(', ')}) without modification.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="text-[#73808b] uppercase bg-[#0d1117] border-b border-[#202a33]">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">MAE (mm)</th>
                    <th className="px-4 py-3">RMSE (mm)</th>
                    <th className="px-4 py-3">R² Score</th>
                    <th className="px-4 py-3">Performance Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202a33]">
                  {modelComparison.map((m, idx) => {
                    const isAnn = m.model.includes('ANN');
                    return (
                      <tr key={idx} className={isAnn ? 'bg-[#e87524]/10 font-semibold' : 'hover:bg-[#202a33]/40'}>
                        <td className="px-4 py-3 font-bold text-[#f4f5f3] flex items-center gap-2">
                          {isAnn && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {m.model}
                        </td>
                        <td className="px-4 py-3 text-[#73808b]">{m.description}</td>
                        <td className="px-4 py-3 text-[#f4f5f3]">{m.mae}</td>
                        <td className="px-4 py-3 text-blue-400">{m.rmse}</td>
                        <td className="px-4 py-3 text-emerald-400">{m.r2}</td>
                        <td className="px-4 py-3 text-[#73808b]">
                          {isAnn 
                            ? 'Optimal non-linear wear capture' 
                            : idx === 0 
                            ? 'Zero variance explained baseline' 
                            : 'Linear projection benchmark'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actual vs Predicted & Residuals Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actual vs Predicted Plot */}
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
              <h4 className="text-sm font-bold text-[#f4f5f3]">Actual vs. Predicted Flank Wear (VB)</h4>
              <p className="text-xs text-[#73808b]">
                Points clustering tightly around the 45° reference line indicate accurate prediction.
              </p>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={actualVsPred} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                    <XAxis 
                      dataKey="index" 
                      stroke="#73808b" 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Test Observation #', position: 'insideBottomRight', offset: -5, fill: '#73808b', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#73808b" 
                      tick={{ fontSize: 11 }}
                      unit=" mm"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#151b22', 
                        borderColor: '#315a73',
                        fontSize: '12px',
                        color: '#f4f5f3' 
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="actual_vb" 
                      name="Ground-Truth VB" 
                      stroke="#38bdf8" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_vb" 
                      name="ANN Predicted VB" 
                      stroke="#e87524" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Residuals Plot */}
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
              <h4 className="text-sm font-bold text-[#f4f5f3]">Residual Dispersion (Actual - Predicted)</h4>
              <p className="text-xs text-[#73808b]">
                Residuals symmetrically distributed around zero confirm absence of systematic bias.
              </p>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={residualData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                    <XAxis 
                      dataKey="index" 
                      stroke="#73808b" 
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="#73808b" 
                      tick={{ fontSize: 11 }}
                      unit=" mm"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#151b22', 
                        borderColor: '#315a73',
                        fontSize: '12px',
                        color: '#f4f5f3' 
                      }}
                      formatter={(val) => [`${val} mm`, 'Residual (Error)']}
                    />
                    <Bar dataKey="residual">
                      {residualData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.residual >= 0 ? '#10b981' : '#f59e0b'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-Case Generalization Breakdown */}
          {caseGeneralization.length > 0 && (
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
              <h3 className="text-base font-bold text-[#f4f5f3]">Unseen Case Generalization Breakdown</h3>
              <p className="text-xs text-[#73808b]">
                Evaluation segregated across each independent tool run held out during model fitting.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                {caseGeneralization.map((cg) => (
                  <div key={cg.case} className="p-3.5 rounded-lg bg-[#0d1117] border border-[#202a33] space-y-1">
                    <p className="font-bold text-[#e87524]">Case {cg.case} ({cg.samples_count} cuts)</p>
                    <p className="text-[#f4f5f3]">MAE: <strong className="text-emerald-400">{cg.mae} mm</strong></p>
                    <p className="text-[#73808b]">RMSE: {cg.rmse} mm</p>
                    <p className="text-[#73808b]">R²: {cg.r2}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-[#151b22] border border-[#202a33] text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#e87524] mx-auto opacity-70" />
          <h4 className="text-lg font-bold text-[#f4f5f3]">No Evaluation Results Available</h4>
          <p className="text-sm text-[#73808b] max-w-md mx-auto">
            Please train the Artificial Neural Network on the "ANN Training" page first to evaluate test set generalization.
          </p>
        </div>
      )}
    </div>
  );
}


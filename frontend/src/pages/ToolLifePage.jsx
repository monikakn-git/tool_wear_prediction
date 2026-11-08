import React, { useState, useEffect } from 'react';
import { 
  Clock, Activity, AlertTriangle, CheckCircle2, 
  TrendingUp, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { api } from '../services/api';

export default function ToolLifePage() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [caseDetail, setCaseDetail] = useState(null);
  const [selectedModel, setSelectedModel] = useState('exponential');
  const [loading, setLoading] = useState(true);

  // Manual estimation state
  const [manualVb, setManualVb] = useState(0.24);
  const [manualRuns, setManualRuns] = useState(8);
  const [manualResult, setManualResult] = useState(null);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetail(selectedCaseId);
    }
  }, [selectedCaseId]);

  const loadCases = async () => {
    try {
      const data = await api.getToolLifeCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].case_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCaseDetail = async (cid) => {
    setLoading(true);
    try {
      const detail = await api.getToolLifeCaseDetail(cid);
      setCaseDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEstimate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.estimateRemainingLife({
        current_vb: parseFloat(manualVb),
        runs_completed: parseInt(manualRuns),
        failure_threshold: 0.60
      });
      setManualResult(res);
    } catch (err) {
      alert(err.message);
    }
  };

  // Prepare chart data combining actual wear + fitted curve
  const chartData = [];
  if (caseDetail?.wear_history) {
    caseDetail.wear_history.forEach(item => {
      chartData.push({
        run: `Cut #${item.run}`,
        runNum: item.run,
        actualVB: item.vb,
      });
    });
  }

  // Merge projection curve if available
  if (caseDetail?.life_estimation?.projection_curve) {
    caseDetail.life_estimation.projection_curve.forEach(proj => {
      const existing = chartData.find(d => d.runNum === proj.run);
      if (existing) {
        existing.projectedVB = proj.projected_vb;
      } else {
        chartData.push({
          run: `Cut #${proj.run}`,
          runNum: proj.run,
          projectedVB: proj.projected_vb,
        });
      }
    });
  }

  // Sort by runNum
  chartData.sort((a, b) => a.runNum - b.runNum);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          MODULE 3 · WEAR DEGRADATION & REMAINING CYCLES (RUL)
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
          Tool Life Estimation & Degradation Modeling
        </h1>
        <p className="text-sm text-[#73808b] font-mono mt-1">
          Parametric wear progression extrapolation on NASA sequential cutting cycles per ISO 3685 criteria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Case Selector & Manual Estimator */}
        <div className="lg:col-span-4 space-y-6">
          {/* Case Selector */}
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
            <h2 className="font-semibold text-sm text-[#f4f5f3] mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              NASA Milling Tool Case
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(parseInt(e.target.value))}
                className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2.5 text-[#f4f5f3] focus:outline-none focus:border-amber-500"
              >
                {cases.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    Case #{c.case_id} · {c.total_runs} Sequential Cuts (VB: {c.initial_vb} → {c.final_vb} mm)
                  </option>
                ))}
              </select>

              {caseDetail && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 bg-[#0d1117] border border-[#202a33] rounded">
                    <span className="text-[#73808b] block text-[10px]">Cuts Logged</span>
                    <span className="text-[#f4f5f3] font-bold text-sm">{caseDetail.total_runs} Cuts</span>
                  </div>
                  <div className="p-2.5 bg-[#0d1117] border border-[#202a33] rounded">
                    <span className="text-[#73808b] block text-[10px]">Max Flank Wear</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {Math.max(...(caseDetail.vb_progression || [0]))} mm
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input RUL Calculator */}
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
            <h2 className="font-semibold text-sm text-[#f4f5f3] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Manual Tool Life Calculator
            </h2>

            <form onSubmit={handleManualEstimate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#73808b] block mb-1">Current Flank Wear (VB in mm)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.80"
                  value={manualVb}
                  onChange={(e) => setManualVb(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Cuts / Cycles Completed</label>
                <input
                  type="number"
                  min="1"
                  value={manualRuns}
                  onChange={(e) => setManualRuns(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer transition-colors"
              >
                Estimate Remaining Cycles
              </button>
            </form>

            {manualResult && (
              <div className="mt-4 p-3 bg-[#0d1117] border border-amber-500/30 rounded text-xs font-mono space-y-1.5">
                <span className="text-amber-400 font-semibold block">{manualResult.condition_assessment}</span>
                <div className="flex justify-between">
                  <span className="text-[#73808b]">Est. Remaining Cycles:</span>
                  <span className="text-[#f4f5f3] font-bold">~{manualResult.estimated_remaining_ops_avg} cuts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#73808b]">Wear Budget Remaining:</span>
                  <span className="text-emerald-400">{manualResult.remaining_wear_budget_mm} mm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Degradation Curve & Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Chart */}
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#202a33] gap-2">
              <div>
                <h3 className="font-semibold text-base text-[#f4f5f3]">
                  Tool Flank Wear Degradation Trajectory (Case #{selectedCaseId})
                </h3>
                <span className="text-xs font-mono text-[#73808b]">
                  Actual NASA measurements vs Parametric Curve Extrapolation
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-[#f4f5f3]">
                  <span className="w-2.5 h-2.5 bg-[#e87524] rounded-full"></span> Actual VB
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span> Fitted Curve
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                  <XAxis 
                    dataKey="runNum" 
                    stroke="#73808b" 
                    fontSize={11} 
                    label={{ value: 'Cutting Pass Number (Cut Sequence)', position: 'insideBottom', offset: -10, fill: '#73808b', fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#73808b" 
                    fontSize={11} 
                    domain={[0, 0.70]} 
                    label={{ value: 'Flank Wear VB (mm)', angle: -90, position: 'insideLeft', fill: '#73808b', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151b22', borderColor: '#202a33', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  {/* Failure line at 0.60 mm */}
                  <ReferenceLine 
                    y={0.60} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: 'ISO 3685 Failure (0.60 mm)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                  />
                  {/* Steady limit line at 0.30 mm */}
                  <ReferenceLine 
                    y={0.30} 
                    stroke="#eab308" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Uniform Wear Limit (0.30 mm)', fill: '#eab308', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actualVB" 
                    stroke="#e87524" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#e87524', r: 4 }} 
                    name="Measured VB"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectedVB" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    strokeDasharray="3 3" 
                    dot={false} 
                    name="Parametric Model"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RUL Extrapolation Cards */}
          {caseDetail?.life_estimation?.success ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-4">
                <span className="text-xs font-mono text-[#73808b]">Remaining Operations (RUL)</span>
                <div className="text-2xl font-bold font-mono text-[#f4f5f3] mt-1">
                  ~{caseDetail.life_estimation.remaining_operations ?? 'N/A'} <span className="text-xs font-normal text-[#73808b]">cuts</span>
                </div>
                <div className="text-[11px] text-[#73808b] font-mono mt-0.5">
                  Until VB reaches 0.60 mm
                </div>
              </div>

              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-4">
                <span className="text-xs font-mono text-[#73808b]">Model Goodness-of-Fit</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  R² = {caseDetail.life_estimation.model_r_squared}
                </div>
                <div className="text-[11px] text-[#73808b] font-mono mt-0.5 capitalize">
                  {caseDetail.life_estimation.model_type} regression
                </div>
              </div>

              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-4">
                <span className="text-xs font-mono text-[#73808b]">Recommended Inspection</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  Every {caseDetail.life_estimation.inspection_interval} Cuts
                </div>
                <div className="text-[11px] text-[#73808b] font-mono mt-0.5">
                  Prevent unexpected breakout
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#151b22] border border-[#202a33] rounded-lg text-xs font-mono text-[#73808b]">
              {caseDetail?.life_estimation?.limitations?.[0] || 'Select a valid tool case to view RUL metrics.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

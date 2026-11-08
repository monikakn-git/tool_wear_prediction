import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  Play, 
  Layers, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Database,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function PreprocessingPage({ onPreprocessComplete }) {
  const [scalerType, setScalerType] = useState('standard');
  const [splitStrategy, setSplitStrategy] = useState('grouped_case');
  const [testCases, setTestCases] = useState([14, 15, 16]);
  const [valCases, setValCases] = useState([12, 13]);
  const [preprocessingStatus, setPreprocessingStatus] = useState(null);
  const [featureSummary, setFeatureSummary] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadStatus();
    loadFeatures();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await api.getPreprocessingStatus();
      if (status.status === 'ready') {
        setPreprocessingStatus(status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFeatures = async () => {
    try {
      const summary = await api.getFeaturesSummary();
      setFeatureSummary(summary);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await api.executePreprocessing({
        scaler_type: scalerType,
        split_strategy: splitStrategy,
        test_cases: testCases,
        val_cases: valCases,
      });
      setPreprocessingStatus(res);
      await loadFeatures();
      if (onPreprocessComplete) onPreprocessComplete(res);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleTestCase = (caseId) => {
    if (testCases.includes(caseId)) {
      setTestCases(testCases.filter(c => c !== caseId));
    } else {
      setTestCases([...testCases, caseId]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-4">
        <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#e87524]" />
          Data Preprocessing & Grouped Partitioning
        </h2>
        <p className="text-sm text-[#73808b]">
          Configure run-level statistical feature extraction, leakage-free scaling, and grouped train/test splitting.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Preprocessing Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-5">
          <h3 className="text-base font-bold text-[#f4f5f3] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#e87524]" />
            Pipeline Configuration
          </h3>

          {/* Scaler Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#f4f5f3]">Feature Scaling Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScalerType('standard')}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  scalerType === 'standard'
                    ? 'bg-[#e87524]/20 border-[#e87524] text-[#e87524] font-semibold'
                    : 'bg-[#0d1117] border-[#202a33] text-[#73808b] hover:text-[#f4f5f3]'
                }`}
              >
                StandardScaler (Z-Score)
              </button>
              <button
                type="button"
                onClick={() => setScalerType('minmax')}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  scalerType === 'minmax'
                    ? 'bg-[#e87524]/20 border-[#e87524] text-[#e87524] font-semibold'
                    : 'bg-[#0d1117] border-[#202a33] text-[#73808b] hover:text-[#f4f5f3]'
                }`}
              >
                MinMaxScaler [0, 1]
              </button>
            </div>
            <p className="text-[11px] text-[#73808b]">
              Fit strictly on training split; applied unchanged to test sets.
            </p>
          </div>

          {/* Splitting Strategy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#f4f5f3]">Data Splitting Protocol</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0d1117] border border-[#202a33] cursor-pointer">
                <input
                  type="radio"
                  name="split"
                  checked={splitStrategy === 'grouped_case'}
                  onChange={() => setSplitStrategy('grouped_case')}
                  className="mt-0.5 accent-[#e87524]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#f4f5f3] block">Grouped By Case (Recommended)</span>
                  <span className="text-[11px] text-[#73808b] block mt-0.5">
                    Holds out entire cutting cases to strictly test unseen tool wear generalization.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0d1117] border border-[#202a33] cursor-pointer">
                <input
                  type="radio"
                  name="split"
                  checked={splitStrategy === 'random'}
                  onChange={() => setSplitStrategy('random')}
                  className="mt-0.5 accent-[#e87524]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#f4f5f3] block">Random 70 / 15 / 15 Split</span>
                  <span className="text-[11px] text-[#73808b] block mt-0.5">
                    Standard random row split (Note: can cause slight intra-case correlation).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Test Case Selection if Grouped */}
          {splitStrategy === 'grouped_case' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#f4f5f3]">Held-Out Test Cases (Unseen)</label>
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#0d1117] rounded-lg border border-[#202a33]">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((cid) => {
                  const isTest = testCases.includes(cid);
                  const isVal = valCases.includes(cid);
                  return (
                    <button
                      key={cid}
                      type="button"
                      disabled={isVal}
                      onClick={() => toggleTestCase(cid)}
                      className={`py-1 text-[11px] font-mono rounded border transition-all ${
                        isTest
                          ? 'bg-[#e87524] text-white border-[#e87524] font-bold'
                          : isVal
                          ? 'bg-blue-950/30 text-blue-400 border-blue-900/40 opacity-60 cursor-not-allowed'
                          : 'bg-[#151b22] text-[#73808b] border-[#202a33] hover:text-[#f4f5f3]'
                      }`}
                    >
                      C{cid} {isTest ? '(Test)' : isVal ? '(Val)' : ''}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#73808b]">
                Orange = Test Cases (Unseen) · Blue = Validation Cases
              </p>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full py-3 rounded-lg bg-[#e87524] hover:bg-[#d0641b] text-white font-semibold text-sm transition-all shadow-lg shadow-[#e87524]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Execute Preprocessing Pipeline
              </>
            )}
          </button>
        </div>

        {/* Status & Execution Report */}
        <div className="lg:col-span-2 space-y-6">
          {preprocessingStatus ? (
            <div className="p-6 rounded-xl bg-[#151b22] border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4" />
                  PREPROCESSING ACTIVE & VERIFIED
                </span>
                <span className="text-xs font-mono text-[#73808b]">
                  Scaler: {preprocessingStatus.scaler_type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">TRAIN SET</p>
                  <p className="text-xl font-bold text-[#f4f5f3]">{preprocessingStatus.train_samples}</p>
                  <p className="text-[10px] text-[#73808b]">Cases: {preprocessingStatus.train_cases?.join(', ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">VALIDATION SET</p>
                  <p className="text-xl font-bold text-blue-400">{preprocessingStatus.val_samples}</p>
                  <p className="text-[10px] text-[#73808b]">Cases: {preprocessingStatus.val_cases?.join(', ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">TEST SET (HELD-OUT)</p>
                  <p className="text-xl font-bold text-[#e87524]">{preprocessingStatus.test_samples}</p>
                  <p className="text-[10px] text-[#e87524]">Cases: {preprocessingStatus.test_cases?.join(', ')}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33] text-xs text-[#73808b] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f4f5f3]">Generalization Guarantee: </strong>
                  {preprocessingStatus.unseen_case_guarantee}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#151b22] border border-[#202a33] text-center space-y-3">
              <Info className="w-8 h-8 text-[#e87524] mx-auto opacity-70" />
              <h4 className="text-base font-bold text-[#f4f5f3]">Preprocessing Pending</h4>
              <p className="text-xs text-[#73808b] max-w-md mx-auto">
                Click "Execute Preprocessing Pipeline" on the left to extract statistical features, perform grouped case partitioning, and fit the scaler on the training set.
              </p>
            </div>
          )}

          {/* Top Correlated Features with VB */}
          {featureSummary && (
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
              <h4 className="text-base font-bold text-[#f4f5f3] flex items-center justify-between">
                <span>Top Features Correlated with Flank Wear (VB)</span>
                <span className="text-xs font-mono text-[#73808b]">
                  {featureSummary.total_extracted_features} Features Total
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-mono text-emerald-400 font-semibold">Positive Correlation (+r with wear):</p>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(featureSummary.top_positive_correlations || {}).slice(0, 5).map(([f, r]) => (
                      <div key={f} className="flex justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                        <span className="text-[#f4f5f3]">{f}</span>
                        <span className="text-emerald-400 font-bold">+{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-mono text-amber-400 font-semibold">Negative / Dynamic Shift (-r):</p>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(featureSummary.top_negative_correlations || {}).slice(0, 5).map(([f, r]) => (
                      <div key={f} className="flex justify-between p-2 rounded bg-[#0d1117] border border-[#202a33]">
                        <span className="text-[#f4f5f3]">{f}</span>
                        <span className="text-amber-400 font-bold">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


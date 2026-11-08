import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, XCircle, 
  Layers, ShieldAlert, RefreshCw, Compass, ArrowRight,
  Info, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function RecommendationPage() {
  const [categories, setCategories] = useState({});
  const [workpieceMaterials, setWorkpieceMaterials] = useState({});
  const [operations, setOperations] = useState({});

  // Inputs
  const [selectedCategory, setSelectedCategory] = useState('End Mill');
  const [selectedSubstrate, setSelectedSubstrate] = useState('Solid Carbide');
  const [selectedWorkpiece, setSelectedWorkpiece] = useState('Carbon Steel');
  const [selectedOperation, setSelectedOperation] = useState('Side Milling');
  const [speed, setSpeed] = useState(250);
  const [feed, setFeed] = useState(0.08);
  const [doc, setDoc] = useState(2.0);
  const [currentVb, setCurrentVb] = useState(0.20);

  const [loading, setLoading] = useState(false);
  const [feasibility, setFeasibility] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [cats, wp, ops] = await Promise.all([
        api.getCategories(),
        api.getWorkpieceMaterials(),
        api.getOperations(),
      ]);
      setCategories(cats);
      setWorkpieceMaterials(wp);
      setOperations(ops);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [feas, recs] = await Promise.all([
        api.checkFeasibility({
          tool_category: selectedCategory,
          operation_type: selectedOperation,
          workpiece_material: selectedWorkpiece,
          tool_material: selectedSubstrate,
          cutting_speed: parseFloat(speed) || null,
          feed_rate: parseFloat(feed) || null,
          depth_of_cut: parseFloat(doc) || null,
          current_vb: parseFloat(currentVb) || null,
        }),
        api.recommendOperations({
          tool_category: selectedCategory,
          tool_material: selectedSubstrate,
          workpiece_material: selectedWorkpiece,
          current_vb: parseFloat(currentVb) || null,
        }),
      ]);
      setFeasibility(feas);
      setRecommendations(recs);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs mb-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          MODULE 4 · DETERMINISTIC MANUFACTURING RECOMMENDATION ENGINE
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
          Machining Operation Feasibility & Parameter Guidance
        </h1>
        <p className="text-sm text-[#73808b] font-mono mt-1">
          Evaluate tool geometry, workpiece metallurgical compatibility, cutting parameters, and wear degradation limits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleEvaluate} className="bg-[#151b22] border border-[#202a33] rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#f4f5f3] flex items-center gap-2 font-mono">
              <Compass className="w-4 h-4 text-purple-400" />
              Operation & Setup Parameters
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#73808b] block mb-1">Cutting Tool Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3] focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Tool Substrate Material</label>
                <select
                  value={selectedSubstrate}
                  onChange={(e) => setSelectedSubstrate(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3] focus:outline-none focus:border-purple-500"
                >
                  <option value="Solid Carbide">Solid Carbide</option>
                  <option value="HSS">HSS</option>
                  <option value="Tungsten Carbide">Tungsten Carbide</option>
                  <option value="Ceramic">Ceramic</option>
                  <option value="CBN">CBN</option>
                  <option value="PCD">PCD</option>
                </select>
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Workpiece Material Group (ISO)</label>
                <select
                  value={selectedWorkpiece}
                  onChange={(e) => setSelectedWorkpiece(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3] focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(workpieceMaterials).map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Requested Machining Operation</label>
                <select
                  value={selectedOperation}
                  onChange={(e) => setSelectedOperation(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3] focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(operations).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[#73808b] block mb-1">Cutting Speed (SFM)</label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                  />
                </div>
                <div>
                  <label className="text-[#73808b] block mb-1">Feed (mm/tooth)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feed}
                    onChange={(e) => setFeed(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#73808b] block mb-1">Depth of Cut (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                  />
                </div>
                <div>
                  <label className="text-[#73808b] block mb-1">Current Wear VB (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentVb}
                    onChange={(e) => setCurrentVb(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold shadow-lg shadow-purple-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Knowledge Base Rules...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Evaluate Operation Feasibility
                </>
              )}
            </button>
          </form>

          {/* Academic Transparency Note */}
          <div className="p-4 bg-[#151b22] border border-[#202a33] rounded-lg text-xs font-mono text-[#73808b] space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              Deterministic Rule System
            </div>
            <p className="leading-relaxed">
              Recommendations are grounded strictly in ISO 513 metallurgical groups, ISO 3685 wear limits, and manufacturer speed/feed tables. No unrestricted generative hallucinations.
            </p>
          </div>
        </div>

        {/* Right Column: Feasibility Results */}
        <div className="lg:col-span-7 space-y-6">
          {feasibility ? (
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#202a33]">
                  <h3 className="font-semibold text-[#f4f5f3] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Feasibility Verdict
                  </h3>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                    feasibility.suitability === 'suitable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    feasibility.suitability === 'conditional' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {feasibility.suitability === 'suitable' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {feasibility.suitability === 'conditional' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {feasibility.suitability === 'unsuitable' && <XCircle className="w-3.5 h-3.5" />}
                    {feasibility.suitability.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[#73808b] block mb-1">Engineering Justification:</span>
                    <ul className="space-y-1 list-disc list-inside text-[#f4f5f3]">
                      {feasibility.reasons?.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {feasibility.warnings?.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded space-y-1">
                      <span className="text-amber-400 font-semibold block">Operating Warnings:</span>
                      {feasibility.warnings.map((w, idx) => (
                        <p key={idx} className="text-amber-300 text-[11px]">• {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Supported Operations for this Tool Category */}
              {recommendations && (
                <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-5">
                  <h3 className="font-semibold text-sm text-[#f4f5f3] mb-3 font-mono flex items-center justify-between">
                    <span>Other Supported Operations for {selectedCategory}</span>
                    <span className="text-xs text-[#73808b] font-normal">Auto-derived</span>
                  </h3>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {recommendations.suitable_operations?.map((op, idx) => (
                      <div key={idx} className="p-2.5 bg-[#0d1117] border border-[#202a33] rounded text-xs font-mono flex items-center justify-between">
                        <div>
                          <span className="text-[#f4f5f3] font-semibold">{op.operation}</span>
                          <span className="text-[#73808b] text-[11px] block">{op.reason}</span>
                        </div>
                        {op.recommended_speed_sfm && (
                          <span className="text-[#e87524] text-[11px] shrink-0 font-semibold">
                            ~{op.recommended_speed_sfm} SFM
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#151b22] border border-[#202a33] rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#202a33] flex items-center justify-center text-[#73808b]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[#f4f5f3]">No Operation Evaluated Yet</h3>
              <p className="text-xs text-[#73808b] font-mono max-w-sm">
                Configure your cutting tool category, workpiece alloy, and proposed cutting speeds on the left panel to test manufacturing feasibility.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

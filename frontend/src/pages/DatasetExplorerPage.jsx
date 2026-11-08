import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Layers, 
  TrendingUp, 
  Search,
  Eye,
  BarChart2,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { api } from '../services/api';

export default function DatasetExplorerPage({ auditData, refreshAudit }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunIdx, setSelectedRunIdx] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState('smcAC');
  const [signalData, setSignalData] = useState(null);
  const [loadingSignal, setLoadingSignal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [filterCase, setFilterCase] = useState('all');

  // Distribution & Scatter States
  const [vbDist, setVbDist] = useState([]);
  const [scatterFeature, setScatterFeature] = useState('smcAC_rms');
  const [scatterData, setScatterData] = useState([]);
  const [loadingScatter, setLoadingScatter] = useState(false);

  // Load catalog, distribution & scatter on mount
  useEffect(() => {
    loadRunsCatalog();
    loadDistribution();
    loadScatter('smcAC_rms');
  }, []);

  const loadDistribution = async () => {
    try {
      const res = await api.getVbDistribution();
      setVbDist(res.distribution || []);
    } catch (err) {
      console.error('Error fetching VB distribution:', err);
    }
  };

  const loadScatter = async (feat) => {
    setLoadingScatter(true);
    try {
      const res = await api.getScatterData(feat);
      setScatterData(res.data || []);
    } catch (err) {
      console.error('Error fetching scatter data:', err);
    } finally {
      setLoadingScatter(false);
    }
  };

  const handleScatterFeatureChange = (feat) => {
    setScatterFeature(feat);
    loadScatter(feat);
  };

  // Fetch signal whenever selected run or channel changes
  useEffect(() => {
    if (runs.length > 0) {
      fetchRunSignal(selectedRunIdx);
    }
  }, [selectedRunIdx, runs]);

  const loadRunsCatalog = async () => {
    try {
      const data = await api.getRunsCatalog();
      setRuns(data.runs || []);
    } catch (err) {
      console.error('Error fetching runs:', err);
    }
  };

  const fetchRunSignal = async (idx) => {
    setLoadingSignal(true);
    try {
      const res = await api.getRunSignal(idx, 600);
      setSignalData(res);
    } catch (err) {
      console.error('Error fetching signal:', err);
    } finally {
      setLoadingSignal(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    try {
      const res = await api.uploadDataset(file);
      setUploadStatus({ type: 'success', message: res.message });
      refreshAudit();
      loadRunsCatalog();
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Prepare chart data from signalData
  const chartPoints = signalData?.signals
    ? signalData.signals.time.map((t, i) => ({
        time: t,
        value: signalData.signals[selectedChannel]?.[i] ?? 0,
      }))
    : [];

  const selectedRunMeta = runs[selectedRunIdx] || {};

  // Filter runs by case
  const filteredRuns = filterCase === 'all' 
    ? runs 
    : runs.filter(r => r.case === parseInt(filterCase));

  // Channel labels
  const channelLabels = {
    smcAC: 'AC Spindle Motor Current (A)',
    smcDC: 'DC Spindle Motor Current (A)',
    vib_table: 'Table Vibration (g)',
    vib_spindle: 'Spindle Vibration (g)',
    AE_table: 'Table Acoustic Emission (V)',
    AE_spindle: 'Spindle Acoustic Emission (V)',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#202a33] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
            <Database className="w-6 h-6 text-[#e87524]" />
            NASA Milling Dataset Explorer
          </h2>
          <p className="text-sm text-[#73808b]">
            Inspect raw MATLAB structure, audit data health, and visualize downsampled sensor waveforms.
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3">
          <label className="px-4 py-2 rounded-lg bg-[#202a33] text-[#f4f5f3] hover:bg-[#315a73]/60 border border-[#315a73]/50 text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4 text-[#e87524]" />
            {uploading ? 'Processing File...' : 'Upload .MAT / .ZIP'}
            <input 
              type="file" 
              accept=".mat,.zip" 
              onChange={handleFileUpload} 
              disabled={uploading} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {uploadStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
          uploadStatus.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950/40 border border-red-500/40 text-red-300'
        }`}>
          {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {uploadStatus.message}
        </div>
      )}

      {/* Dataset Audit Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">TOTAL EXPERIMENTAL RUNS</p>
          <p className="text-2xl font-bold text-[#f4f5f3] mt-1">{auditData?.total_runs || 167}</p>
          <p className="text-[10px] text-[#73808b]">Full Dataset Cuts</p>
        </div>

        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">VALID WEAR LABELS</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{auditData?.valid_wear_labels || 146}</p>
          <p className="text-[10px] text-emerald-500/80">Supervised Ready</p>
        </div>

        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">UNMEASURED / MISSING VB</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{auditData?.missing_wear_labels || 21}</p>
          <p className="text-[10px] text-amber-500/80">Omitted from Supervised</p>
        </div>

        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">EXPERIMENTAL CASES</p>
          <p className="text-2xl font-bold text-[#f4f5f3] mt-1">{auditData?.total_cases || 16}</p>
          <p className="text-[10px] text-[#73808b]">Independent Tools</p>
        </div>

        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">POINTS PER CHANNEL</p>
          <p className="text-2xl font-bold text-[#e87524] mt-1">9,000</p>
          <p className="text-[10px] text-[#73808b]">250 Hz Sampling</p>
        </div>

        <div className="p-4 rounded-xl bg-[#151b22] border border-[#202a33]">
          <p className="text-[11px] font-mono text-[#73808b]">FLANK WEAR RANGE</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            0 - {auditData?.target_distribution?.max || '1.53'} <span className="text-xs font-normal">mm</span>
          </p>
          <p className="text-[10px] text-[#73808b]">Mean: {auditData?.target_distribution?.mean || '0.338'} mm</p>
        </div>
      </div>

      {/* Sensor Signal Waveform Visualizer */}
      <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#202a33]">
          <div>
            <h3 className="text-lg font-bold text-[#f4f5f3] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#e87524]" />
              Run Waveform Visualizer
            </h3>
            <p className="text-xs text-[#73808b]">
              Inspect high-frequency sensor readings for Run #{selectedRunMeta.run ?? 1} (Case {selectedRunMeta.case ?? 1})
            </p>
          </div>

          {/* Controls: Run Selector & Channel Selector */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter Case */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#73808b]">Filter Case:</span>
              <select
                value={filterCase}
                onChange={(e) => setFilterCase(e.target.value)}
                className="bg-[#0d1117] text-[#f4f5f3] border border-[#202a33] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#e87524]"
              >
                <option value="all">All 16 Cases</option>
                {Array.from({ length: 16 }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c}>Case {c}</option>
                ))}
              </select>
            </div>

            {/* Run Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#73808b]">Select Run:</span>
              <select
                value={selectedRunIdx}
                onChange={(e) => setSelectedRunIdx(Number(e.target.value))}
                className="bg-[#0d1117] text-[#f4f5f3] border border-[#202a33] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#e87524]"
              >
                {filteredRuns.map((r) => (
                  <option key={r.index} value={r.index}>
                    Run {r.run} (Case {r.case}) {r.has_valid_vb ? `· VB=${r.VB}mm` : '· (No VB)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Tabs */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#202a33] overflow-x-auto">
              {['smcAC', 'smcDC', 'vib_table', 'vib_spindle', 'AE_table', 'AE_spindle'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                    selectedChannel === ch 
                      ? 'bg-[#e87524] text-white font-semibold' 
                      : 'text-[#73808b] hover:text-[#f4f5f3]'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run Metadata Badge */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-[#0d1117] p-3 rounded-lg border border-[#202a33]">
          <div><span className="text-[#73808b]">Case:</span> <span className="text-[#f4f5f3] font-semibold">{selectedRunMeta.case}</span></div>
          <div><span className="text-[#73808b]">Run #:</span> <span className="text-[#f4f5f3] font-semibold">{selectedRunMeta.run}</span></div>
          <div><span className="text-[#73808b]">Material:</span> <span className="text-[#f4f5f3]">{selectedRunMeta.material_name}</span></div>
          <div><span className="text-[#73808b]">DOC:</span> <span className="text-[#e87524]">{selectedRunMeta.DOC} mm</span></div>
          <div><span className="text-[#73808b]">Feed:</span> <span className="text-[#e87524]">{selectedRunMeta.feed} mm/rev</span></div>
          <div>
            <span className="text-[#73808b]">Ground Truth VB: </span>
            {selectedRunMeta.has_valid_vb ? (
              <span className="text-emerald-400 font-bold">{selectedRunMeta.VB} mm</span>
            ) : (
              <span className="text-amber-400 font-semibold italic">Unmeasured (Excluded from ANN)</span>
            )}
          </div>
        </div>

        {/* Waveform Chart */}
        <div className="h-72 w-full pt-2">
          {loadingSignal ? (
            <div className="h-full flex items-center justify-center text-[#73808b] text-sm font-mono">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#e87524]" />
              Downsampling 9,000 sensor samples...
            </div>
          ) : chartPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                <XAxis 
                  dataKey="time" 
                  stroke="#73808b" 
                  tick={{ fontSize: 11 }} 
                  unit="s"
                  tickFormatter={(val) => `${val.toFixed(1)}s`}
                />
                <YAxis 
                  stroke="#73808b" 
                  tick={{ fontSize: 11 }} 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#151b22', 
                    borderColor: '#315a73',
                    fontSize: '12px',
                    color: '#f4f5f3' 
                  }}
                  formatter={(val) => [`${Number(val).toFixed(5)}`, channelLabels[selectedChannel]]}
                  labelFormatter={(lbl) => `Time: ${Number(lbl).toFixed(3)}s`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#e87524" 
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#73808b] text-sm">
              No signal data available for this cut.
            </div>
          )}
        </div>
      </div>

      {/* Target Distribution & Sensor vs Flank Wear Scatter Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flank Wear Distribution Histogram */}
        <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#f4f5f3] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#e87524]" />
              Ground-Truth Flank Wear (VB) Distribution
            </h4>
            <span className="text-[11px] font-mono text-[#73808b]">146 Valid Observations</span>
          </div>
          <p className="text-xs text-[#73808b]">
            Frequency histogram of measured flank wear classified by ISO 3685 industrial zones.
          </p>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vbDist} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                <XAxis 
                  dataKey="range" 
                  stroke="#73808b" 
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis 
                  stroke="#73808b" 
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#151b22', 
                    borderColor: '#315a73',
                    fontSize: '12px',
                    color: '#f4f5f3' 
                  }}
                  formatter={(val, name, item) => [
                    `${val} cuts (${item.payload.label})`,
                    `Zone: ${item.payload.zone}`
                  ]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {vbDist.map((entry, index) => {
                    const color = entry.zone === 'Initial' ? '#10b981' : entry.zone === 'Steady' ? '#f59e0b' : '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center gap-6 pt-1 text-[11px] font-mono text-[#73808b]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Break-in (&lt;0.2mm)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Steady (0.2-0.4mm)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Severe (&ge;0.4mm)</span>
          </div>
        </div>

        {/* Sensor vs Flank Wear Scatter Explorer */}
        <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="text-sm font-bold text-[#f4f5f3] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#e87524]" />
              Sensor Dynamics vs. Flank Wear (VB)
            </h4>
            <select
              value={scatterFeature}
              onChange={(e) => handleScatterFeatureChange(e.target.value)}
              className="bg-[#0d1117] text-[#f4f5f3] border border-[#202a33] rounded px-2.5 py-1 text-xs font-mono focus:border-[#e87524] focus:outline-none"
            >
              <option value="smcAC_rms">AC Motor Current RMS (smcAC)</option>
              <option value="smcDC_rms">DC Motor Current RMS (smcDC)</option>
              <option value="vib_table_rms">Table Vibration RMS (vib_table)</option>
              <option value="vib_spindle_rms">Spindle Vibration RMS (vib_spindle)</option>
              <option value="AE_table_rms">Table Acoustic Emission RMS</option>
              <option value="AE_spindle_rms">Spindle Acoustic Emission RMS</option>
              <option value="smcAC_p2p">AC Current Peak-to-Peak</option>
              <option value="DOC">Depth of Cut (DOC)</option>
              <option value="feed">Feed Rate (feed)</option>
            </select>
          </div>
          <p className="text-xs text-[#73808b]">
            Inspect physical non-linear coupling between sensor metrics and tool wear across all runs.
          </p>
          <div className="h-60 w-full pt-2">
            {loadingScatter ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-[#73808b]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#e87524]" />
                Loading scatter points...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                  <XAxis 
                    type="number" 
                    dataKey="feature_val" 
                    name={scatterFeature} 
                    stroke="#73808b" 
                    tick={{ fontSize: 10 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="VB" 
                    name="Flank Wear VB" 
                    unit=" mm" 
                    stroke="#73808b" 
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#151b22', 
                      borderColor: '#315a73',
                      fontSize: '12px',
                      color: '#f4f5f3' 
                    }}
                    formatter={(val, name) => [
                      `${val} ${name === 'VB' ? 'mm' : ''}`,
                      name === 'VB' ? 'Ground-Truth VB' : scatterFeature
                    ]}
                    labelFormatter={() => ''}
                  />
                  <Scatter 
                    data={scatterData} 
                    fill="#e87524" 
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[11px] font-mono text-[#73808b] text-center">
            X: {scatterFeature} · Y: Ground-Truth Flank Wear VB (mm)
          </p>
        </div>
      </div>

      {/* Case-by-Case Breakdown Table */}
      <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
        <h3 className="text-lg font-bold text-[#f4f5f3]">NASA Experimental Cases Breakdown</h3>
        <p className="text-xs text-[#73808b]">
          Distribution of machining conditions, valid wear measurements, and flank wear progression across all 16 cases.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[#73808b] uppercase bg-[#0d1117] border-b border-[#202a33]">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Workpiece Material</th>
                <th className="px-4 py-3">DOC (mm)</th>
                <th className="px-4 py-3">Feed (mm/rev)</th>
                <th className="px-4 py-3">Total Cuts</th>
                <th className="px-4 py-3 text-emerald-400">Valid VB</th>
                <th className="px-4 py-3 text-amber-400">Missing VB</th>
                <th className="px-4 py-3">VB Range (mm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202a33]">
              {auditData?.case_summary?.map((cs) => (
                <tr key={cs.case} className="hover:bg-[#202a33]/50 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-[#f4f5f3]">Case {cs.case}</td>
                  <td className="px-4 py-2.5 text-[#f4f5f3]">{cs.material}</td>
                  <td className="px-4 py-2.5 text-[#e87524]">{cs.DOC}</td>
                  <td className="px-4 py-2.5 text-[#e87524]">{cs.feed}</td>
                  <td className="px-4 py-2.5 text-[#f4f5f3]">{cs.total_runs}</td>
                  <td className="px-4 py-2.5 text-emerald-400 font-semibold">{cs.valid_runs}</td>
                  <td className="px-4 py-2.5 text-amber-400 font-semibold">{cs.missing_runs}</td>
                  <td className="px-4 py-2.5 text-[#73808b]">
                    {cs.min_VB !== null ? `${cs.min_VB} → ${cs.max_VB}` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


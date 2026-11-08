import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Wrench, Layers, ExternalLink, 
  Trash2, Info, CheckCircle2, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function ToolCataloguePage() {
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeToolDetail, setActiveToolDetail] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New tool form state
  const [newTool, setNewTool] = useState({
    category: 'End Mill',
    manufacturer: '',
    model_number: '',
    tool_material: 'Solid Carbide',
    coating: 'TiAlN',
    diameter_mm: 10.0,
    num_flutes: 4,
    speed_range_min: 80,
    speed_range_max: 200,
    feed_range_min: 0.04,
    feed_range_max: 0.12,
    doc_range_min: 0.5,
    doc_range_max: 10.0,
    restrictions: '',
  });

  useEffect(() => {
    loadCatalogue();
    loadCategories();
  }, [selectedCategory, selectedMaterial]);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const data = await api.listTools(selectedCategory || null, selectedMaterial || null);
      setTools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      loadCatalogue();
      return;
    }
    try {
      const results = await api.searchTools(q);
      setTools(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (toolId) => {
    try {
      const detail = await api.getTool(toolId);
      setActiveToolDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTool = async (e) => {
    e.preventDefault();
    try {
      await api.addTool(newTool);
      setShowAddModal(false);
      loadCatalogue();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#202a33] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#e87524]/10 border border-[#e87524]/30 text-[#e87524] font-mono text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-[#e87524] animate-pulse"></span>
            MODULE 1 & 4 · PHYSICAL INVENTORY
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#f4f5f3]">
            Cutting Tool Catalogue & Engineering Specifications
          </h1>
          <p className="text-sm text-[#73808b] font-mono mt-1">
            Browse verified cutting tool geometries, manufacturer tolerances, and operational speed/feed boundaries
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded bg-[#e87524] hover:bg-[#d6671a] text-white font-mono text-xs font-semibold shadow-lg shadow-[#e87524]/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          Register New Tool
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#73808b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by model, manufacturer, category..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-[#151b22] border border-[#202a33] rounded-lg pl-10 pr-4 py-2 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#151b22] border border-[#202a33] rounded-lg px-3 py-2 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
        >
          <option value="">All Categories</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          className="bg-[#151b22] border border-[#202a33] rounded-lg px-3 py-2 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
        >
          <option value="">All Substrates</option>
          <option value="Solid Carbide">Solid Carbide</option>
          <option value="HSS">HSS</option>
          <option value="Tungsten Carbide">Tungsten Carbide</option>
          <option value="Ceramic">Ceramic</option>
          <option value="CBN">CBN</option>
          <option value="PCD">PCD</option>
        </select>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-[#73808b] font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#e87524]" />
          Loading cutting tool specifications...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => (
            <div 
              key={t.id} 
              className="bg-[#151b22] border border-[#202a33] hover:border-[#315a73] rounded-lg p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#73808b] mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#202a33] text-[#e87524]">
                    {t.category}
                  </span>
                  <span>#{t.id}</span>
                </div>

                <h3 className="font-bold text-base text-[#f4f5f3] tracking-tight">
                  {t.manufacturer} · <span className="font-mono text-sm text-[#f4f5f3]">{t.model_number || 'Standard Series'}</span>
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#0d1117] border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Diameter</span>
                    <span className="text-[#f4f5f3] font-semibold">{t.diameter_mm ? `${t.diameter_mm} mm` : 'N/A'}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1117] border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Substrate</span>
                    <span className="text-[#f4f5f3] truncate font-semibold">{t.tool_material}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1117] border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Coating</span>
                    <span className="text-cyan-400 font-semibold">{t.coating}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1117] border border-[#202a33]">
                    <span className="text-[#73808b] block text-[10px]">Flute Count</span>
                    <span className="text-[#f4f5f3] font-semibold">{t.num_flutes ? `${t.num_flutes}Z` : '0 (Insert)'}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs font-mono text-[#73808b]">
                  <span>Rec. Speed: </span>
                  <span className="text-[#f4f5f3]">{t.speed_range_min} - {t.speed_range_max} m/min</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#202a33] flex items-center justify-between">
                <button
                  onClick={() => handleViewDetail(t.id)}
                  className="text-xs font-mono text-[#e87524] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  View Engineering Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tool Detail Modal */}
      {activeToolDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#151b22] border border-[#202a33] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#202a33]">
              <div>
                <span className="text-xs font-mono text-[#e87524]">{activeToolDetail.tool.category}</span>
                <h2 className="text-xl font-bold text-[#f4f5f3]">
                  {activeToolDetail.tool.manufacturer} · {activeToolDetail.tool.model_number}
                </h2>
              </div>
              <button 
                onClick={() => setActiveToolDetail(null)}
                className="text-[#73808b] hover:text-[#f4f5f3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Geometry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                <span className="text-[#73808b] block text-[10px]">Diameter</span>
                <span className="text-[#f4f5f3] font-bold text-sm">{activeToolDetail.tool.diameter_mm} mm</span>
              </div>
              <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                <span className="text-[#73808b] block text-[10px]">Shank Dia</span>
                <span className="text-[#f4f5f3] font-bold text-sm">{activeToolDetail.tool.shank_diameter_mm} mm</span>
              </div>
              <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                <span className="text-[#73808b] block text-[10px]">Flute Count</span>
                <span className="text-[#f4f5f3] font-bold text-sm">{activeToolDetail.tool.num_flutes} Flutes</span>
              </div>
              <div className="p-3 bg-[#0d1117] rounded border border-[#202a33]">
                <span className="text-[#73808b] block text-[10px]">Helix Angle</span>
                <span className="text-[#f4f5f3] font-bold text-sm">{activeToolDetail.tool.helix_angle}°</span>
              </div>
            </div>

            {/* Compatible Operations */}
            <div>
              <h3 className="text-sm font-semibold text-[#f4f5f3] mb-2 font-mono">Machining Operation Suitability</h3>
              <div className="space-y-2">
                {activeToolDetail.compatible_operations?.map((op, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#0d1117] border border-[#202a33] text-xs font-mono flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[#f4f5f3] font-semibold">{op.operation}</span>
                      <p className="text-[#73808b] text-[11px] mt-0.5">{op.reason}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] shrink-0 font-semibold ${
                      op.suitability === 'suitable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      op.suitability === 'conditional' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {op.suitability.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Material Compatibility */}
            <div>
              <h3 className="text-sm font-semibold text-[#f4f5f3] mb-2 font-mono">Workpiece Material Compatibility</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeToolDetail.material_compatibility?.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#0d1117] border border-[#202a33] text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-[#f4f5f3]">{m.workpiece_material}</span>
                      <span className="text-[#73808b] text-[11px] block">{m.notes}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.suitability === 'suitable' ? 'text-emerald-400' :
                      m.suitability === 'conditional' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {m.suitability.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateTool} className="bg-[#151b22] border border-[#202a33] rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202a33]">
              <h2 className="text-lg font-bold text-[#f4f5f3]">Register Cutting Tool</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-[#73808b] hover:text-[#f4f5f3]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-[#73808b] block mb-1">Category</label>
                <select
                  value={newTool.category}
                  onChange={(e) => setNewTool({...newTool, category: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                >
                  {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sandvik Coromant"
                  value={newTool.manufacturer}
                  onChange={(e) => setNewTool({...newTool, manufacturer: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Model / Product Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R245-080Q27"
                  value={newTool.model_number}
                  onChange={(e) => setNewTool({...newTool, model_number: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Diameter (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTool.diameter_mm}
                  onChange={(e) => setNewTool({...newTool, diameter_mm: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>

              <div>
                <label className="text-[#73808b] block mb-1">Substrate Material</label>
                <select
                  value={newTool.tool_material}
                  onChange={(e) => setNewTool({...newTool, tool_material: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
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
                <label className="text-[#73808b] block mb-1">Coating</label>
                <input
                  type="text"
                  placeholder="e.g. TiAlN, DLC"
                  value={newTool.coating}
                  onChange={(e) => setNewTool({...newTool, coating: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#202a33] rounded p-2 text-[#f4f5f3]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-[#e87524] hover:bg-[#d6671a] text-white font-mono text-xs font-semibold"
            >
              Save to Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

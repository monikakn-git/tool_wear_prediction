const BASE_URL = '/api';

export const api = {
  // ── Health ────────────────────────────────────────────────────────────
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Failed to reach backend health endpoint');
    return res.json();
  },

  // ── Dataset ───────────────────────────────────────────────────────────
  async inspectDataset() {
    const res = await fetch(`${BASE_URL}/dataset/inspect`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to inspect dataset');
    }
    return res.json();
  },

  async getRunsCatalog() {
    const res = await fetch(`${BASE_URL}/dataset/runs`);
    if (!res.ok) throw new Error('Failed to fetch runs catalog');
    return res.json();
  },

  async getRunSignal(runIndex, points = 600) {
    const res = await fetch(`${BASE_URL}/dataset/run/${runIndex}/signal?points=${points}`);
    if (!res.ok) throw new Error(`Failed to fetch signal for run ${runIndex}`);
    return res.json();
  },

  async getFeaturesSummary() {
    const res = await fetch(`${BASE_URL}/dataset/features`);
    if (!res.ok) throw new Error('Failed to fetch feature summary');
    return res.json();
  },

  async getScatterData(feature = 'smcAC_rms') {
    const res = await fetch(`${BASE_URL}/dataset/scatter?feature=${feature}`);
    if (!res.ok) throw new Error('Failed to fetch scatter data');
    return res.json();
  },

  async getVbDistribution() {
    const res = await fetch(`${BASE_URL}/dataset/vb-distribution`);
    if (!res.ok) throw new Error('Failed to fetch VB distribution');
    return res.json();
  },

  async uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async executePreprocessing(config) {
    const res = await fetch(`${BASE_URL}/dataset/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Preprocessing execution failed');
    }
    return res.json();
  },

  async getPreprocessingStatus() {
    const res = await fetch(`${BASE_URL}/dataset/preprocessing-status`);
    if (!res.ok) throw new Error('Failed to fetch preprocessing status');
    return res.json();
  },

  // ── Model Training & Wear Inference ───────────────────────────────────
  async trainModel(config) {
    const res = await fetch(`${BASE_URL}/model/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Model training failed');
    }
    return res.json();
  },

  async getModelStatus() {
    const res = await fetch(`${BASE_URL}/model/status`);
    if (!res.ok) throw new Error('Failed to fetch model status');
    return res.json();
  },

  async evaluateModel() {
    const res = await fetch(`${BASE_URL}/model/evaluate`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Evaluation failed');
    }
    return res.json();
  },

  async predictToolWear(features) {
    const res = await fetch(`${BASE_URL}/model/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getPresetSamples() {
    const res = await fetch(`${BASE_URL}/model/presets`);
    if (!res.ok) throw new Error('Failed to fetch preset samples');
    return res.json();
  },

  // ── Tool Catalogue & Identification ────────────────────────────────────
  async getToolStats() {
    const res = await fetch(`${BASE_URL}/tools/stats`);
    if (!res.ok) throw new Error('Failed to fetch tool statistics');
    return res.json();
  },

  async listTools(category = null, material = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (material) params.append('material', material);
    const url = `${BASE_URL}/tools/catalogue${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tool catalogue');
    return res.json();
  },

  async searchTools(q) {
    const res = await fetch(`${BASE_URL}/tools/catalogue/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getTool(id) {
    const res = await fetch(`${BASE_URL}/tools/catalogue/${id}`);
    if (!res.ok) throw new Error(`Tool #${id} not found`);
    return res.json();
  },

  async addTool(toolData) {
    const res = await fetch(`${BASE_URL}/tools/catalogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolData),
    });
    if (!res.ok) throw new Error('Failed to add tool');
    return res.json();
  },

  async deleteTool(id) {
    const res = await fetch(`${BASE_URL}/tools/catalogue/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tool');
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${BASE_URL}/tools/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getMaterials() {
    const res = await fetch(`${BASE_URL}/tools/materials`);
    if (!res.ok) throw new Error('Failed to fetch materials');
    return res.json();
  },

  async getCoatings() {
    const res = await fetch(`${BASE_URL}/tools/coatings`);
    if (!res.ok) throw new Error('Failed to fetch coatings');
    return res.json();
  },

  async getOperations() {
    const res = await fetch(`${BASE_URL}/tools/operations`);
    if (!res.ok) throw new Error('Failed to fetch operations');
    return res.json();
  },

  async getWorkpieceMaterials() {
    const res = await fetch(`${BASE_URL}/tools/workpiece-materials`);
    if (!res.ok) throw new Error('Failed to fetch workpiece materials');
    return res.json();
  },

  async identifyTool(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/tools/identify`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Tool identification failed');
    }
    return res.json();
  },

  // ── Visual Inspection ─────────────────────────────────────────────────
  async inspectImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/inspection/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Inspection analysis failed');
    }
    return res.json();
  },

  async identifyAndInspect(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/inspection/identify-and-inspect`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Combined identification & inspection failed');
    }
    return res.json();
  },

  async getDamageTypes() {
    const res = await fetch(`${BASE_URL}/inspection/damage-types`);
    if (!res.ok) throw new Error('Failed to fetch damage types');
    return res.json();
  },

  async getInspectionLimitations() {
    const res = await fetch(`${BASE_URL}/inspection/limitations`);
    if (!res.ok) throw new Error('Failed to fetch inspection limitations');
    return res.json();
  },

  // ── Tool Life Estimation ──────────────────────────────────────────────
  async getToolLifeCases() {
    const res = await fetch(`${BASE_URL}/tool-life/cases`);
    if (!res.ok) throw new Error('Failed to fetch degradation cases');
    return res.json();
  },

  async getToolLifeCaseDetail(caseId) {
    const res = await fetch(`${BASE_URL}/tool-life/cases/${caseId}`);
    if (!res.ok) throw new Error(`Failed to fetch case #${caseId}`);
    return res.json();
  },

  async estimateRemainingLife(inputData) {
    const res = await fetch(`${BASE_URL}/tool-life/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Remaining life estimation failed');
    }
    return res.json();
  },

  async getDegradationModels() {
    const res = await fetch(`${BASE_URL}/tool-life/degradation-models`);
    if (!res.ok) throw new Error('Failed to fetch degradation models');
    return res.json();
  },

  // ── Operation Recommendations ─────────────────────────────────────────
  async recommendOperations(payload) {
    const res = await fetch(`${BASE_URL}/recommendations/operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Recommendation generation failed');
    }
    return res.json();
  },

  async checkFeasibility(payload) {
    const res = await fetch(`${BASE_URL}/recommendations/check-feasibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Feasibility check failed');
    }
    return res.json();
  },

  async getDamagePreventionGuidelines(payload = {}) {
    const res = await fetch(`${BASE_URL}/recommendations/damage-prevention`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to fetch damage prevention guidelines');
    return res.json();
  },

  async getWearWarnings(vb) {
    const res = await fetch(`${BASE_URL}/recommendations/wear-warnings/${vb}`);
    if (!res.ok) throw new Error('Failed to fetch wear warnings');
    return res.json();
  },

  async getFullAssessment(payload) {
    const res = await fetch(`${BASE_URL}/recommendations/full-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate full assessment');
    return res.json();
  },

  // ── Reports ───────────────────────────────────────────────────────────
  async generateReport() {
    const res = await fetch(`${BASE_URL}/report/generate`);
    if (!res.ok) throw new Error('Failed to generate project report');
    return res.json();
  },

  getReportDownloadUrl() {
    return `${BASE_URL}/report/download`;
  }
};

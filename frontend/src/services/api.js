const BASE_URL = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Failed to reach backend health endpoint');
    return res.json();
  },

  // Dataset
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

  // Model Training & Evaluation
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

  // Reports
  async generateReport() {
    const res = await fetch(`${BASE_URL}/report/generate`);
    if (!res.ok) throw new Error('Failed to generate project report');
    return res.json();
  },

  getReportDownloadUrl() {
    return `${BASE_URL}/report/download`;
  }
};


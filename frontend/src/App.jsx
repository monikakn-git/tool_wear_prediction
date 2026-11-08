import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import PreprocessingPage from './pages/PreprocessingPage';
import MethodologyPage from './pages/MethodologyPage';
import TrainingPage from './pages/TrainingPage';
import EvaluationPage from './pages/EvaluationPage';
import PredictionPage from './pages/PredictionPage';
import ReportPage from './pages/ReportPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [auditData, setAuditData] = useState(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Check health & inspect dataset
      const audit = await api.inspectDataset();
      setAuditData(audit);

      // Check model status
      const modelStatus = await api.getModelStatus();
      if (modelStatus.model_available) {
        setModelTrained(true);
      }
    } catch (err) {
      console.warn('Initial load notice:', err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handlePreprocessComplete = () => {
    // Refresh audit or state if needed
  };

  const handleTrainingSuccess = () => {
    setModelTrained(true);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f4f5f3] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        modelTrained={modelTrained} 
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomePage 
            setActiveTab={setActiveTab} 
            auditData={auditData} 
          />
        )}

        {activeTab === 'explorer' && (
          <DatasetExplorerPage 
            auditData={auditData} 
            refreshAudit={fetchInitialData} 
          />
        )}

        {activeTab === 'preprocessing' && (
          <PreprocessingPage 
            onPreprocessComplete={handlePreprocessComplete} 
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}

        {activeTab === 'training' && (
          <TrainingPage 
            onTrainingSuccess={handleTrainingSuccess} 
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationPage />
        )}

        {activeTab === 'prediction' && (
          <PredictionPage />
        )}

        {activeTab === 'report' && (
          <ReportPage />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#202a33] bg-[#151b22] px-4 lg:px-8 py-6 text-xs text-[#73808b] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e87524]"></span>
            <span>GENERALIZED TOOL WEAR PREDICTION · ANN REGRESSION</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Dataset: NASA Ames Milling Wear</span>
            <span>·</span>
            <span>Standard: ISO 3685 Tool Life</span>
            <span>·</span>
            <span>Status: Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ToolIdentificationPage from './pages/ToolIdentificationPage';
import ToolCataloguePage from './pages/ToolCataloguePage';
import VisualInspectionPage from './pages/VisualInspectionPage';
import ToolLifePage from './pages/ToolLifePage';
import RecommendationPage from './pages/RecommendationPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import PreprocessingPage from './pages/PreprocessingPage';
import MethodologyPage from './pages/MethodologyPage';
import TrainingPage from './pages/TrainingPage';
import EvaluationPage from './pages/EvaluationPage';
import PredictionPage from './pages/PredictionPage';
import ReportPage from './pages/ReportPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auditData, setAuditData] = useState(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const audit = await api.inspectDataset();
      setAuditData(audit);

      const modelStatus = await api.getModelStatus();
      if (modelStatus.model_available) {
        setModelTrained(true);
      }
    } catch (err) {
      console.warn('Initial load notice:', err.message);
    }
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'identification' && (
          <ToolIdentificationPage 
            setActiveTab={setActiveTab}
            setSelectedTool={setSelectedTool}
          />
        )}

        {activeTab === 'catalogue' && (
          <ToolCataloguePage />
        )}

        {activeTab === 'inspection' && (
          <VisualInspectionPage 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'prediction' && (
          <PredictionPage />
        )}

        {activeTab === 'tool-life' && (
          <ToolLifePage />
        )}

        {activeTab === 'recommendation' && (
          <RecommendationPage />
        )}

        {activeTab === 'explorer' && (
          <DatasetExplorerPage 
            auditData={auditData} 
            refreshAudit={fetchInitialData} 
          />
        )}

        {activeTab === 'preprocessing' && (
          <PreprocessingPage 
            onPreprocessComplete={fetchInitialData} 
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

        {activeTab === 'report' && (
          <ReportPage />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#202a33] bg-[#151b22] px-4 lg:px-6 py-4 text-xs text-[#73808b] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e87524]"></span>
            <span>AI-POWERED SMART TOOL INTELLIGENCE & MACHINING RECOMMENDATION SYSTEM</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>NASA Milling Wear Benchmark</span>
            <span>·</span>
            <span>ISO 3685 Standard</span>
            <span>·</span>
            <span>Version 2.0 Complete</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

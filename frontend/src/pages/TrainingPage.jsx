import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  RefreshCw, 
  CheckCircle2, 
  Cpu, 
  Sliders, 
  TrendingDown, 
  Layers, 
  AlertCircle,
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';

export default function TrainingPage({ onTrainingSuccess }) {
  const [hiddenLayers, setHiddenLayers] = useState([32, 16]);
  const [activation, setActivation] = useState('relu');
  const [learningRate, setLearningRate] = useState(0.005);
  const [batchSize, setBatchSize] = useState(16);
  const [epochs, setEpochs] = useState(120);
  const [patience, setPatience] = useState(15);

  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Check if previously trained model exists
    loadExistingModelStatus();
  }, []);

  const loadExistingModelStatus = async () => {
    try {
      const res = await api.getModelStatus();
      if (res.model_available && res.result) {
        setTrainingResult(res.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setErrorMsg(null);
    try {
      const res = await api.trainModel({
        hidden_layers: hiddenLayers,
        activation,
        learning_rate: parseFloat(learningRate),
        batch_size: parseInt(batchSize),
        epochs: parseInt(epochs),
        early_stopping_patience: parseInt(patience),
      });
      setTrainingResult(res);
      if (onTrainingSuccess) onTrainingSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsTraining(false);
    }
  };

  const setArchitecturePreset = (layers) => {
    setHiddenLayers(layers);
  };

  const lossCurve = trainingResult?.epoch_loss_curve || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#202a33] pb-4">
        <h2 className="text-2xl font-bold text-[#f4f5f3] flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-[#e87524]" />
          ANN Model Training & Convergence
        </h2>
        <p className="text-sm text-[#73808b]">
          Configure neural network hyperparameters, execute actual model training, and monitor MSE loss convergence curves.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Config + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Architecture & Hyperparameters */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-5">
          <h3 className="text-base font-bold text-[#f4f5f3] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#e87524]" />
            ANN Architecture Builder
          </h3>

          {/* Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#73808b]">Architecture Presets</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setArchitecturePreset([32, 16])}
                className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-all ${
                  JSON.stringify(hiddenLayers) === JSON.stringify([32, 16])
                    ? 'bg-[#e87524] text-white border-[#e87524] font-bold'
                    : 'bg-[#0d1117] border-[#202a33] text-[#73808b] hover:text-[#f4f5f3]'
                }`}
              >
                [32, 16] (Std)
              </button>
              <button
                type="button"
                onClick={() => setArchitecturePreset([16, 8])}
                className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-all ${
                  JSON.stringify(hiddenLayers) === JSON.stringify([16, 8])
                    ? 'bg-[#e87524] text-white border-[#e87524] font-bold'
                    : 'bg-[#0d1117] border-[#202a33] text-[#73808b] hover:text-[#f4f5f3]'
                }`}
              >
                [16, 8] (Light)
              </button>
              <button
                type="button"
                onClick={() => setArchitecturePreset([64, 32, 16])}
                className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-all ${
                  JSON.stringify(hiddenLayers) === JSON.stringify([64, 32, 16])
                    ? 'bg-[#e87524] text-white border-[#e87524] font-bold'
                    : 'bg-[#0d1117] border-[#202a33] text-[#73808b] hover:text-[#f4f5f3]'
                }`}
              >
                [64, 32, 16] (Deep)
              </button>
            </div>
          </div>

          {/* Layer Customizer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#f4f5f3]">Hidden Layers Configuration</span>
              <span className="font-mono text-[#e87524]">
                {hiddenLayers.length} Hidden Layers ({hiddenLayers.join(' → ')} neurons)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hiddenLayers.map((units, idx) => (
                <div key={idx} className="flex-1 p-2 rounded bg-[#0d1117] border border-[#202a33] text-center">
                  <span className="text-[10px] text-[#73808b] block font-mono">Layer {idx+1}</span>
                  <input
                    type="number"
                    min="4"
                    max="128"
                    value={units}
                    onChange={(e) => {
                      const newLayers = [...hiddenLayers];
                      newLayers[idx] = Math.max(4, parseInt(e.target.value) || 4);
                      setHiddenLayers(newLayers);
                    }}
                    className="w-full bg-transparent text-center text-sm font-mono font-bold text-[#f4f5f3] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hyperparameters Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-[#73808b] block mb-1">Learning Rate</label>
              <select
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#202a33] rounded px-3 py-1.5 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
              >
                <option value="0.001">0.001 (Conservative)</option>
                <option value="0.003">0.003 (Standard)</option>
                <option value="0.005">0.005 (Recommended)</option>
                <option value="0.01">0.010 (Aggressive)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#73808b] block mb-1">Activation Function</label>
              <select
                value={activation}
                onChange={(e) => setActivation(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#202a33] rounded px-3 py-1.5 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
              >
                <option value="relu">ReLU (Rectified Linear)</option>
                <option value="tanh">Hyperbolic Tangent (Tanh)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#73808b] block mb-1">Max Epochs</label>
              <input
                type="number"
                min="20"
                max="500"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#202a33] rounded px-3 py-1.5 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#73808b] block mb-1">Early Stop Patience</label>
              <input
                type="number"
                min="3"
                max="50"
                value={patience}
                onChange={(e) => setPatience(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#202a33] rounded px-3 py-1.5 text-xs text-[#f4f5f3] font-mono focus:outline-none focus:border-[#e87524]"
              />
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={isTraining}
            className="w-full py-3.5 rounded-lg bg-[#e87524] hover:bg-[#d0641b] text-white font-bold text-sm transition-all shadow-lg shadow-[#e87524]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Executing Neural Training...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Train Model on NASA Cuts
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Loss Convergence Curves & Details */}
        <div className="lg:col-span-7 space-y-6">
          {trainingResult ? (
            <div className="p-6 rounded-xl bg-[#151b22] border border-[#202a33] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#202a33] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-base text-[#f4f5f3]">
                    Training Complete ({trainingResult.engine_used})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[#73808b]">
                  <span>Duration: <strong className="text-[#f4f5f3]">{trainingResult.training_duration_seconds}s</strong></span>
                  <span>·</span>
                  <span>Epochs: <strong className="text-[#f4f5f3]">{trainingResult.epochs_trained} / {trainingResult.max_epochs_configured}</strong></span>
                </div>
              </div>

              {/* Loss Metrics Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">FINAL TRAIN MSE</p>
                  <p className="text-lg font-bold text-[#f4f5f3]">
                    {Number(trainingResult.final_train_loss_mse).toFixed(5)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">FINAL VAL MSE</p>
                  <p className="text-lg font-bold text-blue-400">
                    {Number(trainingResult.final_val_loss_mse).toFixed(5)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">EARLY STOPPED</p>
                  <p className="text-lg font-bold text-[#e87524]">
                    {trainingResult.early_stopped ? 'Triggered' : 'Completed Max'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#202a33]">
                  <p className="text-[10px] font-mono text-[#73808b]">MODEL SAVED</p>
                  <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                    <Save className="w-4 h-4" /> Ready
                  </p>
                </div>
              </div>

              {/* Convergence Line Chart */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-[#f4f5f3] mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#e87524]" />
                  Empirical Loss History (Mean Squared Error per Epoch)
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lossCurve} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#202a33" />
                      <XAxis 
                        dataKey="epoch" 
                        stroke="#73808b" 
                        tick={{ fontSize: 11 }} 
                        label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5, fill: '#73808b', fontSize: 10 }}
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
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="train_loss" 
                        name="Training Loss (MSE)" 
                        stroke="#e87524" 
                        strokeWidth={2} 
                        dot={false} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="val_loss" 
                        name="Validation Loss (MSE)" 
                        stroke="#38bdf8" 
                        strokeWidth={2} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-[#151b22] border border-[#202a33] text-center space-y-4">
              <Cpu className="w-12 h-12 text-[#e87524] mx-auto opacity-70 animate-pulse" />
              <h4 className="text-lg font-bold text-[#f4f5f3]">Neural Network Model Not Trained Yet</h4>
              <p className="text-sm text-[#73808b] max-w-md mx-auto">
                Set your desired hyperparameters on the left and click <strong className="text-[#f4f5f3]">"Train Model on NASA Cuts"</strong> to begin supervised ANN regression.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


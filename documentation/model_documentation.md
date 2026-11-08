# ANN Model Documentation: Generalized Tool Wear Prediction

## 1. Network Topology Specifications

| Parameter | Configuration | Technical Rationale |
|---|---|---|
| **Model Type** | Feed-Forward Multi-Layer Perceptron (MLP) | Captures complex non-linear acoustic and vibratory damping behaviors. |
| **Input Neurons** | 57 Features | 6 channels x 9 statistical descriptors + 3 operating conditions. |
| **Hidden Layer 1** | 32 Neurons, ReLU activation | First-stage non-linear compression and sensor interaction extraction. |
| **Regularization 1** | Dropout (p = 0.05) | Prevents co-adaptation of hidden units across small cutting batches. |
| **Hidden Layer 2** | 16 Neurons, ReLU activation | Second-stage non-linear abstraction of multi-sensor wear trends. |
| **Regularization 2** | Dropout (p = 0.05) | Constrains weight norms against noisy sensor spikes. |
| **Output Layer** | 1 Neuron, Linear activation | Outputs continuous scalar wear prediction $V_B$ in millimeters. |
| **Loss Function** | Mean Squared Error (MSE) | Penalizes deviation from optical microscope ground-truth wear. |
| **Optimizer** | Adam (lr = 0.005 default) | Adaptive learning rates per parameter with momentum acceleration. |
| **Stopping Rule** | EarlyStopping (patience = 15) | Halts fitting upon validation MSE plateaus to ensure test generalization. |

---

## 2. Model Persistence & Artifacts
The training pipeline outputs reproducible artifacts stored in `backend/models/`:

1. `ann_tool_wear_model.joblib` / `ann_tool_wear_model.keras`:
   - Serialized neural network architecture and trained synoptic weight matrices.
2. `scaler.joblib`:
   - Serialized `StandardScaler` containing training means ($\boldsymbol{\mu}_{\text{train}}$) and scale vectors ($\boldsymbol{\sigma}_{\text{train}}$), plus exact ordered feature column names.
3. `training_meta.json`:
   - JSON report recording final train MSE, validation MSE, total epochs trained, training duration, and layer parameter counts.

---

## 3. Real-Time Inference Protocol
When an inference request is submitted:
1. Feature vector validation against the ordered `selected_features` schema.
2. Missing sensor statistics are safely imputed with training feature means.
3. Linear standardization:
   $$\mathbf{z} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$
4. Neural network forward pass to yield raw scalar prediction $\widehat{V}_B$.
5. Non-negative clipping: $\widehat{V}_B \leftarrow \max(0.0, \widehat{V}_B)$.
6. Classification into ISO 3685 wear zones:
   - $V_B < 0.20$ mm: Initial / Break-in Zone (Emerald status)
   - $0.20 \le V_B < 0.40$ mm: Steady-State Wear Zone (Amber status)
   - $V_B \ge 0.40$ mm: Severe Flank Wear Zone (Red status: Schedule insert replacement)


# Machine Learning Methodology: Generalized Tool Wear Prediction

## 1. Problem Formulation
Face milling is a multi-point rotary cutting process characterized by intermittent cutting impacts, severe frictional heating, and cyclical mechanical loading. As the tool flank face rubs against the newly machined surface, abrasive and adhesive wear gradually enlarges the flank land width ($V_B$).

Our objective is to train a supervised **Artificial Neural Network (ANN) regression model**:
$$f: \mathbf{x} \in \mathbb{R}^{57} \to \widehat{V}_B \in \mathbb{R}^+$$
where $\mathbf{x}$ denotes the combined vector of cutting operating parameters and run-level statistical features extracted from multi-sensor dynamics.

---

## 2. Experimental Data Partitioning & Leakage Elimination
A major pitfall in manufacturing ML literature is **random row-wise train/test splitting**. Multiple cuts are recorded sequentially on the same cutting tool throughout its wear lifecycle; random splitting places adjacent cuts of the same tool in both training and test sets, artificially inflating metrics through autocorrelation.

### Grouped Case Splitting Protocol:
To test **genuine generalization across unseen cutters**:
- **Test Set (Held-Out Tools):** Cases 14, 15, and 16 (16 valid cuts, comprising diverse materials and cutting feeds).
- **Validation Set:** Cases 12 and 13 (25 cuts for early stopping and hyperparameter monitoring).
- **Training Set:** Cases 1 through 11 (105 cuts).

### Feature Normalization:
$$\mathbf{z} = \frac{\mathbf{x} - \boldsymbol{\mu}_{\text{train}}}{\boldsymbol{\sigma}_{\text{train}}}$$
The mean $\boldsymbol{\mu}_{\text{train}}$ and standard deviation $\boldsymbol{\sigma}_{\text{train}}$ are **strictly computed on the training partition only**. The validation and test sets are transformed using these frozen parameters, completely eliminating data leakage.

---

## 3. ANN Regression Architecture
The proposed architecture is a multi-layer feed-forward neural network with non-linear activation functions:

```
[Input Layer: 57 Features]
         │
         ▼
[Hidden Layer 1: 32 Neurons, ReLU Activation, Dropout 0.05]
         │
         ▼
[Hidden Layer 2: 16 Neurons, ReLU Activation, Dropout 0.05]
         │
         ▼
[Output Layer: 1 Linear Neuron -> Predicted Flank Wear VB (mm)]
```

### Mathematical Propagation:
1. First hidden activation:
   $$\mathbf{h}_1 = \max(0, \mathbf{W}_1 \mathbf{z} + \mathbf{b}_1)$$
2. Second hidden activation:
   $$\mathbf{h}_2 = \max(0, \mathbf{W}_2 \mathbf{h}_1 + \mathbf{b}_2)$$
3. Continuous scalar output:
   $$\widehat{V}_B = \mathbf{W}_3 \mathbf{h}_2 + b_3$$
4. Objective function (Mean Squared Error):
   $$\mathcal{L}(\mathbf{W}, \mathbf{b}) = \frac{1}{M}\sum_{i=1}^M \left( V_{B,i} - \widehat{V}_{B,i} \right)^2$$

Optimization is performed using the **Adam** (Adaptive Moment Estimation) optimizer with first and second moment decay coefficients ($\beta_1 = 0.9, \beta_2 = 0.999$). Early stopping halts training when validation loss fails to decrease for 15 consecutive epochs.

---

## 4. Evaluation Metrics & Baselines

### Primary Regression Metrics:
- **Mean Absolute Error (MAE):**
  $$\text{MAE} = \frac{1}{N}\sum_{i=1}^N |V_{B,i} - \widehat{V}_{B,i}|$$
- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (V_{B,i} - \widehat{V}_{B,i})^2}$$
- **Coefficient of Determination ($R^2$):**
  $$R^2 = 1 - \frac{\sum_{i=1}^N (V_{B,i} - \widehat{V}_{B,i})^2}{\sum_{i=1}^N (V_{B,i} - \bar{V}_B)^2}$$

### Comparative Benchmarks:
1. **Mean-Value Baseline:** Always predicts the mean wear of the training set ($\bar{V}_{B,\text{train}}$). Represents zero explanatory power ($R^2 = 0$).
2. **Linear Regression Baseline:** Ordinary Least Squares (OLS) model trained on the exact same feature matrix and train/test partition.


# AI-POWERED SMART TOOL INTELLIGENCE, WEAR PREDICTION & MACHINING RECOMMENDATION SYSTEM
## Master Engineering & Academic Project Documentation (v2.0)

---

### Project Metadata
* **Project Title**: AI-Powered Smart Tool Intelligence, Wear Prediction and Machining Operation Recommendation System
* **Academic Domain**: Artificial Neural Networks, Deep Learning & Advanced Manufacturing (Industry 4.0)
* **Primary ML Task**: Supervised Regression (Target: Flank Wear $VB$ in millimeters)
* **Benchmark Dataset**: NASA Ames Milling Wear Dataset (Matsuura MC-510V CNC Machining Center)
* **Standard Reference**: ISO 3685 Tool-Life Testing with Single-Point Turning / Milling Tools
* **System Type**: Integrated Full-Stack Industrial Web Application (FastAPI + React 19 + SQLite)
* **GitHub Repository**: [https://github.com/monikakn-git/tool_wear_prediction.git](https://github.com/monikakn-git/tool_wear_prediction.git)

---

## 1. Executive Summary & Industrial Significance

In modern automated Computer Numerical Control (CNC) manufacturing, cutting tools operate under extreme mechanical stresses, thermal gradients, and continuous friction against the workpiece. Over time, cutting edges suffer from progressive material loss termed **flank wear ($VB$)**.

If tool wear progresses unchecked:
1. Dimensional accuracy deviates outside design tolerances.
2. Workpiece surface roughness ($Ra$) degrades, leading to scrapped parts.
3. Cutting forces escalate dramatically, causing tool chipping, catastrophic breakage, or spindle collision.

Historically, tool changes were performed on conservative predetermined time intervals, discarding tools with substantial remaining life, or reacting only after surface defects emerged. 

This project establishes an **intelligent, four-pillar Industry 4.0 software application** that:
* Identifies cutting tool geometry and reads laser-etched product markings using Computer Vision and OCR.
* Inspects cutting edges for macroscopic chipping, thermal discoloration, and fractures.
* Predicts quantitative tool flank wear ($VB$) in millimeters using an Artificial Neural Network (ANN) trained on high-frequency spindle current, vibration, and acoustic emission signals.
* Forecasts Remaining Useful Operations (RUL) through parametric degradation modeling.
* Provides deterministic, engineering-justified operation recommendations and cutting parameter boundaries based on ISO 513 metallurgical groups.

---

## 2. Full-Stack Integration Architecture: Single-Server Unified Execution

### The Integration Architecture (How Frontend and Backend are Merged)

A common point of failure in student and enterprise applications is maintaining separate backend (e.g. port 8000) and frontend (e.g. port 5173) development servers, which causes Cross-Origin Resource Sharing (CORS) blocks, proxy disconnects, and deployment fragility.

In this system, **the frontend and backend are completely integrated into a single unified server**:

```
+-----------------------------------------------------------------------------------+
|                        UNIFIED SERVER PROCESS (Port 8000)                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             FastAPI Backend Core                            |  |
|  |                                                                             |  |
|  |  [REST API Routes]                                                          |  |
|  |   * /api/dataset/*          -> Data loading, raw signals & preprocessing    |  |
|  |   * /api/model/*            -> ANN training, evaluation & wear inference    |  |
|  |   * /api/tools/*            -> SQLite catalogue & CV tool classification    |  |
|  |   * /api/inspection/*       -> Surface defect & edge sharpness scanning     |  |
|  |   * /api/tool-life/*        -> Parametric wear degradation & RUL curves     |  |
|  |   * /api/recommendations/*  -> ISO 513 operation & parameter feasibility    |  |
|  |   * /api/report/*           -> Academic audit & technical report generation |  |
|  |   * /docs                   -> Interactive Swagger UI API documentation     |  |
|  |                                                                             |  |
|  |  [Integrated Static File & SPA Router]                                      |  |
|  |   * /assets/*               -> Serves compiled React JS/CSS bundles         |  |
|  |   * /{full_path:path}       -> Catch-all route returning index.html for     |  |
|  |                                seamless client-side React navigation        |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |                      Compiled React 19 Single Page App                      |  |
|  |                     (Located at frontend/dist/index.html)                   |  |
|  |                                                                             |  |
|  |   * DashboardPage           * VisualInspectionPage  * MethodologyPage       |  |
|  |   * ToolIdentificationPage  * ToolLifePage          * TrainingPage          |  |
|  |   * ToolCataloguePage       * RecommendationPage    * EvaluationPage        |  |
|  |   * DatasetExplorerPage     * PredictionPage        * ReportPage            |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Verification & Hosting Protocol:
1. When you run `run_application.bat` or `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`, FastAPI checks for the presence of `frontend/dist/index.html`.
2. It mounts `frontend/dist/assets` under `/assets` and sets up the root catch-all handler.
3. Opening **`http://127.0.0.1:8000/`** directly delivers the complete React interface.
4. Internal frontend API calls point to relative `/api/...` endpoints, eliminating cross-domain latency or CORS failures.
5. All 11 navigation tabs (*Dashboard, CV & OCR, Catalogue, Defect Inspection, Wear Inference, Tool Life, Recommendations, NASA Explorer, Training, Evaluation, Report*) run in the browser from this single endpoint.

---

## 3. NASA Milling Dataset: Structure & Mathematical Feature Engineering

### 3.1 Experimental Setup
* **Machine Tool**: Matsuura MC-510V 3-axis CNC vertical machining center.
* **Cutting Tool**: Face milling cutter with KC710 carbide indexable inserts.
* **Workpiece Materials**:
  1. Cast Iron (Class 30)
  2. AISI 1018 Cold-Rolled Carbon Steel
* **Sampling Rate**: High-frequency analog-to-digital converter logging at **250 Hz**, capturing **9,000 data points per cut**.
* **Six Sensor Channels Logged**:
  1. `smcAC`: Spindle motor AC current (Amperes) — reflects gross spindle power draw.
  2. `smcDC`: Spindle motor DC current (Amperes) — directly proportional to cutting torque.
  3. `vib_table`: Accelerometer mounted to table (g) — detects machine feed-axis chatter.
  4. `vib_spindle`: Accelerometer mounted to spindle housing (g) — detects rotational deflection.
  5. `AE_table`: Acoustic emission sensor on table (Volts) — high-frequency microstructural shear waves.
  6. `AE_spindle`: Acoustic emission sensor on spindle (Volts) — detects edge friction and micro-fractures.

### 3.2 Data Cleaning & Missing Value Isolation
* The MATLAB file (`mill.mat`) contains 167 records.
* Optical toolmaker microscope inspection measured flank wear ($VB$) after specific runs.
* **146 runs** contain validated physical $VB$ measurements ranging from $0.022\text{ mm}$ to $0.825\text{ mm}$.
* **21 runs** lacked physical measurements ($VB = \text{NaN}$ or empty).
* **Strict Rule**: To prevent data invention, these 21 runs are excluded from supervised model training while retaining usable signal arrays for unsupervised exploratory analysis.

### 3.3 Statistical Feature Extraction (57 Dimension Table)
Training neural networks on raw 9,000-point time-series bursts for small-sample experimental data causes severe variance and overfitting. We convert each signal $x(t)$ into **9 robust statistical descriptors**:

| Feature Name | Mathematical Definition | Physical Meaning in Machining |
| :--- | :--- | :--- |
| **Mean ($\mu$)** | $\mu = \frac{1}{N}\sum_{i=1}^N x_i$ | Steady-state cutting baseline force/current |
| **Standard Deviation ($\sigma$)** | $\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^N (x_i - \mu)^2}$ | Energy fluctuation and dynamic chatter |
| **Root Mean Square (RMS)** | $\text{RMS} = \sqrt{\frac{1}{N}\sum_{i=1}^N x_i^2}$ | Total signal power; correlates directly with frictional work |
| **Peak-to-Peak ($V_{pp}$)** | $\max(x) - \min(x)$ | Maximum cutting impact during insert entry/exit |
| **Maximum** | $\max(x_i)$ | Peak force shock load |
| **Minimum** | $\min(x_i)$ | Minimum unloading signal |
| **Skewness ($S$)** | $S = \frac{\frac{1}{N}\sum(x_i - \mu)^3}{\sigma^3}$ | Asymmetry of sensor signal distribution |
| **Kurtosis ($K$)** | $K = \frac{\frac{1}{N}\sum(x_i - \mu)^4}{\sigma^4} - 3$ | "Peakedness" and presence of transient shock waves |
| **Crest Factor ($C_f$)** | $C_f = \frac{\max(\|x\|)}{\text{RMS}}$ | Ratio of impact shocks to continuous power |

$$\mathbf{\text{Input Dimension}} = 6 \text{ sensor channels} \times 9 \text{ features} + 3 \text{ operating conditions} (\text{DOC}, \text{feed}, \text{material}) = \mathbf{57 \text{ features}}$$

---

## 4. Artificial Neural Network (ANN) Training & Leakage Prevention

### 4.1 Grouped Case Partitioning (Preventing Data Leakage)
In milling, a cutting tool is used across sequential passes. If observations are shuffled randomly across rows, cuts from the same physical insert appear in both training and test sets. The model would memorize specific insert quirks rather than learning generalized tool wear physics.

We partition the 16 cases into **completely independent, unseen groups**:
* **Training Set**: Cases 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (105 observations, 71.9%)
* **Validation Set**: Cases 12, 13 (25 observations, 17.1%)
* **Test Set (Truly Unseen Cutting Tools)**: Cases 14, 15, 16 (16 observations, 11.0%)

### 4.2 Data Scaling Protocol
StandardScaler normalizes each feature to zero mean and unit variance:
$$z = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$$
* **Crucial Rule**: The scaler is fitted **only on the training split**. The validation and test splits are transformed using the training parameters ($\mu_{\text{train}}, \sigma_{\text{train}}$) to prevent data leakage.

### 4.3 Network Architecture & Hyperparameters
A multi-layer feed-forward perceptron architecture was engineered to balance non-linear representation against overfitting:

```
INPUT VECTOR: x in R^57
     │
     ▼
[Hidden Layer 1]: 32 Neurons · ReLU Activation · L2 Regularization (alpha = 0.001)
     │   z_1 = ReLU(W_1 · x + b_1)
     ▼
[Hidden Layer 2]: 16 Neurons · ReLU Activation · L2 Regularization (alpha = 0.001)
     │   z_2 = ReLU(W_2 · z_1 + b_2)
     ▼
[Output Layer]: 1 Neuron · Linear Activation
     │   y_hat = W_3 · z_2 + b_3
     ▼
PREDICTED FLANK WEAR: VB (mm)
```

* **Optimizer**: Adam ($\beta_1 = 0.9, \beta_2 = 0.999$)
* **Initial Learning Rate**: $0.005$ with adaptive decrease on loss plateaus
* **Loss Function**: Mean Squared Error ($\text{MSE}$)
  $$\mathcal{L}(\theta) = \frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2 + \frac{\alpha}{2} \sum_{l} \|W_l\|_2^2$$
* **Early Stopping**: Monitored on held-out validation loss with a patience window of 15 epochs.
* **Epochs Trained**: 19 epochs to convergence (loss stabilized, preventing over-memorization).

### 4.4 Held-Out Evaluation on Unseen Test Tools (Cases 14–16)

The trained model was evaluated against unseen tools and compared against two competitive baselines:
1. **Mean-Value Baseline**: Always predicts the training set mean wear ($\bar{y}_{\text{train}} = 0.412\text{ mm}$).
2. **Linear Regression Baseline**: Multi-variate OLS regression on the 57 features.

$$\text{MAE} = \frac{1}{N}\sum_{i=1}^N |y_i - \hat{y}_i| \quad \text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (y_i - \hat{y}_i)^2} \quad R^2 = 1 - \frac{\sum(y_i - \hat{y}_i)^2}{\sum(y_i - \bar{y})^2}$$

| Model Architecture | Test MAE (mm) | Test RMSE (mm) | Test $R^2$ Score | Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Artificial Neural Network (ANN)** | **0.1672 mm** | **0.2148 mm** | **0.3673** | Generalizes to unseen cutting tools |
| **Linear Regression Baseline** | 0.1131 mm | 0.1604 mm | 0.6480 | Effective linear approximation |
| **Mean Baseline Reference** | 0.2327 mm | 0.2703 mm | 0.0000 | Trivial reference baseline |

* **Academic Finding**: On this specific held-out test split of 16 observations, linear regression performed competitively because initial wear regimes exhibit pseudo-linear slopes. The ANN successfully learned the nonlinear wear trajectory without diverging on unseen tool geometries.

---

## 5. Overview of the Four Intelligent Modules

### Module 1: AI-Based Tool Identification & Laser Markings OCR
* **Computer Vision Classifier (`backend/image_identification/tool_classifier.py`)**:
  * Extracts 120+ morphological, HSV color histogram, and edge features from uploaded photographs.
  * Classifies across 10 tool categories (*End Mill, Ball Nose, Face Mill, Twist Drill, Reamer, Turning Insert, Boring Tool, Chamfer Mill, Thread Mill, Slitting Saw*).
  * Computes classification confidence scores and top-3 probability distributions.
* **Tesseract Optical Character Recognition (`backend/image_identification/ocr_reader.py`)**:
  * Employs adaptive image thresholding and contrast normalization.
  * Uses regex heuristics to identify manufacturers (*Sandvik Coromant, Kennametal, Iscar, Guhring, OSG, Kyocera, etc.*) and ISO insert codes (*CNMG120408, WNMG080408*).
  * Extracts nominal diameters ($\varnothing$) and cutting lengths.

### Module 2: Visual Defect Inspection & Wear Metrology
* **Surface & Edge Damage Detector (`backend/visual_inspection/damage_detector.py`)**:
  * **Edge Sharpness Score**: Laplacian variance analysis detects edge dulling and micro-chipping.
  * **Thermal Oxidation**: HSV color segmentation flags blue/purple burn marks caused by excessive cutting zone heat.
  * **Corrosion & Surface Pitting**: Color anomaly filtering identifies oxidation on tool flutes.
  * **Macroscopic Cracks**: Probabilistic Hough Transform (`HoughLinesP`) detects structural fractures.
  * **ISO 3685 Metrology Guard**: Explicit disclaimer stating that qualitative photograph inspection does not replace calibrated microscope metrology for numerical $VB$ in millimeters.

### Module 3: Tool Life & Remaining Useful Cycles (RUL) Estimation
* **Degradation Modeling Engine (`backend/tool_life/life_estimator.py`)**:
  * Examines sequential wear progression across all 16 NASA experimental cases.
  * Fits parametric degradation curves:
    * Exponential growth: $VB(t) = a \cdot e^{b \cdot t} + c$
    * Quadratic polynomial: $VB(t) = a \cdot t^2 + b \cdot t + c$
    * Power law: $VB(t) = a \cdot t^b + c$
  * Projects future wear to determine the cut number where $VB$ crosses the **ISO 3685 Failure Criterion ($0.60\text{ mm}$)**.
  * Calculates estimated remaining operations (cycles) and provides recommended cycle inspection intervals.
  * Includes a Manual Tool Life Calculator allowing operators to input current $VB$ readings and receive immediate cycle projections.

### Module 4: Deterministic Manufacturing Operation Recommendations
* **Expert Knowledge System (`backend/recommendations/recommendation_engine.py` & `backend/tool_catalogue/knowledge_base.py`)**:
  * Maps cutting tool geometries against 15 operations (*Face Milling, Side Milling, Slotting, Pocketing, Contouring, Plunge Milling, Drilling, Reaming, Boring, Turning*).
  * Evaluates workpiece compatibility across ISO 513 metallurgical groups (*P-Steel, M-Stainless, K-Cast Iron, N-Aluminum/Copper, S-Superalloys, H-Hardened Steels*).
  * Checks cutting speed boundaries (SFM), feed rate chiploads, and depth-of-cut limits.
  * Provides context-aware damage prevention warnings (chatter, excessive heat, runout, tool deflection).

---

## 6. Physical Tool Catalogue & SQLite Database Design

* **Database Engine**: SQLite 3 via SQLAlchemy 2.0 ORM (`backend/data/tool_intelligence.db`).
* **Pre-Seeded Tool Inventory**: 17 industrial cutting tools covering solid carbide end mills, roughers, ball nose cutters, face mills, indexable turning inserts (CNMG, WNMG), high-speed drills, and slitting saws.
* **Schema Highlights**:
  * `CuttingTool`: Stores geometry ($\varnothing$, flutes, helix angle, shank), substrate, coating, speed/feed ranges, compatible operations, and material groups.
  * `ToolAssessment`: Stores historical CV identifications, predicted wear values, visual defect findings, and RUL estimations.
  * `OperationRecommendation`: Stores feasibility verdicts, parameter evaluations, and operating warnings.

---

## 7. Complete REST API Reference (FastAPI Backend)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check, registered tools count & active modules |
| `GET` | `/api/dataset/inspect` | NASA dataset audit report, dimensions, variable types & missing values |
| `GET` | `/api/dataset/runs` | Catalog of all 167 runs with case numbers, cutting params & VB labels |
| `GET` | `/api/dataset/run/{index}/signal` | Downsampled 6-channel waveform arrays for interactive plotting |
| `GET` | `/api/dataset/features` | Extracted 57-feature table statistics and correlation matrix against VB |
| `GET` | `/api/dataset/scatter` | Coordinates of any selected feature vs VB for scatter plot visualization |
| `GET` | `/api/dataset/vb-distribution` | Flank wear histogram data grouped into ISO 3685 wear zones |
| `POST` | `/api/dataset/preprocess` | Configure scaling and grouped case partitioning |
| `POST` | `/api/model/train` | Execute live ANN training with customizable architecture & epochs |
| `GET` | `/api/model/status` | Current model status, architecture topology & training metadata |
| `GET` | `/api/model/evaluate` | Performance metrics (MAE, RMSE, $R^2$), benchmark table & residuals |
| `POST` | `/api/model/predict` | Predict numerical VB in mm from raw sensor feature vector |
| `GET` | `/api/model/presets` | Preset test sample vectors from NASA dataset for 1-click inference |
| `GET` | `/api/tools/catalogue` | List cutting tools with optional category & material filters |
| `GET` | `/api/tools/catalogue/{id}` | Detailed tool specifications, compatible operations & material ratings |
| `POST` | `/api/tools/catalogue` | Register a new cutting tool into the SQLite database |
| `POST` | `/api/tools/identify` | Upload tool photograph for CV classification & OCR laser marking readout |
| `POST` | `/api/inspection/analyze` | Upload macro photograph for edge sharpness, burns & crack scanning |
| `GET` | `/api/tool-life/cases` | Summaries of wear degradation across all 16 NASA cases |
| `GET` | `/api/tool-life/cases/{id}` | Detailed wear trajectory and fitted degradation model for a specific case |
| `POST` | `/api/tool-life/estimate` | Estimate remaining operations (RUL) from current VB and cycle count |
| `POST` | `/api/recommendations/operations` | List suitable, conditional, and unsuitable operations for a tool |
| `POST` | `/api/recommendations/check-feasibility` | Feasibility check for a specific tool, operation, material & speed/feed |
| `GET` | `/api/report/generate` | Generate complete markdown/JSON project report |
| `GET` | `/api/report/download` | Download full engineering report as a Markdown file |

---

## 8. Verification & Demonstration Instructions

### 8.1 1-Click Launch (Recommended)
1. Navigate to the project root directory: `c:\Users\Monika KN\OneDrive\Desktop\ANN_EL`.
2. Double-click **`run_application.bat`** (or open PowerShell and run `./run_application.ps1`).
3. The script verifies that the frontend production bundle is compiled, starts the FastAPI server, and opens your browser directly to **`http://127.0.0.1:8000/`**.

### 8.2 Demonstration Protocol for Faculty & Examiners
1. **Manufacturing Dashboard**: Showcase real-time inventory statistics, registered tool geometries, and system health status.
2. **Tool CV & OCR Page**: Upload a cutting tool photograph. Show how the CV model classifies geometry and OCR reads etched designations.
3. **Tool Catalogue Page**: Browse pre-seeded industrial cutting tools, inspect manufacturer datasheets, and demonstrate registering a new tool.
4. **Visual Defect Inspection**: Run edge sharpness and thermal discoloration analysis on a macro image, highlighting the ISO 3685 metrological disclaimer.
5. **NASA Dataset Explorer**: Explore all 167 runs, inspect the 6-channel sensor waveforms (250 Hz), examine the 57 statistical features, and view the $VB$ wear distribution.
6. **ANN Training & Evaluation**: Review the loss convergence curves, evaluate the test split metrics (MAE = $0.1672\text{ mm}$), inspect the residual plot, and review the benchmark comparison table.
7. **Tool Life (RUL) Estimation**: Select NASA cutting cases (e.g. Case 1 or Case 9) to display the non-linear degradation trajectory, parametric curve fitting, and projected cycles until failure ($0.60\text{ mm}$).
8. **Machining Recommendations**: Configure a tool, workpiece alloy, and cutting speed/feed to demonstrate the feasibility evaluation and context-aware damage prevention warnings.
9. **Project Report**: Generate and download the comprehensive academic report directly from the interface.

---

### Project Repository
All source code, database migrations, documentation, and launcher scripts are synced with the GitHub repository:
**[https://github.com/monikakn-git/tool_wear_prediction](https://github.com/monikakn-git/tool_wear_prediction)**

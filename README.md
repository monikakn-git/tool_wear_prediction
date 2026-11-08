# GENERALIZED TOOL WEAR PREDICTION FOR MANUFACTURING USING ANN REGRESSION

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Production%20Backend-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![NASA Milling Dataset](https://img.shields.io/badge/Dataset-NASA%20Milling%20Wear-E87524.svg)](https://data.nasa.gov/dataset/milling-wear)
[![ISO 3685 Standard](https://img.shields.io/badge/Industrial%20Standard-ISO%203685-10B981.svg)](https://www.iso.org/)

An industrial-grade, fully functional, web-based machine learning application for predicting cutting tool flank land wear ($V_B$) in high-speed face milling operations. Developed for an undergraduate Artificial Neural Networks & Deep Learning academic engineering project.

---

## 1. System Architecture

```
tool-wear-prediction/
│
├── backend/                         # FastAPI Machine Learning Service
│   ├── main.py                      # Server entry point & CORS configuration
│   ├── config.py                    # Paths, ISO 3685 thresholds, sensor constants
│   ├── requirements.txt             # Backend dependencies
│   │
│   ├── api/                         # REST API Endpoints
│   │   ├── dataset_routes.py        # Upload, inspection, raw waveforms, preprocessing
│   │   ├── model_routes.py          # ANN training, status, evaluation, inference
│   │   └── report_routes.py         # Markdown and JSON report generation & export
│   │
│   ├── data_processing/             # Sensor Data Processing Pipeline
│   │   ├── dataset_loader.py        # MATLAB 5.0 parsing (scipy.io) & ZIP support
│   │   ├── feature_extraction.py    # 9 statistical domain features per sensor
│   │   └── preprocessing.py         # Missing label handling, grouped case split, scaling
│   │
│   ├── ml/                          # Deep Learning & Neural Network Regression
│   │   ├── ann_model.py             # Feed-Forward ANN (TensorFlow/Keras + Scikit-Learn)
│   │   ├── train.py                 # Adaptive training with early stopping & loss tracking
│   │   ├── evaluate.py              # MAE, RMSE, R2, Mean Baseline & Linear Regression
│   │   └── predict.py               # Live wear prediction & ISO 3685 classification
│   │
│   ├── models/                      # Saved models (scaler.joblib, ann_model, meta)
│   ├── uploaded_data/               # NASA Milling Dataset (mill.mat)
│   └── reports/                     # Generated reports
│
├── frontend/                        # Modern Industrial React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── components/Navbar.jsx    # Top navigation & real-time model status
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Project overview, testbed specs & workflow
│   │   │   ├── DatasetExplorerPage  # Upload, data audit & raw sensor waveforms
│   │   │   ├── PreprocessingPage    # Run-level features, grouped splits, scaling
│   │   │   ├── MethodologyPage      # 10-step engineering flowchart & formulas
│   │   │   ├── TrainingPage         # ANN hyperparameter builder & loss curves
│   │   │   ├── EvaluationPage       # MAE, RMSE, R2, actual vs pred, residuals
│   │   │   ├── PredictionPage       # 1-click presets & live flank wear gauge
│   │   │   └── ReportPage           # Full project report viewer & download
│   │   └── services/api.js          # REST API communication client
│   ├── package.json
│   └── vite.config.js
│
├── documentation/
│   ├── dataset_dictionary.md        # Comprehensive variable definitions & physics
│   ├── methodology.md               # Mathematical formulations & leakage prevention
│   └── model_documentation.md       # Neural network architecture & hyperparameter specs
└── README.md
```

---

## 2. Dataset Integration

The system uses the official **NASA Milling Wear Dataset** collected on a Matsuura MC-510V CNC vertical machining center:
- **Download Link:** [https://phm-datasets.s3.amazonaws.com/NASA/3.+Milling.zip](https://phm-datasets.s3.amazonaws.com/NASA/3.+Milling.zip)
- **Target File:** `mill.mat` (~72.5 MB)
- **Default Location:** `backend/uploaded_data/mill.mat`

### Sensor Channels (Sampled at 250 Hz, 9,000 points per cut):
1. `smcAC`: AC spindle motor current (Amperes)
2. `smcDC`: DC spindle motor current (Amperes)
3. `vib_table`: Table vibration acceleration (g)
4. `vib_spindle`: Spindle vibration acceleration (g)
5. `AE_table`: Table acoustic emission (Volts)
6. `AE_spindle`: Spindle acoustic emission (Volts)

### Cutting Parameters:
- `DOC`: Depth of cut (0.75 mm or 1.50 mm)
- `feed`: Feed rate (0.25 mm/rev or 0.50 mm/rev)
- `material`: Workpiece material (1 = Cast Iron, 2 = J45 Steel)

---

## 3. Quick Start Guide (Windows PowerShell)

### Step 1: Open Terminal in Project Root
```powershell
cd "c:\Users\Monika KN\OneDrive\Desktop\ANN_EL"
```

### Step 2: Set Up Backend Environment & Dependencies
```powershell
# Using Python 3.11 or System Python:
python -m pip install -r backend/requirements.txt
```

### Step 3: Start the FastAPI Backend Server
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API will start at: `http://127.0.0.1:8000` (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).*

### Step 4: Start the React Frontend (In a second PowerShell window)
```powershell
cd "c:\Users\Monika KN\OneDrive\Desktop\ANN_EL\frontend"
npm run dev
```
*The React web application will start at: `http://localhost:5173`.*

---

## 4. Key Machine Learning Features

1. **Zero Data Leakage:** `StandardScaler` transformations are fitted exclusively on training cases and applied unchanged to validation/test sets.
2. **Unseen Tool Generalization:** Cutting cases are partitioned by tool run (e.g. Cases 14, 15, and 16 held out), proving the model works on cutting tools it has never observed.
3. **Multi-Baseline Comparison:** Evaluated against both a naive **Mean Baseline** ($R^2 = 0$) and an Ordinary Least Squares **Linear Regression** model.
4. **ISO 3685 Wear Classification:** Continuous wear values mapped to physical maintenance criteria:
   - $V_B < 0.20$ mm: Initial / Break-in Wear
   - $0.20 \le V_B < 0.40$ mm: Steady-State / Progressive Wear
   - $V_B \ge 0.40$ mm: Severe Wear (Tool Replacement Threshold)


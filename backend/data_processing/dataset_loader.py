import os
import zipfile
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import scipy.io as sio

from backend.config import (
    DATA_DIR,
    DEFAULT_DATASET_PATH,
    SENSOR_CHANNELS,
    OPERATING_PARAMS,
    TARGET_VARIABLE
)

class DatasetLoader:
    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = Path(data_path) if data_path else DEFAULT_DATASET_PATH
        self.raw_mill_data = None
        self.runs_catalog: List[Dict[str, Any]] = []
        self._is_loaded = False

    def load_dataset(self, file_path: Optional[Path] = None) -> Dict[str, Any]:
        """Loads and parses the NASA Milling dataset (.mat or .zip)."""
        target_path = Path(file_path) if file_path else self.data_path

        if not target_path.exists():
            raise FileNotFoundError(f"Dataset file not found at: {target_path}")

        # If it's a zip file, extract and find .mat
        if target_path.suffix.lower() == ".zip":
            extract_dir = DATA_DIR / "extracted_zip"
            extract_dir.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(target_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Find any .mat file inside
            mat_files = list(extract_dir.rglob("*.mat"))
            if not mat_files:
                raise ValueError("No .mat file found inside the uploaded ZIP archive.")
            target_path = mat_files[0]

        # Load MATLAB .mat file
        try:
            mat_data = sio.loadmat(target_path, squeeze_me=False)
        except Exception as e:
            # Fallback to h5py for MATLAB v7.3
            try:
                import h5py
                with h5py.File(target_path, 'r') as f:
                    raise NotImplementedError("HDF5 MATLAB v7.3 loader can be adapted if required.")
            except ImportError:
                pass
            raise ValueError(f"Failed to load MATLAB file: {str(e)}")

        if "mill" not in mat_data:
            raise KeyError(f"'mill' variable not found in MATLAB file. Available keys: {list(mat_data.keys())}")

        self.raw_mill_data = mat_data["mill"][0]
        self.data_path = target_path
        self._is_loaded = True
        self._build_catalog()

        return self.get_audit_report()

    def _build_catalog(self):
        """Constructs a fast in-memory catalog of all runs with metadata."""
        if not self._is_loaded:
            return

        self.runs_catalog = []
        for idx, run_struct in enumerate(self.raw_mill_data):
            case_val = int(run_struct['case'][0, 0])
            run_num = int(run_struct['run'][0, 0])
            doc_val = float(run_struct['DOC'][0, 0])
            feed_val = float(run_struct['feed'][0, 0])
            material_val = int(run_struct['material'][0, 0])
            time_val = int(run_struct['time'][0, 0]) if run_struct['time'].size > 0 else 0

            # Flank wear VB check
            vb_arr = run_struct['VB']
            if vb_arr.size == 0 or np.isnan(vb_arr[0, 0]):
                vb_val = None
                has_valid_vb = False
            else:
                vb_val = round(float(vb_arr[0, 0]), 4)
                has_valid_vb = True

            self.runs_catalog.append({
                "index": idx,
                "case": case_val,
                "run": run_num,
                "DOC": doc_val,
                "feed": feed_val,
                "material": material_val,
                "material_name": "Cast Iron" if material_val == 1 else "J45 Steel",
                "time": time_val,
                "VB": vb_val,
                "has_valid_vb": has_valid_vb,
                "sample_points": int(run_struct['smcAC'].shape[0])
            })

    def get_audit_report(self) -> Dict[str, Any]:
        """Returns comprehensive audit metrics for the loaded dataset."""
        if not self._is_loaded:
            self.load_dataset()

        total_runs = len(self.runs_catalog)
        valid_vbs = [r["VB"] for r in self.runs_catalog if r["has_valid_vb"]]
        valid_count = len(valid_vbs)
        missing_count = total_runs - valid_count

        cases = sorted(list(set(r["case"] for r in self.runs_catalog)))
        materials = sorted(list(set(r["material_name"] for r in self.runs_catalog)))
        feed_rates = sorted(list(set(r["feed"] for r in self.runs_catalog)))
        doc_rates = sorted(list(set(r["DOC"] for r in self.runs_catalog)))

        vb_arr = np.array(valid_vbs, dtype=float)
        target_dist = {
            "count": valid_count,
            "mean": round(float(np.mean(vb_arr)), 4),
            "std": round(float(np.std(vb_arr)), 4),
            "min": round(float(np.min(vb_arr)), 4),
            "q25": round(float(np.percentile(vb_arr, 25)), 4),
            "median": round(float(np.median(vb_arr)), 4),
            "q75": round(float(np.percentile(vb_arr, 75)), 4),
            "max": round(float(np.max(vb_arr)), 4),
        }

        # Case summary: runs and valid labels per case
        case_summary = []
        for c in cases:
            case_runs = [r for r in self.runs_catalog if r["case"] == c]
            c_valid = [r["VB"] for r in case_runs if r["has_valid_vb"]]
            case_summary.append({
                "case": c,
                "total_runs": len(case_runs),
                "valid_runs": len(c_valid),
                "missing_runs": len(case_runs) - len(c_valid),
                "DOC": case_runs[0]["DOC"],
                "feed": case_runs[0]["feed"],
                "material": case_runs[0]["material_name"],
                "min_VB": min(c_valid) if c_valid else None,
                "max_VB": max(c_valid) if c_valid else None,
            })

        return {
            "status": "success",
            "file_name": self.data_path.name,
            "file_size_mb": round(self.data_path.stat().st_size / (1024 * 1024), 2),
            "total_runs": total_runs,
            "valid_wear_labels": valid_count,
            "missing_wear_labels": missing_count,
            "total_cases": len(cases),
            "sensor_channels": SENSOR_CHANNELS,
            "operating_parameters": OPERATING_PARAMS,
            "target_variable": TARGET_VARIABLE,
            "sample_points_per_signal": 9000,
            "materials_tested": materials,
            "feed_rates_mm_rev": feed_rates,
            "depth_of_cut_mm": doc_rates,
            "target_distribution": target_dist,
            "case_summary": case_summary,
            "preprocessing_decisions": [
                "Only runs with physically verified ground-truth flank wear (VB) labels are used for supervised ANN training.",
                "Observations missing VB (21 runs) are safely retained for unlabelled sensor inspection and excluded from regression training.",
                "Sensor time-series (9000 samples per channel) are reduced to statistical run-level descriptors (RMS, Mean, Std, Peak, Kurtosis, etc.).",
                "Case and Run identifiers are excluded from regression model inputs to prevent spurious memorization, and reserved strictly for grouped generalization evaluation.",
                "Feature scaling (StandardScaler) is strictly fit on training splits only and applied to validation/test splits to eliminate data leakage."
            ]
        }

    def get_run_signal(self, run_index: int, downsample_points: int = 600) -> Dict[str, Any]:
        """Extracts downsampled sensor time-series waveforms for an individual run."""
        if not self._is_loaded:
            self.load_dataset()

        if run_index < 0 or run_index >= len(self.raw_mill_data):
            raise IndexError(f"Run index {run_index} out of range [0, {len(self.raw_mill_data)-1}]")

        run_struct = self.raw_mill_data[run_index]
        meta = self.runs_catalog[run_index]

        # Downsample signals for smooth frontend rendering
        num_points = run_struct['smcAC'].shape[0]
        step = max(1, num_points // downsample_points)
        time_axis = [round(i / 250.0, 3) for i in range(0, num_points, step)]

        signals = {"time": time_axis}
        for ch in SENSOR_CHANNELS:
            arr = run_struct[ch].flatten()
            downsampled = [round(float(v), 5) for v in arr[::step]]
            signals[ch] = downsampled

        return {
            "metadata": meta,
            "signals": signals,
            "total_raw_points": num_points,
            "rendered_points": len(time_axis)
        }

    def get_runs_catalog(self) -> List[Dict[str, Any]]:
        if not self._is_loaded:
            self.load_dataset()
        return self.runs_catalog

# Global singleton
dataset_loader = DatasetLoader()


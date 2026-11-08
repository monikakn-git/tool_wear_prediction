import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Any, List, Optional
from pathlib import Path

from backend.config import SENSOR_CHANNELS, OPERATING_PARAMS, TARGET_VARIABLE, DATA_DIR
from backend.data_processing.dataset_loader import dataset_loader

class FeatureExtractor:
    def __init__(self):
        self.feature_df: Optional[pd.DataFrame] = None
        self.feature_names: List[str] = []
        self.cache_file = DATA_DIR / "extracted_features.csv"

    def extract_features_from_signal(self, signal: np.ndarray, prefix: str) -> Dict[str, float]:
        """Calculates statistical time-series domain features for a single sensor channel."""
        arr = signal.flatten()
        mean_val = float(np.mean(arr))
        std_val = float(np.std(arr))
        rms_val = float(np.sqrt(np.mean(arr ** 2)))
        max_val = float(np.max(arr))
        min_val = float(np.min(arr))
        p2p_val = float(max_val - min_val)
        
        # Fast skewness and kurtosis
        if std_val > 1e-9:
            norm_arr = (arr - mean_val) / std_val
            skew_val = float(np.mean(norm_arr ** 3))
            kurt_val = float(np.mean(norm_arr ** 4) - 3.0)
        else:
            skew_val = 0.0
            kurt_val = 0.0
        
        # Crest Factor
        crest_factor = float(max(abs(max_val), abs(min_val)) / (rms_val + 1e-9))

        return {
            f"{prefix}_mean": round(mean_val, 6),
            f"{prefix}_std": round(std_val, 6),
            f"{prefix}_rms": round(rms_val, 6),
            f"{prefix}_max": round(max_val, 6),
            f"{prefix}_min": round(min_val, 6),
            f"{prefix}_p2p": round(p2p_val, 6),
            f"{prefix}_skew": round(skew_val, 6),
            f"{prefix}_kurt": round(kurt_val, 6),
            f"{prefix}_crest": round(crest_factor, 6),
        }

    def extract_dataset_features(self, force_recompute: bool = False) -> pd.DataFrame:
        """Extracts run-level statistical features across all experimental runs."""
        # Check disk cache first for lightning-fast loads
        if not force_recompute and self.cache_file.exists():
            self.feature_df = pd.read_csv(self.cache_file)
            exclude_cols = ["index", "case", "run", "VB", "has_valid_vb"]
            self.feature_names = [c for c in self.feature_df.columns if c not in exclude_cols]
            return self.feature_df

        if not dataset_loader._is_loaded:
            dataset_loader.load_dataset()

        raw_mill = dataset_loader.raw_mill_data
        rows = []

        for idx, run_struct in enumerate(raw_mill):
            meta = dataset_loader.runs_catalog[idx]
            row = {
                "index": idx,
                "case": meta["case"],
                "run": meta["run"],
                "DOC": meta["DOC"],
                "feed": meta["feed"],
                "material": meta["material"],
                "time": meta["time"],
                "VB": meta["VB"],
                "has_valid_vb": meta["has_valid_vb"]
            }

            # Extract features for all 6 sensor channels
            for ch in SENSOR_CHANNELS:
                sig_arr = run_struct[ch]
                ch_feats = self.extract_features_from_signal(sig_arr, ch)
                row.update(ch_feats)

            rows.append(row)

        self.feature_df = pd.DataFrame(rows)
        # Save to disk cache
        self.feature_df.to_csv(self.cache_file, index=False)
        
        # Document all model input feature names (excluding metadata & target)
        exclude_cols = ["index", "case", "run", "VB", "has_valid_vb"]
        self.feature_names = [c for c in self.feature_df.columns if c not in exclude_cols]
        
        return self.feature_df

    def get_feature_summary(self) -> Dict[str, Any]:
        """Returns statistical description and correlation analysis of extracted features."""
        if self.feature_df is None:
            self.extract_dataset_features()

        # Only use valid VB rows for correlation & target stats
        valid_df = self.feature_df[self.feature_df["has_valid_vb"]].copy()

        # Compute correlations with VB
        numeric_cols = self.feature_names + ["VB"]
        corr_series = valid_df[numeric_cols].corr()["VB"].drop("VB").sort_values(ascending=False)
        top_positive_corr = corr_series.head(10).round(4).to_dict()
        top_negative_corr = corr_series.tail(10).round(4).to_dict()

        # Feature descriptions
        descriptions = []
        for col in self.feature_names:
            series = valid_df[col]
            descriptions.append({
                "feature": col,
                "mean": round(float(series.mean()), 4),
                "std": round(float(series.std()), 4),
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "correlation_with_VB": round(float(corr_series.get(col, 0.0)), 4)
            })

        # Correlation matrix for key features (top 8 most correlated + operating params)
        top_features = list(corr_series.abs().sort_values(ascending=False).head(8).index)
        base_cols = ["DOC", "feed", "material"]
        key_cols = base_cols + [f for f in top_features if f not in base_cols] + ["VB"]
        # Deduplicate while preserving order
        seen = set()
        key_cols = [c for c in key_cols if c not in seen and not seen.add(c)]
        corr_matrix = valid_df[key_cols].corr().round(3).to_dict()

        return {
            "total_extracted_features": len(self.feature_names),
            "feature_names": self.feature_names,
            "top_positive_correlations": top_positive_corr,
            "top_negative_correlations": top_negative_corr,
            "feature_descriptions": descriptions,
            "correlation_matrix": corr_matrix,
            "sample_records": valid_df[["index", "case", "run", "DOC", "feed", "material", "VB"] + top_features[:4]].head(10).to_dict(orient="records")
        }

    def get_scatter_data(self, feature_name: str) -> List[Dict[str, Any]]:
        """Returns (feature_value, VB) coordinates across all 146 valid runs."""
        if self.feature_df is None:
            self.extract_dataset_features()

        valid_df = self.feature_df[self.feature_df["has_valid_vb"]].copy()
        if feature_name not in valid_df.columns:
            feature_name = "smcAC_rms"

        records = []
        for _, row in valid_df.iterrows():
            records.append({
                "index": int(row["index"]),
                "case": int(row["case"]),
                "run": int(row["run"]),
                "DOC": float(row["DOC"]),
                "feed": float(row["feed"]),
                "material": int(row["material"]),
                "material_name": "Cast Iron" if int(row["material"]) == 1 else "J45 Steel",
                "VB": round(float(row["VB"]), 4),
                "feature_val": round(float(row[feature_name]), 4)
            })
        return records

    def get_vb_distribution(self) -> List[Dict[str, Any]]:
        """Returns histogram bins for tool flank wear (VB)."""
        if self.feature_df is None:
            self.extract_dataset_features()

        valid_df = self.feature_df[self.feature_df["has_valid_vb"]].copy()
        vbs = valid_df["VB"].values

        # Bins: [0-0.1), [0.1-0.2), [0.2-0.3), [0.3-0.4), [0.4-0.6), [0.6+]
        bins = [
            {"range": "0.0 - 0.1 mm", "min": 0.0, "max": 0.10, "label": "Initial / Very Sharp", "zone": "Initial"},
            {"range": "0.1 - 0.2 mm", "min": 0.10, "max": 0.20, "label": "Break-in Wear", "zone": "Initial"},
            {"range": "0.2 - 0.3 mm", "min": 0.20, "max": 0.30, "label": "Steady-State Low", "zone": "Steady"},
            {"range": "0.3 - 0.4 mm", "min": 0.30, "max": 0.40, "label": "Steady-State High", "zone": "Steady"},
            {"range": "0.4 - 0.6 mm", "min": 0.40, "max": 0.60, "label": "Severe Flank Wear", "zone": "Severe"},
            {"range": "0.6+ mm", "min": 0.60, "max": 99.0, "label": "Critical Degradation", "zone": "Severe"}
        ]

        result = []
        for b in bins:
            if b["max"] == 99.0:
                count = int(np.sum(vbs >= b["min"]))
            else:
                count = int(np.sum((vbs >= b["min"]) & (vbs < b["max"])))
            result.append({
                "range": b["range"],
                "count": count,
                "label": b["label"],
                "zone": b["zone"]
            })
        return result

# Global singleton
feature_extractor = FeatureExtractor()

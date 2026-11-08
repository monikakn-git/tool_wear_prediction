import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib
from pathlib import Path

from backend.config import MODELS_DIR
from backend.data_processing.feature_extraction import feature_extractor

class Preprocessor:
    def __init__(self):
        self.scaler = None
        self.scaler_type = "standard"  # 'standard' or 'minmax'
        self.selected_features: List[str] = []
        self.split_strategy: str = "grouped_case"  # 'grouped_case' or 'random'
        self.split_ratios: Dict[str, float] = {"train": 0.70, "val": 0.15, "test": 0.15}
        self.train_cases: List[int] = []
        self.val_cases: List[int] = []
        self.test_cases: List[int] = []
        
        # Split DataFrames
        self.train_df: Optional[pd.DataFrame] = None
        self.val_df: Optional[pd.DataFrame] = None
        self.test_df: Optional[pd.DataFrame] = None
        
        # Processed numpy arrays
        self.X_train: Optional[np.ndarray] = None
        self.y_train: Optional[np.ndarray] = None
        self.X_val: Optional[np.ndarray] = None
        self.y_val: Optional[np.ndarray] = None
        self.X_test: Optional[np.ndarray] = None
        self.y_test: Optional[np.ndarray] = None

    def execute_preprocessing(
        self,
        scaler_type: str = "standard",
        split_strategy: str = "grouped_case",
        selected_feature_names: Optional[List[str]] = None,
        test_case_ids: Optional[List[int]] = None,
        val_case_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Executes full preprocessing pipeline:
        1. Excludes missing VB labels (no data leakage).
        2. Performs grouped split by machining case to test generalization.
        3. Applies feature selection if specified.
        4. Fits scaler strictly on training split and transforms val/test splits.
        """
        # Ensure features are extracted
        if feature_extractor.feature_df is None:
            feature_extractor.extract_dataset_features()

        raw_df = feature_extractor.feature_df.copy()

        # Step 1: Missing-value handling
        # Exclude rows where VB is NaN or None
        supervised_df = raw_df[raw_df["has_valid_vb"]].copy().reset_index(drop=True)
        dropped_count = len(raw_df) - len(supervised_df)

        # Step 2: Feature selection
        if selected_feature_names and len(selected_feature_names) > 0:
            # Validate that selected features exist
            valid_feats = [f for f in selected_feature_names if f in feature_extractor.feature_names]
            self.selected_features = valid_feats if valid_feats else feature_extractor.feature_names
        else:
            self.selected_features = feature_extractor.feature_names

        self.scaler_type = scaler_type
        self.split_strategy = split_strategy

        # Step 3: Dataset Splitting
        all_cases = sorted(supervised_df["case"].unique().tolist())

        if split_strategy == "grouped_case":
            # Default grouped split: hold out entire experimental cases
            # Default test cases: [14, 15, 16] (unseen tools, steel & cast iron, varied cuts)
            # Default val cases: [12, 13]
            # Default train cases: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11] (case 6 has only 1 run)
            if test_case_ids:
                self.test_cases = [c for c in test_case_ids if c in all_cases]
            else:
                self.test_cases = [14, 15, 16]

            if val_case_ids:
                self.val_cases = [c for c in val_case_ids if c in all_cases and c not in self.test_cases]
            else:
                self.val_cases = [12, 13]

            self.train_cases = [c for c in all_cases if c not in self.test_cases and c not in self.val_cases]

            self.train_df = supervised_df[supervised_df["case"].isin(self.train_cases)].copy()
            self.val_df = supervised_df[supervised_df["case"].isin(self.val_cases)].copy()
            self.test_df = supervised_df[supervised_df["case"].isin(self.test_cases)].copy()

        else:
            # Stratified / Random split with fixed seed
            np.random.seed(42)
            shuffled = supervised_df.sample(frac=1.0, random_state=42).reset_index(drop=True)
            n_total = len(shuffled)
            n_train = int(n_total * 0.70)
            n_val = int(n_total * 0.15)

            self.train_df = shuffled.iloc[:n_train].copy()
            self.val_df = shuffled.iloc[n_train:n_train + n_val].copy()
            self.test_df = shuffled.iloc[n_train + n_val:].copy()
            self.train_cases = sorted(self.train_df["case"].unique().tolist())
            self.val_cases = sorted(self.val_df["case"].unique().tolist())
            self.test_cases = sorted(self.test_df["case"].unique().tolist())

        # Step 4: Extract X and y matrices
        X_train_raw = self.train_df[self.selected_features].values
        self.y_train = self.train_df["VB"].values.astype(float)

        X_val_raw = self.val_df[self.selected_features].values
        self.y_val = self.val_df["VB"].values.astype(float)

        X_test_raw = self.test_df[self.selected_features].values
        self.y_test = self.test_df["VB"].values.astype(float)

        # Step 5: Feature Normalization / Scaling (Fit ONLY on train!)
        if self.scaler_type == "minmax":
            self.scaler = MinMaxScaler()
        else:
            self.scaler = StandardScaler()

        self.X_train = self.scaler.fit_transform(X_train_raw)
        self.X_val = self.scaler.transform(X_val_raw)
        self.X_test = self.scaler.transform(X_test_raw)

        # Save scaler to disk
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        scaler_file = MODELS_DIR / "scaler.joblib"
        joblib.dump({
            "scaler": self.scaler,
            "scaler_type": self.scaler_type,
            "selected_features": self.selected_features
        }, scaler_file)

        return self.get_preprocessing_status()

    def get_preprocessing_status(self) -> Dict[str, Any]:
        """Returns details on the current split, transformations, and sample stats."""
        if self.X_train is None:
            return {"status": "not_preprocessed"}

        return {
            "status": "ready",
            "scaler_type": self.scaler_type,
            "split_strategy": self.split_strategy,
            "selected_features_count": len(self.selected_features),
            "selected_features": self.selected_features,
            "total_usable_samples": len(self.train_df) + len(self.val_df) + len(self.test_df),
            "train_samples": len(self.train_df),
            "val_samples": len(self.val_df),
            "test_samples": len(self.test_df),
            "train_cases": self.train_cases,
            "val_cases": self.val_cases,
            "test_cases": self.test_cases,
            "train_vb_mean": round(float(np.mean(self.y_train)), 4),
            "val_vb_mean": round(float(np.mean(self.y_val)), 4),
            "test_vb_mean": round(float(np.mean(self.y_test)), 4),
            "feature_shapes": {
                "X_train": list(self.X_train.shape),
                "y_train": list(self.y_train.shape),
                "X_val": list(self.X_val.shape),
                "y_val": list(self.y_val.shape),
                "X_test": list(self.X_test.shape),
                "y_test": list(self.y_test.shape),
            },
            "unseen_case_guarantee": (
                "Guaranteed strictly unseen tool cases in test set: "
                f"Cases {self.test_cases}. Ensures true generalization evaluation without data leakage."
                if self.split_strategy == "grouped_case" else
                "Random split used. Note: Random row splitting across same tool runs may overestimate generalization."
            )
        }

# Global singleton
preprocessor = Preprocessor()


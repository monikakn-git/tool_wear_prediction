import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import joblib
from pathlib import Path

from backend.config import (
    MODELS_DIR,
    WEAR_THRESHOLD_INITIAL,
    WEAR_THRESHOLD_CRITICAL
)
from backend.data_processing.preprocessing import preprocessor
from backend.data_processing.feature_extraction import feature_extractor
from backend.ml.train import model_trainer

class ToolWearPredictor:
    def __init__(self):
        self.scaler = None
        self.selected_features = []
        self.model = None

    def _load_artifacts(self):
        """Loads trained ANN model and matching scaler configuration."""
        scaler_file = MODELS_DIR / "scaler.joblib"
        if not scaler_file.exists():
            raise FileNotFoundError("Preprocessing scaler not found. Please train the model first.")

        scaler_payload = joblib.load(scaler_file)
        self.scaler = scaler_payload["scaler"]
        self.selected_features = scaler_payload["selected_features"]

        # Load model: check active model first, then disk
        if model_trainer.current_model and model_trainer.current_model.is_trained:
            self.model = model_trainer.current_model
        else:
            keras_path = MODELS_DIR / "ann_tool_wear_model.keras"
            joblib_path = MODELS_DIR / "ann_tool_wear_model.joblib"

            if keras_path.exists():
                try:
                    import tensorflow as tf
                    self.model = tf.keras.models.load_model(keras_path)
                except Exception:
                    if joblib_path.exists():
                        self.model = joblib.load(joblib_path)
            elif joblib_path.exists():
                self.model = joblib.load(joblib_path)
            else:
                raise FileNotFoundError("Trained ANN model not found. Please train the model before predicting.")

    def predict(self, feature_inputs: Dict[str, float]) -> Dict[str, Any]:
        """
        Validates input features, scales using training scaler, and performs ANN regression.
        """
        self._load_artifacts()

        # Build feature vector matching self.selected_features exactly
        input_vector = []
        missing_features = []

        for feat in self.selected_features:
            if feat in feature_inputs:
                input_vector.append(float(feature_inputs[feat]))
            else:
                # If a specific statistical feature is omitted, fill with training mean
                if feature_extractor.feature_df is not None and feat in feature_extractor.feature_df:
                    mean_val = float(feature_extractor.feature_df[feat].mean())
                    input_vector.append(mean_val)
                    missing_features.append(feat)
                else:
                    input_vector.append(0.0)
                    missing_features.append(feat)

        input_matrix = np.array([input_vector], dtype=float)

        # Scale features using training scaler
        scaled_matrix = self.scaler.transform(input_matrix)

        # Predict
        if hasattr(self.model, "use_tf") and self.model.use_tf and self.model.keras_model is not None:
            raw_prediction = float(self.model.keras_model.predict(scaled_matrix, verbose=0)[0, 0])
        elif hasattr(self.model, "sklearn_mlp") and self.model.sklearn_mlp is not None:
            raw_prediction = float(self.model.sklearn_mlp.predict(scaled_matrix)[0])
        elif hasattr(self.model, "predict"):
            pred = self.model.predict(scaled_matrix)
            raw_prediction = float(pred[0, 0] if hasattr(pred, "ndim") and pred.ndim > 1 else pred[0])
        else:
            raise RuntimeError("Unsupported model object for prediction.")

        # Physical flank wear cannot be negative
        predicted_vb = max(0.0, round(raw_prediction, 4))

        # Industrial Wear Classification based on ISO 3685 standard
        if predicted_vb < WEAR_THRESHOLD_INITIAL:
            wear_state = "Initial / Break-in Wear"
            severity_level = "low"
            action_recommendation = "Tool is in sharp/healthy condition. Continue normal high-speed milling."
            color = "#10B981"  # Emerald green
        elif predicted_vb < WEAR_THRESHOLD_CRITICAL:
            wear_state = "Steady-State / Progressive Wear"
            severity_level = "medium"
            action_recommendation = "Normal progressive flank land erosion. Tool operates within acceptable dimensional tolerances."
            color = "#F59E0B"  # Amber
        else:
            wear_state = "Severe / Critical Tool Wear"
            severity_level = "critical"
            action_recommendation = "Flank wear exceeds standard ISO 3685 limit (0.40 mm). Surface finish degradation and chatter risk high. Schedule cutting insert indexing/replacement immediately."
            color = "#EF4444"  # Red

        # Contextual explanation
        feed_val = feature_inputs.get("feed", 0.25)
        doc_val = feature_inputs.get("DOC", 1.5)
        mat_val = feature_inputs.get("material", 1)
        material_str = "Cast Iron" if int(mat_val) == 1 else "J45 Steel"

        explanation = (
            f"Under cutting conditions of DOC={doc_val} mm, feed={feed_val} mm/rev on {material_str}, "
            f"the ANN regression model predicts an instantaneous flank land wear VB of {predicted_vb} mm. "
            f"Classification: {wear_state} ({action_recommendation})"
        )

        return {
            "status": "success",
            "predicted_vb_mm": predicted_vb,
            "wear_state": wear_state,
            "severity_level": severity_level,
            "color_code": color,
            "iso_standard_criterion": "ISO 3685: 0.20 mm (Break-in) / 0.40 mm (Replacement Limit)",
            "action_recommendation": action_recommendation,
            "explanation": explanation,
            "input_operating_conditions": {
                "DOC_mm": doc_val,
                "feed_mm_rev": feed_val,
                "material": material_str
            },
            "features_used_count": len(self.selected_features),
            "missing_imputed_features": missing_features[:5] if missing_features else []
        }

    def get_preset_test_samples(self) -> List[Dict[str, Any]]:
        """Returns verified real NASA test observations for interactive 1-click evaluation."""
        if feature_extractor.feature_df is None:
            feature_extractor.extract_dataset_features()

        df = feature_extractor.feature_df[feature_extractor.feature_df["has_valid_vb"]].copy()
        
        # Pick 5 diverse runs across different cases and wear stages
        # e.g., Low wear (fresh cut), Medium wear, High wear (severe)
        samples = []
        cases_to_pick = [1, 5, 11, 14, 16]

        for c in cases_to_pick:
            c_df = df[df["case"] == c]
            if not c_df.empty:
                # pick a run
                row = c_df.iloc[-1]  # usually later cut with distinct wear
                meta_dict = {
                    "preset_id": f"Case {c} - Cut #{int(row['run'])}",
                    "case": int(row["case"]),
                    "run": int(row["run"]),
                    "material_name": "Cast Iron" if int(row["material"]) == 1 else "J45 Steel",
                    "actual_vb_mm": round(float(row["VB"]), 4),
                    "DOC": float(row["DOC"]),
                    "feed": float(row["feed"]),
                    "material": int(row["material"]),
                    "smcAC_rms": round(float(row.get("smcAC_rms", 0.0)), 4),
                    "smcDC_rms": round(float(row.get("smcDC_rms", 0.0)), 4),
                    "vib_table_rms": round(float(row.get("vib_table_rms", 0.0)), 4),
                    "vib_spindle_rms": round(float(row.get("vib_spindle_rms", 0.0)), 4),
                    "AE_table_rms": round(float(row.get("AE_table_rms", 0.0)), 4),
                    "AE_spindle_rms": round(float(row.get("AE_spindle_rms", 0.0)), 4),
                    "full_features": row[feature_extractor.feature_names].to_dict()
                }
                samples.append(meta_dict)

        return samples

# Global singleton
tool_wear_predictor = ToolWearPredictor()


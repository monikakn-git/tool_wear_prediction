import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from pathlib import Path

from backend.config import MODELS_DIR
from backend.data_processing.preprocessing import preprocessor
from backend.ml.train import model_trainer

class ModelEvaluator:
    def __init__(self):
        self.cached_evaluation: Optional[Dict[str, Any]] = None

    def evaluate(self) -> Dict[str, Any]:
        """
        Evaluates the trained ANN on the untouched test set.
        Calculates MAE, RMSE, R2, Mean Baseline, and Linear Regression baseline.
        """
        # Ensure preprocessing has run
        if preprocessor.X_test is None:
            preprocessor.execute_preprocessing()

        X_train, y_train = preprocessor.X_train, preprocessor.y_train
        X_val, y_val = preprocessor.X_val, preprocessor.y_val
        X_test, y_test = preprocessor.X_test, preprocessor.y_test

        # Ensure model is trained
        if not model_trainer.current_model or not model_trainer.current_model.is_trained:
            # Check if saved model exists on disk or auto-train
            keras_path = MODELS_DIR / "ann_tool_wear_model.keras"
            joblib_path = MODELS_DIR / "ann_tool_wear_model.joblib"
            if keras_path.exists() or joblib_path.exists():
                pass  # We can load below
            else:
                # Trigger initial training
                model_trainer.train()

        # Generate ANN Predictions
        ann = model_trainer.current_model
        if ann and ann.use_tf and ann.keras_model is not None:
            ann_preds_test = ann.keras_model.predict(X_test, verbose=0).flatten()
            ann_preds_val = ann.keras_model.predict(X_val, verbose=0).flatten()
            ann_preds_train = ann.keras_model.predict(X_train, verbose=0).flatten()
        elif ann and ann.sklearn_mlp is not None:
            ann_preds_test = ann.sklearn_mlp.predict(X_test)
            ann_preds_val = ann.sklearn_mlp.predict(X_val)
            ann_preds_train = ann.sklearn_mlp.predict(X_train)
        else:
            # Load from disk
            joblib_path = MODELS_DIR / "ann_tool_wear_model.joblib"
            keras_path = MODELS_DIR / "ann_tool_wear_model.keras"
            if keras_path.exists():
                import tensorflow as tf
                loaded_model = tf.keras.models.load_model(keras_path)
                ann_preds_test = loaded_model.predict(X_test, verbose=0).flatten()
                ann_preds_val = loaded_model.predict(X_val, verbose=0).flatten()
                ann_preds_train = loaded_model.predict(X_train, verbose=0).flatten()
            elif joblib_path.exists():
                loaded_mlp = joblib.load(joblib_path)
                ann_preds_test = loaded_mlp.predict(X_test)
                ann_preds_val = loaded_mlp.predict(X_val)
                ann_preds_train = loaded_mlp.predict(X_train)
            else:
                raise RuntimeError("No trained model found on disk.")

        # Clip predictions to non-negative (physical wear cannot be negative)
        ann_preds_test = np.clip(ann_preds_test, 0.0, None)
        ann_preds_val = np.clip(ann_preds_val, 0.0, None)
        ann_preds_train = np.clip(ann_preds_train, 0.0, None)

        # Baseline 1: Mean-Value Baseline (Predicts mean(y_train) for all test samples)
        mean_val_prediction = float(np.mean(y_train))
        mean_baseline_preds_test = np.full_like(y_test, mean_val_prediction)

        # Baseline 2: Linear Regression Baseline (Fit strictly on train set)
        lin_reg = LinearRegression()
        lin_reg.fit(X_train, y_train)
        lin_reg_preds_test = np.clip(lin_reg.predict(X_test), 0.0, None)

        # Calculate Metrics Function
        def calc_metrics(y_true, y_pred):
            mae = float(mean_absolute_error(y_true, y_pred))
            mse = float(mean_squared_error(y_true, y_pred))
            rmse = float(np.sqrt(mse))
            
            # Robust R2: 1 - SS_res / SS_tot
            ss_res = np.sum((y_true - y_pred) ** 2)
            ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
            r2 = float(1.0 - (ss_res / (ss_tot + 1e-9))) if ss_tot > 1e-9 else 0.0

            return {
                "mae": round(mae, 4),
                "mse": round(mse, 6),
                "rmse": round(rmse, 4),
                "r2": round(r2, 4)
            }

        ann_test_metrics = calc_metrics(y_test, ann_preds_test)
        ann_val_metrics = calc_metrics(y_val, ann_preds_val)
        ann_train_metrics = calc_metrics(y_train, ann_preds_train)

        mean_baseline_metrics = calc_metrics(y_test, mean_baseline_preds_test)
        lin_reg_metrics = calc_metrics(y_test, lin_reg_preds_test)

        # Residuals calculation
        residuals_test = y_test - ann_preds_test

        # Build Actual vs Predicted & Residuals scatter points for frontend charts
        actual_vs_predicted_data = []
        residual_plot_data = []
        test_df = preprocessor.test_df.reset_index(drop=True)

        for i in range(len(y_test)):
            actual = round(float(y_test[i]), 4)
            predicted = round(float(ann_preds_test[i]), 4)
            res = round(float(residuals_test[i]), 4)
            case_id = int(test_df.loc[i, "case"]) if "case" in test_df else 0
            run_id = int(test_df.loc[i, "run"]) if "run" in test_df else i + 1

            actual_vs_predicted_data.append({
                "index": i + 1,
                "case": case_id,
                "run": run_id,
                "actual_vb": actual,
                "predicted_vb": predicted,
                "ideal": actual,  # 45 degree reference
                "error": round(abs(actual - predicted), 4)
            })

            residual_plot_data.append({
                "index": i + 1,
                "case": case_id,
                "run": run_id,
                "predicted_vb": predicted,
                "residual": res,
                "zero_line": 0.0
            })

        # Model comparison chart items
        model_comparison = [
            {
                "model": "Mean Baseline",
                "mae": mean_baseline_metrics["mae"],
                "rmse": mean_baseline_metrics["rmse"],
                "r2": max(-1.0, mean_baseline_metrics["r2"]),
                "description": "Predicts average training wear"
            },
            {
                "model": "Linear Regression",
                "mae": lin_reg_metrics["mae"],
                "rmse": lin_reg_metrics["rmse"],
                "r2": max(-1.0, lin_reg_metrics["r2"]),
                "description": "Standard linear OLS model"
            },
            {
                "model": "Proposed ANN Regression",
                "mae": ann_test_metrics["mae"],
                "rmse": ann_test_metrics["rmse"],
                "r2": ann_test_metrics["r2"],
                "description": "Feed-Forward Multi-Layer Neural Network"
            }
        ]

        # Case-by-case generalization breakdown
        case_generalization = []
        for c in preprocessor.test_cases:
            mask = (test_df["case"] == c).values
            if np.any(mask):
                c_actual = y_test[mask]
                c_pred = ann_preds_test[mask]
                c_metrics = calc_metrics(c_actual, c_pred)
                case_generalization.append({
                    "case": c,
                    "samples_count": int(np.sum(mask)),
                    "mae": c_metrics["mae"],
                    "rmse": c_metrics["rmse"],
                    "r2": c_metrics["r2"]
                })

        # Training history for loss curve
        epoch_loss_curve = []
        if model_trainer.current_model and model_trainer.current_model.history:
            h = model_trainer.current_model.history
            for i in range(len(h.get("loss", []))):
                epoch_loss_curve.append({
                    "epoch": i + 1,
                    "train_loss": h["loss"][i],
                    "val_loss": h["val_loss"][i] if i < len(h.get("val_loss", [])) else None,
                    "train_mae": h["mae"][i] if i < len(h.get("mae", [])) else None,
                    "val_mae": h["val_mae"][i] if i < len(h.get("val_mae", [])) else None,
                })

        evaluation_result = {
            "status": "success",
            "test_sample_count": len(y_test),
            "test_cases_evaluated": preprocessor.test_cases,
            "ann_metrics": {
                "test": ann_test_metrics,
                "validation": ann_val_metrics,
                "train": ann_train_metrics
            },
            "baseline_metrics": {
                "mean_baseline": mean_baseline_metrics,
                "linear_regression": lin_reg_metrics
            },
            "model_comparison": model_comparison,
            "actual_vs_predicted": actual_vs_predicted_data,
            "residual_plot_data": residual_plot_data,
            "case_generalization": case_generalization,
            "epoch_loss_curve": epoch_loss_curve,
            "interpretations": {
                "mae": f"On average, the ANN's flank wear prediction deviates by {ann_test_metrics['mae']} mm from optical microscope ground-truth.",
                "rmse": f"Root Mean Squared Error of {ann_test_metrics['rmse']} mm penalizes larger deviation errors.",
                "r2": f"The model explains {round(ann_test_metrics['r2'] * 100, 1)}% of the variance in tool flank wear across unseen cutting tests."
            }
        }

        self.cached_evaluation = evaluation_result
        return evaluation_result

# Global singleton
model_evaluator = ModelEvaluator()


import os
import json
import time
import warnings
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any, List, Optional
from sklearn.exceptions import ConvergenceWarning

warnings.filterwarnings("ignore", category=ConvergenceWarning)

from backend.config import MODELS_DIR
from backend.data_processing.preprocessing import preprocessor
from backend.ml.ann_model import ToolWearANN, HAS_TF

class ModelTrainer:
    def __init__(self):
        self.current_model: Optional[ToolWearANN] = None
        self.training_status: str = "idle"  # idle, training, completed, failed
        self.training_result: Optional[Dict[str, Any]] = None

    def train(
        self,
        hidden_layers: Optional[List[int]] = None,
        activation: str = "relu",
        learning_rate: float = 0.001,
        batch_size: int = 16,
        epochs: int = 120,
        early_stopping_patience: int = 15,
        use_tf_if_available: bool = True
    ) -> Dict[str, Any]:
        """Executes actual ANN training on the preprocessed training dataset."""
        if preprocessor.X_train is None:
            # Auto-run preprocessing with defaults if not already done
            preprocessor.execute_preprocessing()

        self.training_status = "training"
        start_time = time.time()

        input_dim = preprocessor.X_train.shape[1]
        layers_cfg = hidden_layers if hidden_layers else [32, 16]

        ann = ToolWearANN(
            input_dim=input_dim,
            hidden_layers=layers_cfg,
            activation=activation,
            learning_rate=learning_rate,
            batch_size=batch_size,
            epochs=epochs,
            early_stopping_patience=early_stopping_patience,
            use_tf=use_tf_if_available and HAS_TF
        )

        ann.build_model()
        X_train, y_train = preprocessor.X_train, preprocessor.y_train
        X_val, y_val = preprocessor.X_val, preprocessor.y_val

        history_dict = {"loss": [], "val_loss": [], "mae": [], "val_mae": []}
        stopped_epoch = epochs

        try:
            if ann.use_tf:
                import tensorflow as tf
                
                early_stop = tf.keras.callbacks.EarlyStopping(
                    monitor="val_loss",
                    patience=early_stopping_patience,
                    restore_best_weights=True,
                    verbose=0
                )

                # Custom callback to capture epoch logs
                class MetricHistory(tf.keras.callbacks.Callback):
                    def on_epoch_end(self, epoch, logs=None):
                        logs = logs or {}
                        history_dict["loss"].append(round(float(logs.get("loss", 0.0)), 6))
                        history_dict["val_loss"].append(round(float(logs.get("val_loss", 0.0)), 6))
                        history_dict["mae"].append(round(float(logs.get("mae", 0.0)), 6))
                        history_dict["val_mae"].append(round(float(logs.get("val_mae", 0.0)), 6))

                ann.keras_model.fit(
                    X_train,
                    y_train,
                    validation_data=(X_val, y_val),
                    epochs=epochs,
                    batch_size=batch_size,
                    callbacks=[early_stop, MetricHistory()],
                    verbose=0
                )

                stopped_epoch = len(history_dict["loss"])
                # Save Keras model
                model_path = MODELS_DIR / "ann_tool_wear_model.keras"
                ann.keras_model.save(model_path)

            else:
                # Scikit-Learn MLP Regressor
                mlp = ann.sklearn_mlp
                
                # We can train iteratively with warm_start to capture epoch loss curve!
                mlp.warm_start = True
                mlp.max_iter = 1
                
                best_val_loss = float("inf")
                patience_counter = 0

                for ep in range(epochs):
                    mlp.fit(X_train, y_train)
                    train_preds = mlp.predict(X_train)
                    val_preds = mlp.predict(X_val)

                    train_mse = float(np.mean((train_preds - y_train) ** 2))
                    val_mse = float(np.mean((val_preds - y_val) ** 2))
                    train_mae = float(np.mean(np.abs(train_preds - y_train)))
                    val_mae = float(np.mean(np.abs(val_preds - y_val)))

                    history_dict["loss"].append(round(train_mse, 6))
                    history_dict["val_loss"].append(round(val_mse, 6))
                    history_dict["mae"].append(round(train_mae, 6))
                    history_dict["val_mae"].append(round(val_mae, 6))

                    # Early stopping logic
                    if val_mse < best_val_loss - 1e-5:
                        best_val_loss = val_mse
                        patience_counter = 0
                    else:
                        patience_counter += 1
                        if patience_counter >= early_stopping_patience:
                            stopped_epoch = ep + 1
                            break

                stopped_epoch = len(history_dict["loss"])
                # Save Scikit-Learn model
                model_path = MODELS_DIR / "ann_tool_wear_model.joblib"
                joblib.dump(ann.sklearn_mlp, model_path)

            elapsed_time = round(time.time() - start_time, 2)
            ann.history = history_dict
            ann.is_trained = True
            self.current_model = ann

            # Epoch curves formatted for Recharts
            epoch_loss_curve = []
            for i in range(len(history_dict["loss"])):
                epoch_loss_curve.append({
                    "epoch": i + 1,
                    "train_loss": history_dict["loss"][i],
                    "val_loss": history_dict["val_loss"][i],
                    "train_mae": history_dict["mae"][i],
                    "val_mae": history_dict["val_mae"][i]
                })

            final_train_loss = history_dict["loss"][-1] if history_dict["loss"] else 0.0
            final_val_loss = history_dict["val_loss"][-1] if history_dict["val_loss"] else 0.0

            result = {
                "status": "success",
                "engine_used": "TensorFlow/Keras" if ann.use_tf else "Scikit-Learn MLP ANN",
                "training_duration_seconds": elapsed_time,
                "epochs_trained": stopped_epoch,
                "max_epochs_configured": epochs,
                "early_stopped": stopped_epoch < epochs,
                "final_train_loss_mse": final_train_loss,
                "final_val_loss_mse": final_val_loss,
                "architecture_summary": ann.get_architecture_summary(),
                "epoch_loss_curve": epoch_loss_curve,
                "training_samples": len(X_train),
                "validation_samples": len(X_val)
            }

            # Save training metadata
            with open(MODELS_DIR / "training_meta.json", "w") as f:
                json.dump(result, f, indent=2)

            self.training_status = "completed"
            self.training_result = result
            return result

        except Exception as e:
            self.training_status = "failed"
            raise RuntimeError(f"Error during ANN training: {str(e)}")

    def get_status(self) -> Dict[str, Any]:
        if self.current_model and self.current_model.is_trained:
            return {
                "training_status": self.training_status,
                "model_available": True,
                "result": self.training_result
            }
        
        # Check if saved model exists on disk
        meta_path = MODELS_DIR / "training_meta.json"
        if meta_path.exists():
            with open(meta_path, "r") as f:
                meta = json.load(f)
            return {
                "training_status": "completed",
                "model_available": True,
                "result": meta
            }

        return {
            "training_status": self.training_status,
            "model_available": False,
            "result": None
        }

# Global singleton
model_trainer = ModelTrainer()

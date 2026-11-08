import os
import json
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from backend.config import MODELS_DIR

# Check TensorFlow availability
HAS_TF = False
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers, callbacks
    HAS_TF = True
except Exception:
    HAS_TF = False

from sklearn.neural_network import MLPRegressor

class ToolWearANN:
    def __init__(
        self,
        input_dim: int,
        hidden_layers: List[int] = None,
        activation: str = "relu",
        learning_rate: float = 0.001,
        batch_size: int = 16,
        epochs: int = 100,
        early_stopping_patience: int = 15,
        use_tf: bool = True
    ):
        self.input_dim = input_dim
        self.hidden_layers = hidden_layers if hidden_layers else [32, 16]
        self.activation = activation
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        self.early_stopping_patience = early_stopping_patience
        self.use_tf = use_tf and HAS_TF
        
        self.keras_model = None
        self.sklearn_mlp = None
        self.history: Dict[str, List[float]] = {
            "loss": [],
            "val_loss": [],
            "mae": [],
            "val_mae": []
        }
        self.is_trained = False
        self.training_metadata: Dict[str, Any] = {}

    def build_model(self):
        """Constructs the feed-forward ANN architecture."""
        if self.use_tf:
            model = models.Sequential()
            # Input layer
            model.add(layers.Input(shape=(self.input_dim,)))
            
            # Hidden layers
            for idx, units in enumerate(self.hidden_layers):
                model.add(layers.Dense(units, activation=self.activation, name=f"dense_hidden_{idx+1}"))
                model.add(layers.Dropout(0.05, name=f"dropout_{idx+1}"))

            # Output layer: 1 linear neuron for flank wear VB (mm)
            model.add(layers.Dense(1, activation="linear", name="output_flank_wear_vb"))

            optimizer = optimizers.Adam(learning_rate=self.learning_rate)
            model.compile(optimizer=optimizer, loss="mse", metrics=["mae"])
            self.keras_model = model
            return model
        else:
            # Scikit-Learn MLPRegressor ANN
            self.sklearn_mlp = MLPRegressor(
                hidden_layer_sizes=tuple(self.hidden_layers),
                activation="relu" if self.activation == "relu" else "tanh",
                solver="adam",
                alpha=0.0001,
                batch_size=self.batch_size if self.batch_size != "auto" else "auto",
                learning_rate_init=self.learning_rate,
                max_iter=self.epochs,
                early_stopping=True,
                n_iter_no_change=self.early_stopping_patience,
                validation_fraction=0.15,
                random_state=42
            )
            return self.sklearn_mlp

    def get_architecture_summary(self) -> Dict[str, Any]:
        """Returns structured JSON summary of layers, neurons, and parameter counts."""
        layers_info = []
        prev_dim = self.input_dim
        total_params = 0

        for i, units in enumerate(self.hidden_layers):
            weights_count = prev_dim * units
            biases_count = units
            param_count = weights_count + biases_count
            total_params += param_count
            layers_info.append({
                "layer_index": i + 1,
                "layer_type": "Dense Hidden Layer",
                "units": units,
                "activation": self.activation,
                "input_dim": prev_dim,
                "output_dim": units,
                "parameters": param_count
            })
            prev_dim = units

        # Output layer
        output_params = prev_dim * 1 + 1
        total_params += output_params
        layers_info.append({
            "layer_index": len(self.hidden_layers) + 1,
            "layer_type": "Dense Output Layer",
            "units": 1,
            "activation": "linear",
            "input_dim": prev_dim,
            "output_dim": 1,
            "parameters": output_params
        })

        return {
            "engine": "TensorFlow/Keras" if self.use_tf else "Scikit-Learn MLP Feed-forward ANN",
            "input_features": self.input_dim,
            "total_layers": len(layers_info),
            "hidden_layers": self.hidden_layers,
            "total_trainable_parameters": total_params,
            "layers": layers_info,
            "loss_function": "Mean Squared Error (MSE)",
            "optimizer": "Adam",
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "max_epochs": self.epochs
        }


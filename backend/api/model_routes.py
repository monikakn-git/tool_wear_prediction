from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.ml.train import model_trainer
from backend.ml.evaluate import model_evaluator
from backend.ml.predict import tool_wear_predictor

router = APIRouter(prefix="/api/model", tags=["Model Operations"])

class TrainRequest(BaseModel):
    hidden_layers: Optional[List[int]] = [32, 16]
    activation: str = "relu"
    learning_rate: float = 0.001
    batch_size: int = 16
    epochs: int = 120
    early_stopping_patience: int = 15
    use_tf: bool = True

class PredictRequest(BaseModel):
    features: Dict[str, float]

@router.post("/train")
async def train_model(request: TrainRequest):
    """Executes actual training of the feed-forward ANN regression model."""
    try:
        result = model_trainer.train(
            hidden_layers=request.hidden_layers,
            activation=request.activation,
            learning_rate=request.learning_rate,
            batch_size=request.batch_size,
            epochs=request.epochs,
            early_stopping_patience=request.early_stopping_patience,
            use_tf_if_available=request.use_tf
        )
        # Clear cached evaluation so it recomputes on next evaluation call
        model_evaluator.cached_evaluation = None
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/status")
async def get_model_status():
    """Returns training progress and architecture status."""
    return model_trainer.get_status()

@router.get("/evaluate")
async def evaluate_model():
    """Returns actual test metrics (MAE, RMSE, R2, Baselines, Residuals)."""
    try:
        eval_result = model_evaluator.evaluate()
        return eval_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.post("/predict")
async def predict_tool_wear(request: PredictRequest):
    """Predicts instantaneous flank wear VB (mm) given input features and operating parameters."""
    try:
        prediction = tool_wear_predictor.predict(request.features)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/presets")
async def get_preset_samples():
    """Returns verified NASA test cut observations for 1-click testing."""
    try:
        presets = tool_wear_predictor.get_preset_test_samples()
        return {"presets": presets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch presets: {str(e)}")


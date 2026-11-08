"""
API routes for tool life estimation.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.tool_life.life_estimator import ToolLifeEstimator

router = APIRouter(prefix="/api/tool-life", tags=["Tool Life"])

estimator = ToolLifeEstimator()


class ManualLifeInput(BaseModel):
    current_vb: float
    runs_completed: int
    failure_threshold: float = 0.6
    avg_op_minutes: float = 2.0
    feed_rate: Optional[float] = None
    cutting_speed: Optional[float] = None
    depth_of_cut: Optional[float] = None
    workpiece_material: Optional[str] = None


class FitModelInput(BaseModel):
    case_id: int
    model_type: str = "exponential"


@router.get("/cases")
def list_cases():
    """List all NASA cases with wear progression summary."""
    return estimator.get_all_case_analyses()


@router.get("/cases/{case_id}")
def get_case_detail(case_id: int):
    """Detailed wear history and life estimation for a case."""
    result = estimator.get_case_wear_progression(case_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/estimate")
def estimate_remaining_life(data: ManualLifeInput):
    """Estimate remaining life from manual input."""
    conditions = {}
    if data.feed_rate:
        conditions["feed_rate"] = data.feed_rate
    if data.cutting_speed:
        conditions["cutting_speed"] = data.cutting_speed
    if data.depth_of_cut:
        conditions["depth_of_cut"] = data.depth_of_cut
    if data.workpiece_material:
        conditions["workpiece_material"] = data.workpiece_material

    return estimator.predict_from_manual_input(
        data.current_vb, data.runs_completed,
        conditions if conditions else None,
        data.failure_threshold
    )


@router.post("/fit-model")
def fit_model(data: FitModelInput):
    """Fit a degradation model to a specific case."""
    histories = estimator.load_wear_history()
    if data.case_id not in histories:
        raise HTTPException(status_code=404, detail=f"Case {data.case_id} not found.")
    fit = estimator.fit_degradation_model(histories[data.case_id], data.model_type)
    return fit


@router.get("/degradation-models")
def list_models():
    """List available degradation model types."""
    return {
        "models": [
            {"type": "linear", "equation": "VB = a·t + b", "description": "Linear wear progression."},
            {"type": "exponential", "equation": "VB = a·exp(b·t) + c", "description": "Exponential growth — models accelerating wear."},
            {"type": "polynomial", "equation": "VB = a·t² + b·t + c", "description": "Quadratic curve — captures bathtub or accelerating patterns."},
            {"type": "power", "equation": "VB = a·t^b + c", "description": "Power law — common in tribology and wear modelling."},
        ]
    }


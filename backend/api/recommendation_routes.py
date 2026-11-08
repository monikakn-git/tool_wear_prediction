"""
API routes for machining operation recommendations.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict
from backend.recommendations.recommendation_engine import OperationRecommendationEngine
from backend.tool_catalogue.knowledge_base import DAMAGE_PREVENTION_GUIDELINES

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

engine = OperationRecommendationEngine()


class OperationRequest(BaseModel):
    tool_category: str
    tool_material: Optional[str] = None
    tool_coating: Optional[str] = None
    workpiece_material: Optional[str] = None
    current_vb: Optional[float] = None


class FeasibilityRequest(BaseModel):
    tool_category: str
    operation_type: str
    workpiece_material: Optional[str] = None
    tool_material: Optional[str] = None
    cutting_speed: Optional[float] = None
    feed_rate: Optional[float] = None
    depth_of_cut: Optional[float] = None
    current_vb: Optional[float] = None


class FullAssessmentRequest(BaseModel):
    tool_info: Dict
    operation: str
    workpiece_material: str
    cutting_params: Optional[Dict] = None
    current_condition: Optional[Dict] = None


class DamagePreventionRequest(BaseModel):
    tool_category: Optional[str] = None
    workpiece_material: Optional[str] = None
    operation: Optional[str] = None


@router.post("/operations")
def recommend_operations(req: OperationRequest):
    """Get operation recommendations for a tool."""
    return engine.recommend_operations(
        req.tool_category, req.tool_material,
        req.tool_coating, req.workpiece_material, req.current_vb
    )


@router.post("/check-feasibility")
def check_feasibility(req: FeasibilityRequest):
    """Check if a specific operation is feasible."""
    return engine.check_operation_feasibility(
        req.tool_category, req.operation_type,
        req.workpiece_material, req.tool_material,
        req.cutting_speed, req.feed_rate, req.depth_of_cut,
        req.current_vb
    )


@router.get("/materials/{tool_material}")
def material_compatibility(tool_material: str, coating: Optional[str] = None):
    """Get material compatibility for a tool material."""
    result = engine.get_material_recommendations(tool_material, coating)
    if not result:
        raise HTTPException(status_code=404, detail=f"No data for tool material '{tool_material}'.")
    return result


@router.post("/damage-prevention")
def damage_prevention(req: DamagePreventionRequest):
    """Get context-aware damage prevention tips."""
    return engine.get_damage_prevention_tips(
        req.tool_category, req.workpiece_material, req.operation
    )


@router.post("/full-assessment")
def full_assessment(req: FullAssessmentRequest):
    """Generate complete recommendation report."""
    return engine.generate_full_recommendation(
        req.tool_info, req.operation,
        req.workpiece_material, req.cutting_params,
        req.current_condition
    )


@router.get("/wear-warnings/{vb_value}")
def wear_warnings(vb_value: float):
    """Get condition warnings for a given VB value."""
    return engine.get_wear_warnings(vb_value)


@router.get("/guidelines")
def get_all_guidelines():
    """Get all damage prevention guidelines."""
    return DAMAGE_PREVENTION_GUIDELINES


"""
API routes for tool catalogue, identification, and image upload.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import shutil

from backend.tool_catalogue.catalogue_service import ToolCatalogueService
from backend.tool_catalogue.knowledge_base import (
    TOOL_CATEGORIES, TOOL_MATERIALS, TOOL_COATINGS,
    WORKPIECE_MATERIALS, MACHINING_OPERATIONS,
)
from backend.image_identification.tool_classifier import ToolClassifier
from backend.image_identification.ocr_reader import OCRReader

router = APIRouter(prefix="/api/tools", tags=["Tools"])

catalogue = ToolCatalogueService()
classifier = ToolClassifier()
ocr = OCRReader()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Pydantic Models ──────────────────────────────────────────────────────
class ToolCreate(BaseModel):
    category: str
    subcategory: str = ""
    manufacturer: str = "Unknown"
    model_number: str = ""
    tool_material: str = "Solid Carbide"
    coating: str = "Uncoated"
    diameter_mm: float = 0.0
    num_flutes: int = 0
    helix_angle: float = 0.0
    shank_diameter_mm: float = 0.0
    overall_length_mm: float = 0.0
    cutting_length_mm: float = 0.0
    compatible_materials: List[str] = []
    compatible_operations: List[str] = []
    speed_range_min: float = 0.0
    speed_range_max: float = 0.0
    feed_range_min: float = 0.0
    feed_range_max: float = 0.0
    doc_range_min: float = 0.0
    doc_range_max: float = 0.0
    restrictions: str = ""
    datasheet_url: str = ""


# ── Catalogue Endpoints ──────────────────────────────────────────────────
@router.get("/catalogue")
def list_tools(category: Optional[str] = None, material: Optional[str] = None):
    return catalogue.get_all_tools(category, material)


@router.get("/catalogue/search")
def search_tools(q: str = Query(..., min_length=1)):
    return catalogue.search_tools(q)


@router.get("/catalogue/{tool_id}")
def get_tool(tool_id: int):
    tool = catalogue.get_tool_by_id(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    ops = catalogue.get_compatible_operations(tool_id)
    mats = catalogue.get_material_compatibility(tool_id)
    return {"tool": tool, "compatible_operations": ops, "material_compatibility": mats}


@router.post("/catalogue")
def add_tool(data: ToolCreate):
    return catalogue.add_tool(data.model_dump())


@router.put("/catalogue/{tool_id}")
def update_tool(tool_id: int, data: ToolCreate):
    result = catalogue.update_tool(tool_id, data.model_dump())
    if not result:
        raise HTTPException(status_code=404, detail="Tool not found")
    return result


@router.delete("/catalogue/{tool_id}")
def delete_tool(tool_id: int):
    if not catalogue.delete_tool(tool_id):
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"message": "Tool deleted"}


# ── Statistics & Knowledge Base ──────────────────────────────────────────
@router.get("/stats")
def tool_stats():
    stats = catalogue.get_tool_stats()
    return stats


@router.get("/categories")
def list_categories():
    return {name: info["description"] for name, info in TOOL_CATEGORIES.items()}


@router.get("/materials")
def list_materials():
    return {name: {k: v for k, v in info.items() if k != "typical_speed_factor"}
            for name, info in TOOL_MATERIALS.items()}


@router.get("/coatings")
def list_coatings():
    return TOOL_COATINGS


@router.get("/operations")
def list_operations():
    return {name: info["description"] for name, info in MACHINING_OPERATIONS.items()}


@router.get("/workpiece-materials")
def list_workpiece_materials():
    return WORKPIECE_MATERIALS


# ── Image Identification ─────────────────────────────────────────────────
@router.post("/identify")
async def identify_tool(file: UploadFile = File(...)):
    """Upload a tool image and get AI-based identification."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 20 MB.")

    # Save image
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Classify
    classification = classifier.classify(contents)

    # OCR
    ocr_result = ocr.full_analysis(contents)

    # Combine
    return {
        "image_saved": filepath,
        "classification": classification,
        "ocr_results": ocr_result,
        "next_steps": [
            "Review the identification results.",
            "Confirm or correct the tool category.",
            "Add missing specifications manually if needed.",
            "Proceed to condition inspection or wear prediction.",
        ],
    }


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload and store a tool image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {"filename": filename, "path": filepath, "size_bytes": len(contents)}


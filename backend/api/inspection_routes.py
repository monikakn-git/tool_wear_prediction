"""
API routes for visual inspection and damage detection.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.visual_inspection.damage_detector import DamageDetector
from backend.image_identification.tool_classifier import ToolClassifier
from backend.image_identification.ocr_reader import OCRReader
from backend.tool_catalogue.knowledge_base import WEAR_DAMAGE_TYPES
import os
import uuid

router = APIRouter(prefix="/api/inspection", tags=["Inspection"])

detector = DamageDetector()
classifier = ToolClassifier()
ocr = OCRReader()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze")
async def analyze_condition(file: UploadFile = File(...)):
    """Upload tool image and get visual condition analysis."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 20 MB.")

    # Save
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    result = detector.analyze_condition(contents)
    result["image_path"] = filepath
    return result


@router.post("/identify-and-inspect")
async def identify_and_inspect(file: UploadFile = File(...)):
    """Combined: classify tool + inspect condition in one call."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()

    # Save
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    classification = classifier.classify(contents)
    ocr_result = ocr.full_analysis(contents)
    condition = detector.analyze_condition(contents)

    return {
        "image_path": filepath,
        "identification": classification,
        "ocr": ocr_result,
        "condition": condition,
    }


@router.get("/damage-types")
def get_damage_types():
    """Return all wear/damage types with descriptions."""
    return WEAR_DAMAGE_TYPES


@router.get("/limitations")
def get_limitations():
    """Return known limitations of image-based inspection."""
    return {
        "limitations": [
            "Image resolution and lighting quality significantly affect analysis accuracy.",
            "Flank wear (VB) cannot be measured numerically from a standard photograph — requires calibrated microscope.",
            "Internal cracks, sub-surface damage, and micro-fractures cannot be detected visually.",
            "Coating integrity assessment is limited to visible discoloration and color changes.",
            "Results depend on image angle, focus, and background contrast.",
            "The system provides qualitative condition indicators, not quantitative measurements.",
            "This analysis does not replace calibrated tool inspection per ISO 3685.",
            "Built-up edge and crater wear on the rake face may not be visible from a flank photograph.",
        ]
    }


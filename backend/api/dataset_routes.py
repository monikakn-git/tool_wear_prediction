from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import shutil
from pathlib import Path

from backend.config import DATA_DIR
from backend.data_processing.dataset_loader import dataset_loader
from backend.data_processing.feature_extraction import feature_extractor
from backend.data_processing.preprocessing import preprocessor

router = APIRouter(prefix="/api/dataset", tags=["Dataset Operations"])

class PreprocessRequest(BaseModel):
    scaler_type: str = "standard"  # 'standard' or 'minmax'
    split_strategy: str = "grouped_case"  # 'grouped_case' or 'random'
    selected_features: Optional[List[str]] = None
    test_cases: Optional[List[int]] = None
    val_cases: Optional[List[int]] = None

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads a NASA milling dataset file (.mat or .zip) and inspects it."""
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in [".mat", ".zip"]:
        raise HTTPException(status_code=400, detail="Only .mat or .zip files are supported.")

    save_path = DATA_DIR / file.filename
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Inspect and load newly uploaded file
        report = dataset_loader.load_dataset(save_path)
        # Re-extract features
        feature_extractor.extract_dataset_features()
        return {
            "message": f"Successfully uploaded and verified {file.filename}",
            "audit_report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process dataset file: {str(e)}")

@router.get("/inspect")
async def inspect_dataset():
    """Returns the comprehensive dataset audit report."""
    try:
        report = dataset_loader.get_audit_report()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")

@router.get("/runs")
async def get_all_runs():
    """Returns the list of all experimental runs with metadata."""
    try:
        catalog = dataset_loader.get_runs_catalog()
        return {"total": len(catalog), "runs": catalog}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching runs: {str(e)}")

@router.get("/run/{run_index}/signal")
async def get_run_signal_waveform(run_index: int, points: int = Query(600, ge=100, le=3000)):
    """Returns downsampled sensor waveforms for an individual run for visualization."""
    try:
        data = dataset_loader.get_run_signal(run_index, downsample_points=points)
        return data
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/features")
async def get_features_summary():
    """Returns summary of all extracted statistical features and correlation analysis."""
    try:
        summary = feature_extractor.get_feature_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")

@router.get("/scatter")
async def get_scatter_data(feature: str = Query("smcAC_rms")):
    """Returns (feature_value, VB) coordinates across all 146 valid runs."""
    try:
        data = feature_extractor.get_scatter_data(feature)
        return {"feature": feature, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vb-distribution")
async def get_vb_distribution():
    """Returns histogram bins for tool flank wear (VB)."""
    try:
        data = feature_extractor.get_vb_distribution()
        return {"distribution": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preprocess")
async def execute_data_preprocessing(request: PreprocessRequest):
    """Executes the data preprocessing pipeline (missing values, splitting, scaling)."""
    try:
        result = preprocessor.execute_preprocessing(
            scaler_type=request.scaler_type,
            split_strategy=request.split_strategy,
            selected_feature_names=request.selected_features,
            test_case_ids=request.test_cases,
            val_case_ids=request.val_cases
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

@router.get("/preprocessing-status")
async def get_preprocessing_status():
    """Returns the current preprocessing state, data splits, and scaling parameters."""
    return preprocessor.get_preprocessing_status()


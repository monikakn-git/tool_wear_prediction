from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from backend.config import REPORTS_DIR
from backend.reports.report_generator import report_generator

router = APIRouter(prefix="/api/report", tags=["Report Generation"])

@router.get("/generate")
async def generate_project_report():
    """Generates and returns comprehensive markdown and JSON project report."""
    try:
        res = report_generator.generate_report()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/download")
async def download_project_report():
    """Provides the generated markdown report file for download."""
    report_file = REPORTS_DIR / "tool_wear_project_report.md"
    if not report_file.exists():
        # Auto-generate if not yet created
        report_generator.generate_report()

    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Report file could not be generated.")

    return FileResponse(
        path=report_file,
        filename="NASA_Milling_Tool_Wear_ANN_Report.md",
        media_type="text/markdown"
    )


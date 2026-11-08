import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.config import DEFAULT_DATASET_PATH, PROJECT_ROOT
from backend.api.dataset_routes import router as dataset_router
from backend.api.model_routes import router as model_router
from backend.api.report_routes import router as report_router
from backend.api.tools_routes import router as tools_router
from backend.api.inspection_routes import router as inspection_router
from backend.api.life_routes import router as life_router
from backend.api.recommendation_routes import router as recommendation_router

# Import DB initialisation and catalogue seeding
from backend.database.models import Base, engine
from backend.tool_catalogue.catalogue_service import ToolCatalogueService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    print("[STARTUP] Smart Tool Intelligence System initialized.")

    # Ensure database tables exist
    Base.metadata.create_all(engine)

    # Seed default tool catalogue if empty
    catalogue = ToolCatalogueService()
    seed_result = catalogue.seed_default_tools()
    print(f"[STARTUP] Tool catalogue: {seed_result['message']}")

    if DEFAULT_DATASET_PATH.exists():
        print(f"[STARTUP] Verified dataset at: {DEFAULT_DATASET_PATH}")

    yield
    print("[SHUTDOWN] Smart Tool Intelligence System shutdown complete.")


app = FastAPI(
    title="AI-Powered Smart Tool Intelligence API",
    description=(
        "Manufacturing tool identification, wear prediction, "
        "condition inspection, life estimation, and operation recommendation system. "
        "Powered by ANN regression on the NASA Milling Wear Dataset."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(dataset_router)
app.include_router(model_router)
app.include_router(report_router)
app.include_router(tools_router)
app.include_router(inspection_router)
app.include_router(life_router)
app.include_router(recommendation_router)


@app.get("/api/health")
async def health_check():
    """Health status and environment verification."""
    has_dataset = DEFAULT_DATASET_PATH.exists()
    catalogue = ToolCatalogueService()
    stats = catalogue.get_tool_stats()
    return {
        "status": "healthy",
        "service": "AI-Powered Smart Tool Intelligence System",
        "version": "2.0.0",
        "dataset_available": has_dataset,
        "dataset_path": str(DEFAULT_DATASET_PATH) if has_dataset else None,
        "total_registered_tools": stats["total_tools"],
        "total_assessments": stats["total_assessments"],
        "modules": {
            "tool_identification": True,
            "wear_prediction": True,
            "visual_inspection": True,
            "tool_life_estimation": True,
            "operation_recommendations": True,
        }
    }


# Serve built React SPA if present
frontend_dist = PROJECT_ROOT / "frontend" / "dist"
if (frontend_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = frontend_dist / full_path
        if full_path and target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

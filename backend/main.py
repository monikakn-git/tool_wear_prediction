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
from backend.data_processing.dataset_loader import dataset_loader

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fast startup - lazy load dataset on first endpoint query
    print("[STARTUP] Industrial ML Engine initialized.")
    if DEFAULT_DATASET_PATH.exists():
        print(f"[STARTUP] Verified dataset at: {DEFAULT_DATASET_PATH}")
    yield
    print("[SHUTDOWN] Industrial ML Engine shutdown complete.")

app = FastAPI(
    title="Generalized Tool Wear Prediction API",
    description="High-precision industrial ANN regression system for tool flank wear (VB) prediction on NASA Milling Dataset",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default: http://localhost:5173, plus others)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dataset_router)
app.include_router(model_router)
app.include_router(report_router)

@app.get("/api/health")
async def health_check():
    """Health status and environment verification."""
    has_dataset = DEFAULT_DATASET_PATH.exists()
    return {
        "status": "healthy",
        "service": "Generalized Tool Wear Prediction API",
        "dataset_available": has_dataset,
        "dataset_path": str(DEFAULT_DATASET_PATH) if has_dataset else None,
        "frameworks": {
            "fastapi": True,
            "tensorflow_enabled": True
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


import io
import os
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

try:
    from .model_service import PlantDiseaseModel
except ImportError:
    from model_service import PlantDiseaseModel


def _resolve_model_path(filename: str, required: bool = True) -> Path:
    backend_dir = Path(__file__).resolve().parent
    fallback_names = [
        filename,
        "fusion_head_final.pth",
        "best.pth",
        "AgriLiteNet_MSAF_final.pth",
    ]
    seen = set()
    candidates = []
    for name in fallback_names:
        if name in seen:
            continue
        seen.add(name)
        candidates.extend([
            backend_dir / "Models" / name,
            backend_dir / "models" / name,
        ])
    for candidate in candidates:
        if candidate.exists():
            return candidate
    if required:
        raise FileNotFoundError(f"Model file not found: {filename}. Checked: {candidates}")
    return candidates[-1]


app = FastAPI(title="Plant Leaf Disease API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = PlantDiseaseModel(
    model_path=_resolve_model_path(
        os.getenv("MODEL_FILE", "fusion_head_final.pth"),
        required=False,
    ),
    class_indices_path=_resolve_model_path(
        os.getenv("CLASS_INDICES_FILE", "class.json"),
        required=True,
    ),
    image_size=(224, 224),
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Load the checkpoint and large feature backbones during service startup so
    # the first user prediction is not delayed by model initialization.
    model.load()
    yield


app.router.lifespan_context = lifespan


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model": "Fusion-DINOv2-CLIP",
        "classes": len(model.class_labels),
        "image_size": model.image_size,
        "model_ready": model.model_path.exists(),
        "model_loaded": model.model is not None,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image.") from exc

    try:
        prediction = model.predict(image)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "The trained fusion checkpoint is missing. "
                "Place fusion_head_final.pth in backend/models."
            ),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed inside the model service: {exc}",
        ) from exc
    return prediction


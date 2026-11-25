"""CareerAI ML service. Run: uvicorn app.main:app --port 8000"""
import json
import logging
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import analyze
from .extract import ExtractionError, extract_text
from .knowledge import IN_DEMAND
from .recommender import recommend, skill_gap
from .trained import get_model

logging.basicConfig(level=logging.INFO)
MAX_BYTES = 5 * 1024 * 1024

app = FastAPI(title="CareerAI ML Service", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5000", "http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def _load_trained_model():
    m = get_model()
    logging.getLogger("careerai").info("Trained model available: %s %s", m.available, m.reason or "")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model/status")
def model_status():
    m = get_model()
    return {"available": m.available, "path": str(m.path), "reason": m.reason}


@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), interests: Optional[str] = Form(None),
                         preferred_roles: Optional[str] = Form(None), job_description: Optional[str] = Form(None)):
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File too large (max 5 MB).")
    try:
        text, meta = extract_text(file.filename or "", data)
    except ExtractionError as exc:
        raise HTTPException(422, str(exc))
    meta["filename"] = file.filename
    meta["size_bytes"] = len(data)

    def _list(v):
        if not v:
            return []
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, list) else [str(parsed)]
        except json.JSONDecodeError:
            return [x.strip() for x in v.split(",") if x.strip()]

    analysis = analyze(text, meta)
    recs = recommend(analysis, _list(interests), _list(preferred_roles))
    gap = skill_gap(analysis, recs, IN_DEMAND)

    # Trained (Colab) model: optional. A failure here must not break the core analysis.
    try:
        trained = get_model().analyze(text, job_description=(job_description or "")[:8000])
    except Exception as exc:  # e.g. NLTK data unavailable
        logging.getLogger("careerai").exception("Trained model inference failed")
        trained = {"available": False, "reason": f"Inference failed: {type(exc).__name__}: {exc}"}

    return {"analysis": analysis, "recommendations": recs, "skill_gap": gap,
            "trained_model": trained, "extracted_text": text[:20000]}

from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List

import joblib
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

# ---------- Config ----------
LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
MODEL_PATH = Path("models/best_multilabel_tfidf_logreg.joblib")

app = FastAPI(
    title="ToxiScan API",
    version="1.0.0",
    description="API FastAPI pour la détection multi-label de toxicité (6 labels).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None  # chargé au démarrage


# ---------- Schemas ----------
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Texte à analyser")


class PredictResponse(BaseModel):
    text: str
    predictions: Dict[str, int]
    probabilities: Dict[str, float]


# ---------- Helpers ----------
def _extract_probas(probas_out, n_labels: int) -> List[float]:
    """
    OneVsRestClassifier.predict_proba peut renvoyer:
    - un array (n_samples, n_labels)  -> cas le plus fréquent
    - une liste de n_labels arrays (n_samples, 2) -> selon versions/configs
    On renvoie toujours une liste de floats de longueur n_labels (proba classe 1).
    """
    if probas_out is None:
        return [0.0] * n_labels

    # Cas 1 : array-like (n_samples, n_labels)
    # Exemple: probas_out[0] -> [p_label1, ..., p_label6]
    try:
        first_row = probas_out[0]
        if hasattr(first_row, "__len__") and len(first_row) == n_labels and not hasattr(first_row[0], "__len__"):
            return [float(p) for p in first_row]
    except Exception:
        pass

    # Cas 2 : liste de n_labels arrays (n_samples, 2)
    # Exemple: probas_out[j][0,1] = proba classe 1 du label j
    try:
        if isinstance(probas_out, list) and len(probas_out) == n_labels:
            return [float(probas_out[j][0, 1]) for j in range(n_labels)]
    except Exception:
        pass

    # Fallback
    return [0.0] * n_labels


# ---------- Startup: load model once ----------
@app.on_event("startup")
def load_model() -> None:
    global model
    if not MODEL_PATH.exists():
        model = None
        return
    model = joblib.load(MODEL_PATH)


# ---------- Endpoints ----------
@app.get("/health")
def health() -> Dict[str, Any]:
    """Health check: OK si modèle chargé."""
    return {
        "status": "ok" if model is not None else "error",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "labels": LABELS,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    """
    Prédiction sur un seul texte.
    Retourne: 6 labels (0/1) + probabilités (0..1) par label.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Check MODEL_PATH.")

    text = payload.text.strip()

    # predict -> array shape (1, 6)
    y_pred = model.predict([text])[0]

    # predict_proba -> variable selon sklearn => on gère proprement
    try:
        probas_out = model.predict_proba([text])
        y_proba = _extract_probas(probas_out, len(LABELS))
    except Exception:
        y_proba = [0.0] * len(LABELS)

    predictions = {lab: int(y_pred[i]) for i, lab in enumerate(LABELS)}
    probabilities = {lab: round(float(y_proba[i]), 4) for i, lab in enumerate(LABELS)}

    return PredictResponse(text=text, predictions=predictions, probabilities=probabilities)


@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Batch prediction depuis un CSV uploadé.
    CSV attendu: une colonne 'comment_text' OU 'text'.
    Retour: liste de lignes + prédictions + probabilités.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Check MODEL_PATH.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    content = await file.read()
    try:
        df = pd.read_csv(pd.io.common.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    # colonne texte
    text_col = None
    for c in ["comment_text", "text"]:
        if c in df.columns:
            text_col = c
            break
    if text_col is None:
        raise HTTPException(status_code=400, detail="CSV must contain 'comment_text' or 'text' column")

    texts = df[text_col].fillna("").astype(str).tolist()

    y_pred = model.predict(texts)  # (n,6)

    # probas
    try:
        probas_out = model.predict_proba(texts)

        # Cas array (n,6)
        # probas_out[i][j] = proba du label j pour la ligne i
        probs_matrix = None
        try:
            if len(probas_out) == len(texts) and len(probas_out[0]) == len(LABELS):
                probs_matrix = probas_out
        except Exception:
            probs_matrix = None

        if probs_matrix is not None:
            probs = [[float(probs_matrix[i][j]) for j in range(len(LABELS))] for i in range(len(texts))]
        else:
            # Cas liste de 6 arrays (n,2)
            probs = []
            for i in range(len(texts)):
                row = []
                for j in range(len(LABELS)):
                    row.append(float(probas_out[j][i, 1]))
                probs.append(row)

    except Exception:
        probs = [[0.0] * len(LABELS) for _ in range(len(texts))]

    results = []
    for i, t in enumerate(texts):
        results.append(
            {
                "text": t,
                "predictions": {LABELS[j]: int(y_pred[i, j]) for j in range(len(LABELS))},
                "probabilities": {LABELS[j]: round(float(probs[i][j]), 4) for j in range(len(LABELS))},
            }
        )

    return {"n_rows": len(results), "results": results}

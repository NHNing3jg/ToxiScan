from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from typing import Dict, Any, List

import joblib
import pandas as pd
import requests
from bs4 import BeautifulSoup, Comment

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

# ---------- Config ----------
LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
MODEL_PATH = Path("models/best_multilabel_tfidf_logreg.joblib")
DEFAULT_THRESHOLD = 0.35
MIN_TEXT_LEN = 20

app = FastAPI(
    title="ToxiScan API",
    version="2.1.0",
    description="Détection multi-label de toxicité — texte, batch CSV et URL.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


# ═══════════════════════════════════════════════════════
#  Schemas
# ═══════════════════════════════════════════════════════

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1)

class PredictResponse(BaseModel):
    text: str
    predictions: Dict[str, int]
    probabilities: Dict[str, float]

class URLRequest(BaseModel):
    url: str = Field(..., description="URL accessible (http/https ou localhost)")
    threshold: float = Field(default=DEFAULT_THRESHOLD, ge=0.0, le=1.0)
    max_texts: int = Field(default=50, ge=1, le=200)


# ═══════════════════════════════════════════════════════
#  Text utilities
# ═══════════════════════════════════════════════════════

def _clean(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\u200b\u200c\u200d\ufeff\xa0]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def _valid(text: str) -> bool:
    if len(text) < MIN_TEXT_LEN:
        return False
    alpha = sum(c.isalpha() for c in text) / max(len(text), 1)
    return alpha >= 0.25

def _dedup(texts: List[str]) -> List[str]:
    seen, out = set(), []
    for t in texts:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


# ═══════════════════════════════════════════════════════
#  Scraper — ordered CSS selectors (most specific first)
# ═══════════════════════════════════════════════════════

SELECTORS = [
    # ── ToxiScan demo page ──────────────────────────────
    ("div",     {"class": "comment-body"}),

    # ── HackerNews ─────────────────────────────────────
    ("span",    {"class": "commtext"}),

    # ── Reddit (old + new) ──────────────────────────────
    ("div",     {"class": "md"}),
    ("div",     {"data-testid": "comment"}),

    # ── Generic comment patterns ────────────────────────
    ("div",     {"class": "comment-content"}),
    ("div",     {"class": "comment-text"}),
    ("div",     {"class": "comment"}),
    ("article", None),

    # ── Ultimate fallback ───────────────────────────────
    ("p",       None),
]

NOISE_TAGS = {"script", "style", "noscript", "head", "nav", "footer", "aside", "form"}


def _scrape(soup: BeautifulSoup) -> List[str]:
    """Extract and clean text candidates from a BeautifulSoup tree."""
    for tag in soup(NOISE_TAGS):
        tag.decompose()
    for node in soup.find_all(string=lambda s: isinstance(s, Comment)):
        node.extract()

    texts: List[str] = []
    for tag, attrs in SELECTORS:
        elements = soup.find_all(tag, attrs) if attrs else soup.find_all(tag)
        for el in elements:
            t = _clean(el.get_text(separator=" ", strip=True))
            if _valid(t):
                texts.append(t)
        if texts:
            break  # Stop at first selector that yields results

    return _dedup(texts)


# ═══════════════════════════════════════════════════════
#  Model prediction core
# ═══════════════════════════════════════════════════════

def _get_probas(texts: List[str]) -> List[List[float]]:
    """
    Extract per-label probabilities from model.predict_proba().
    MultiOutputClassifier returns a list of N_labels arrays,
    each of shape (n_samples, 2). Column 1 = P(positive).
    """
    raw = model.predict_proba(texts)

    # Case A: list of arrays — MultiOutputClassifier
    if isinstance(raw, list) and len(raw) == len(LABELS):
        return [
            [float(raw[j][i, 1]) for j in range(len(LABELS))]
            for i in range(len(texts))
        ]

    # Case B: single 2-D array (Pipeline variant)
    import numpy as np
    arr = np.array(raw)
    if arr.ndim == 2 and arr.shape[1] == len(LABELS):
        return [list(map(float, arr[i])) for i in range(len(texts))]

    raise ValueError(
        f"predict_proba output inattendu : type={type(raw)}, "
        f"len={len(raw) if isinstance(raw, list) else 'n/a'}"
    )


def _run(texts: List[str], threshold: float) -> List[Dict[str, Any]]:
    """Run model on texts and return structured results."""
    probs_matrix = _get_probas(texts)
    results = []
    for i, text in enumerate(texts):
        probs = {LABELS[j]: round(probs_matrix[i][j], 4) for j in range(len(LABELS))}
        preds = {lab: int(probs[lab] >= threshold) for lab in LABELS}
        top_label = max(probs, key=probs.get)
        results.append({
            "text":          text,
            "predictions":   preds,
            "probabilities": probs,
            "is_toxic":      any(v == 1 for v in preds.values()),
            "top_label":     top_label,
            "top_prob":      probs[top_label],
        })
    return results


def _aggregate(results: List[Dict], threshold: float) -> Dict[str, Any]:
    n = len(results)
    n_toxic = sum(1 for r in results if r["is_toxic"])
    counts  = {lab: sum(r["predictions"][lab] for r in results) for lab in LABELS}
    means   = {
        lab: round(sum(r["probabilities"][lab] for r in results) / n, 4)
        for lab in LABELS
    }
    return {
        "total_texts":              n,
        "toxic_count":              n_toxic,
        "toxicity_rate":            round(n_toxic / n, 4) if n else 0,
        "threshold_used":           threshold,
        "label_hit_counts":         counts,
        "label_mean_probabilities": means,
    }


# ═══════════════════════════════════════════════════════
#  Startup
# ═══════════════════════════════════════════════════════

@app.on_event("startup")
def load_model() -> None:
    global model
    model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None


# ═══════════════════════════════════════════════════════
#  Endpoints
# ═══════════════════════════════════════════════════════

@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status":       "ok" if model is not None else "error",
        "model_loaded": model is not None,
        "model_path":   str(MODEL_PATH),
        "labels":       LABELS,
    }


# ── /predict ────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if model is None:
        raise HTTPException(500, "Model not loaded")
    text = _clean(payload.text)
    if not text:
        raise HTTPException(422, "Texte vide après nettoyage")
    probs_matrix = _get_probas([text])
    probs = {LABELS[j]: round(probs_matrix[0][j], 4) for j in range(len(LABELS))}
    preds = {lab: int(probs[lab] >= DEFAULT_THRESHOLD) for lab in LABELS}
    return PredictResponse(text=text, predictions=preds, probabilities=probs)


# ── /predict_batch ───────────────────────────────────────
@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...)) -> Dict[str, Any]:
    if model is None:
        raise HTTPException(500, "Model not loaded")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Veuillez uploader un fichier .csv")
    content = await file.read()
    try:
        df = pd.read_csv(pd.io.common.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"CSV invalide : {e}")
    text_col = next((c for c in ["comment_text", "text"] if c in df.columns), None)
    if text_col is None:
        raise HTTPException(400, "Le CSV doit contenir une colonne 'comment_text' ou 'text'")
    texts = [_clean(t) for t in df[text_col].fillna("").astype(str)]
    texts = [t for t in texts if t]
    results = _run(texts, DEFAULT_THRESHOLD)
    return {"n_rows": len(results), "results": results}


# ── /predict_url ─────────────────────────────────────────
@app.post("/predict_url")
def predict_url(payload: URLRequest) -> Dict[str, Any]:
    """
    Récupère une page web et analyse sa toxicité.

    ✅ Test avec la page démo locale :
       1. cd dossier/contenant/demo_toxic_page.html
       2. python -m http.server 9000
       3. url = "http://localhost:9000/demo_toxic_page.html"
    """
    if model is None:
        raise HTTPException(500, "Model not loaded")

    url = payload.url.strip()

    try:
        r = requests.get(
            url,
            timeout=12,
            headers={"User-Agent": "Mozilla/5.0 (ToxiScan/2.1)"},
            allow_redirects=True,
        )
        r.raise_for_status()
        if r.encoding and r.encoding.lower() not in ("utf-8", "utf8"):
            r.encoding = r.apparent_encoding
    except requests.exceptions.Timeout:
        raise HTTPException(408, "Timeout : la page met trop de temps à répondre")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(400, f"Erreur HTTP {e.response.status_code}")
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            400,
            "Connexion refusée. Assurez-vous que 'python -m http.server 9000' est démarré."
        )
    except Exception as e:
        raise HTTPException(400, f"Erreur de chargement : {e}")

    soup  = BeautifulSoup(r.text, "html.parser")
    texts = _scrape(soup)

    if not texts:
        raise HTTPException(
            404,
            "Aucun texte trouvé. Balises reconnues : "
            "<div class='comment-body'>, <p>, <span class='commtext'>, ..."
        )

    n_scraped        = len(texts)
    texts_to_analyze = texts[: payload.max_texts]
    results          = _run(texts_to_analyze, payload.threshold)
    agg              = _aggregate(results, payload.threshold)
    toxic_only       = sorted(
        [r for r in results if r["is_toxic"]],
        key=lambda r: r["top_prob"],
        reverse=True,
    )

    return {
        "url":              url,
        "n_texts_scraped":  n_scraped,
        "n_texts_analyzed": len(results),
        "threshold_used":   payload.threshold,
        "aggregate":        agg,
        "toxic_texts":      toxic_only,
        "results":          results,
    }
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import joblib
import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Expense Tracker ML Service")

MODEL_PATH = "models/category_model.pkl"
SEED_DATA_PATH = "data/system_category_seed.csv"
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# ===== GLOBAL STATE =====
model = None
embedding_model = None


# ===== DTO =====
class TrainingItem(BaseModel):
    note: str
    type: str
    amount: float
    categoryId: int


class TrainRequest(BaseModel):
    data: List[TrainingItem]


class PredictRequest(BaseModel):
    note: str
    type: str
    amount: float


class PredictResponse(BaseModel):
    categoryId: Optional[int]
    confidence: float
    source: str = "ml_global"


class SemanticCategoryItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    keywords: Optional[str] = None


class SemanticPredictRequest(BaseModel):
    note: str
    type: str
    amount: float
    categories: List[SemanticCategoryItem]


class SemanticPredictResponse(BaseModel):
    categoryId: Optional[int]
    confidence: float
    source: str = "semantic"
    reason: Optional[str] = None


# ===== STARTUP =====
@app.on_event("startup")
def startup():
    global model, embedding_model

    # Load ML model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(" ML model loaded")

    # Load embedding model
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embedding_model.encode("warmup")
    print(" Embedding model ready")


# ===== UTIL =====
def normalize_text(value: str) -> str:
    return (value or "").strip().lower()


def build_text(note: str, type_: str, amount: float) -> str:
    note = normalize_text(note)
    type_ = normalize_text(type_)

    if amount < 50000:
        bucket = "small_amount"
    elif amount < 500000:
        bucket = "medium_amount"
    else:
        bucket = "large_amount"

    return f"{type_} {bucket} {note}"


def cosine_similarity(a, b) -> float:
    a = np.array(a)
    b = np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return 0.0 if denom == 0 else float(np.dot(a, b) / denom)


def build_category_text(cat: SemanticCategoryItem) -> str:
    return f"{normalize_text(cat.name)}. {normalize_text(cat.description or '')}. {normalize_text(cat.keywords or '')}"


# ===== TRAIN =====
def train_pipeline(rows):
    global model

    if len(rows) < 20:
        raise HTTPException(400, "Need at least 20 samples")

    x = [build_text(r["note"], r["type"], r["amount"]) for r in rows]
    y = [str(r["categoryId"]) for r in rows]

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))
    ])

    pipeline.fit(x, y)

    os.makedirs("models", exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    model = pipeline 

    return {
        "message": "trained",
        "samples": len(rows),
        "classes": list(pipeline.classes_)
    }


@app.post("/train")
def train(request: TrainRequest):
    rows = [
        {
            "note": i.note,
            "type": i.type,
            "amount": i.amount,
            "categoryId": i.categoryId
        }
        for i in request.data if i.note.strip()
    ]

    return train_pipeline(rows)


@app.post("/train-seed")
def train_seed():
    if not os.path.exists(SEED_DATA_PATH):
        raise HTTPException(404, "Seed not found")

    df = pd.read_csv(SEED_DATA_PATH)

    rows = df.to_dict(orient="records")

    return train_pipeline(rows)


# ===== PREDICT =====
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(400, "Model not loaded")

    text = build_text(req.note, req.type, req.amount)

    pred = model.predict([text])[0]

    conf = 0.0
    if hasattr(model, "predict_proba"):
        conf = float(max(model.predict_proba([text])[0]))

    return PredictResponse(
        categoryId=int(pred),
        confidence=conf
    )


# ===== SEMANTIC =====
@app.post("/semantic/predict", response_model=SemanticPredictResponse)
def semantic_predict(req: SemanticPredictRequest):
    if not req.note.strip():
        return SemanticPredictResponse(categoryId=None, confidence=0, reason="Empty note")

    if not req.categories:
        return SemanticPredictResponse(categoryId=None, confidence=0, reason="No categories")

    transaction_emb = embedding_model.encode(req.note)

    category_texts = [build_category_text(c) for c in req.categories]
    category_embs = embedding_model.encode(category_texts)

    best_idx = -1
    best_score = -1

    for i, emb in enumerate(category_embs):
        score = cosine_similarity(transaction_emb, emb)
        if score > best_score:
            best_score = score
            best_idx = i

    if best_idx == -1 or best_score < 0.45:
        return SemanticPredictResponse(
            categoryId=None,
            confidence=best_score,
            reason="Low similarity"
        )

    return SemanticPredictResponse(
        categoryId=req.categories[best_idx].id,
        confidence=best_score,
        reason=f"Closest to {req.categories[best_idx].name}"
    )

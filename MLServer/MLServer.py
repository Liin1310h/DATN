from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union
from enum import IntEnum
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

class TransactionType(IntEnum):
    EXPENSE = 1
    INCOME = 2
    TRANSFER = 3
    BORROW = 4
    LEND = 5

# ! -----------------------------------------------------------------------------
# region #!DTOs
# ! -----------------------------------------------------------------------------
# request training data (note, type, amount, categoryId)
class TrainingItem(BaseModel):
    note: str
    type: Union[TransactionType, str, int]
    amount: float
    categoryId: int


class TrainRequest(BaseModel):
    data: List[TrainingItem]

# request cho prediction (note, type, amount)
class PredictRequest(BaseModel):
    note: str
    type: Union[TransactionType, str, int]
    amount: float

# response cho prediction (categoryId, confidence, source)
class PredictResponse(BaseModel):
    categoryId: Optional[int]
    confidence: float
    source: str = "ml_global"

# semantic category item (id, name, description, keywords)
class SemanticCategoryItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    keywords: Optional[str] = None

# request cho semantic prediction (note, type, amount, categories)
class SemanticPredictRequest(BaseModel):
    note: str
    type: Union[TransactionType, str, int]
    amount: float
    categories: List[SemanticCategoryItem]

# response cho semantic prediction (categoryId, confidence, source, reason)
class SemanticPredictResponse(BaseModel):
    categoryId: Optional[int]
    confidence: float
    source: str = "semantic"
    reason: Optional[str] = None
# ! -----------------------------------------------------------------------------
# endregion
# ! -----------------------------------------------------------------------------

# ! -----------------------------------------------------------------------------
# region Startup
# ! -----------------------------------------------------------------------------
@app.on_event("startup")
def startup():
    global model, embedding_model

    # Load model vào biến global: model (global)
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(" ML model loaded")

    # Load embedding model (semantic)
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embedding_model.encode("warmup")
    print(" Embedding model ready")
# ! -----------------------------------------------------------------------------
# endregion
# ! -----------------------------------------------------------------------------

# ! -----------------------------------------------------------------------------
# region Hàm bổ trợ
# ! -----------------------------------------------------------------------------
#TODO: Chuẩn hoá dữ liệu
def normalize_text(value: str) -> str:
    """
    Chuẩn hoá dữ liệu
    """
    return (value or "").strip().lower()

def normalize_transaction_type(value) -> str:
    """
    Chuyển TransactionType =>string
    """
    if value is None:
        return ""

    if isinstance(value, TransactionType):
        value = value.value

    try:
        value_int = int(value)
        if value_int == 1:
            return "expense"
        if value_int == 2:
            return "income"
        if value_int == 3:
            return "transfer"
        if value_int == 4:
            return "borrow"
        if value_int == 5:
            return "lend"
    except Exception:
        pass

    text = str(value).strip().lower()

    return text

# TODO: Kết hợp note, type, amount thành 1 text để đưa vào model
def build_text(note: str, type_, amount: float) -> str:
    """
    Kết hợp note, type, amount thành 1 text để đưa vào model
    """
    note = normalize_text(note)
    type_ = normalize_transaction_type(type_)

    if amount < 50000:
        bucket = "small_amount"
    elif amount < 500000:
        bucket = "medium_amount"
    else:
        bucket = "large_amount"

    return f"{type_} {bucket} {note}"

# Tính độ giống nhau giữa 2 vector (transaction và category) để dự đoán category cho transaction
def cosine_similarity(a, b) -> float:
    a = np.array(a)
    b = np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    # return cos góc giữa 2 vector
    return 0.0 if denom == 0 else float(np.dot(a, b) / denom)

#TODO: Build text cho semantic category (kết hợp name, description, keywords)
def build_category_text(cat: SemanticCategoryItem) -> str:
    return f"{normalize_text(cat.name)}. {normalize_text(cat.description or '')}. {normalize_text(cat.keywords or '')}"

# ! -----------------------------------------------------------------------------
# region Train global ai
# ! -----------------------------------------------------------------------------
# Tạo model Global ai
def train_pipeline(rows):
    global model

    valid_rows = []

    for r in rows:
        note = str(r.get("note", "")).strip()
        type_text = normalize_transaction_type(r.get("type"))
        category_id = r.get("categoryId")

        if not note:
            continue

        if type_text != "expense":
            continue

        if category_id is None or pd.isna(category_id):
            continue

        valid_rows.append({
            "note": note,
            "type": type_text,
            "amount": float(r.get("amount", 0)),
            "categoryId": int(category_id)
        })
    
    # Validate
    if len(valid_rows) < 20:
        raise HTTPException(400, "Need at least 20 samples")

    # Input x
    x = [build_text(r["note"], r["type"], r["amount"]) for r in valid_rows]
    # Output y
    y = [str(r["categoryId"]) for r in valid_rows]

    pipeline = Pipeline([
        # text => vector số
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        # model phân loại
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))
    ])

    pipeline.fit(x, y)

    # Lưu model
    os.makedirs("models", exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    model = pipeline 

    return {
        "message": "trained",
        "samples": len(rows),
        "classes": list(pipeline.classes_)
    }

# Train từ dữ liệu bên ngoài
@app.post("/train")
def train(request: TrainRequest):
    # Nhận data=> lọc dữ liệu hợp lệ
    rows = [
        {
            "note": i.note,
            "type": normalize_transaction_type(i.type),
            "amount": i.amount,
            "categoryId": i.categoryId
        }
        for i in request.data 
    ]
    # Gọi hàm train
    return train_pipeline(rows)

# Train từ file .csv
@app.post("/train-seed")
def train_seed():
    """
    Train từ file .csv
    """
    if not os.path.exists(SEED_DATA_PATH):
        raise HTTPException(404, "Seed not found")

    df = pd.read_csv(SEED_DATA_PATH)

    rows = df.to_dict(orient="records")

    return train_pipeline(rows)


# ! -----------------------------------------------------------------------------
# region Predict global ai
# ! -----------------------------------------------------------------------------
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(400, "Model not loaded")

    type_text = normalize_transaction_type(req.type)

    if type_text != "expense":
        return PredictResponse(
            categoryId=None,
            confidence=0.0,
            source="ml_global"
        )

    if not req.note.strip():
        return PredictResponse(
            categoryId=None,
            confidence=0.0,
            source="ml_global"
        )
    
    text = build_text(req.note, type_text, req.amount)

    # Dự đoán
    pred = model.predict([text])[0]

    # Tính conf
    conf = 0.0
    if hasattr(model, "predict_proba"):
        conf = float(max(model.predict_proba([text])[0]))

    return PredictResponse(
        categoryId=int(pred),
        confidence=conf,
        source="ml_global"
    )


# ! -----------------------------------------------------------------------------
# region Predict semantic
# ! -----------------------------------------------------------------------------
@app.post("/semantic/predict", response_model=SemanticPredictResponse)
def semantic_predict(req: SemanticPredictRequest):
    type_text = normalize_transaction_type(req.type)

    if type_text != "expense":
        return SemanticPredictResponse(
            categoryId=None,
            confidence=0.0,
            reason="Unsupported transaction type"
        )
    
    if not req.note.strip():
        return SemanticPredictResponse(categoryId=None, confidence=0, reason="Empty note")

    if not req.categories:
        return SemanticPredictResponse(categoryId=None, confidence=0, reason="No categories")

    # encode note và categories thành embedding vector
    transaction_emb = embedding_model.encode(req.note)

    category_texts = [build_category_text(c) for c in req.categories]
    category_embs = embedding_model.encode(category_texts)

    # ! Dựa vào similarity giữa transaction_emb và category_embs để chọn category phù hợp nhất
    best_idx = -1
    best_score = -1.0
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

from fastapi import FastAPI, UploadFile, File, HTTPException
import numpy as np
import cv2
import time
import traceback

from app.ocr_engine import ocr_engine

app = FastAPI(
    title="Expense Tracker OCR Server",
    version="1.0.0"
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ocr"
    }


@app.post("/ocr")
def ocr(file: UploadFile = File(...)):
    """
    Không dùng async ở đây vì PaddleOCR là tác vụ CPU-bound.
    Dùng def thường sẽ phù hợp hơn trong FastAPI.
    """

    start_time = time.time()

    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        contents = file.file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="Empty file"
            )

        # Decode ảnh bằng OpenCV, nhanh hơn PIL trong trường hợp này
        np_arr = np.frombuffer(contents, np.uint8)
        image_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image_np is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image"
            )

        result = ocr_engine.extract(image_np)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "success": True,
            "mode": result.get("mode", "unknown"),
            "raw_text": result["raw_text"],
            "lines": result["lines"],
            "avg_confidence": result["avg_confidence"],
            "elapsed_ms": elapsed_ms
        }

    except HTTPException:
        raise

    except Exception as e:
        print("===== OCR ERROR =====")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"OCR error: {str(e)}"
        )
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import numpy as np
import io

from app.ocr_engine import ocr_engine

app = FastAPI()


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Resize khi ảnh quá lớn
        max_width = 1200

        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize(
                (max_width, int(image.height * ratio))
            )

        image_np = np.array(image)

        result = ocr_engine.extract(image_np)

        return {
            "success": True,
            "raw_text": result["raw_text"],
            "lines": result["lines"],
            "avg_confidence": result["avg_confidence"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")
import cv2
import numpy as np
from paddleocr import PaddleOCR

class OCREngine:
    def __init__(self):
        self.ocr = PaddleOCR(
            use_angle_cls=False,
            lang="vi",
            det_limit_side_len=960,
            det_db_box_thresh=0.5
        )

    def preprocess(self, image):
        # Ảnh đầu vào từ PIL là RGB
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        # Tăng tương phản nhẹ
        gray = cv2.convertScaleAbs(gray, alpha=1.3, beta=5)

        # Giảm nhiễu nhẹ
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        img = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

        return img

    def extract(self, image_np):
        img = self.preprocess(image_np)

        result = self.ocr.ocr(img)

        if not result or result == [None]:
            return {"raw_text": "", "lines": [], "avg_confidence": 0}

        lines = []
        total_conf = 0.0

        first = result[0]

        # dict (OCRv5)
        if isinstance(first, dict):
            texts = first.get("rec_texts", [])
            scores = first.get("rec_scores", [])
            boxes = first.get("rec_polys", []) 

            for i in range(len(texts)):
                text = str(texts[i]).strip()
                conf = float(scores[i])

                bbox = boxes[i]
                if hasattr(bbox, "tolist"):
                    bbox = bbox.tolist()

                lines.append({
                    "index": i,
                    "text": text,
                    "confidence": conf,
                    "bbox": bbox
                })

                total_conf += conf

        # format cũ
        elif isinstance(first, list):
            for i, line in enumerate(first):
                if not line or len(line) < 2:
                    continue

                bbox = line[0]

                if isinstance(line[1], (list, tuple)):
                    text, conf = line[1]
                else:
                    continue

                lines.append({
                    "index": i,
                    "text": str(text).strip(),
                    "confidence": float(conf),
                    "bbox": bbox
                })

                total_conf += conf

        raw_text = "\n".join([l["text"] for l in lines])
        avg_conf = total_conf / len(lines) if lines else 0

        return {
            "raw_text": raw_text,
            "lines": lines,
            "avg_confidence": avg_conf
        }

ocr_engine = OCREngine()
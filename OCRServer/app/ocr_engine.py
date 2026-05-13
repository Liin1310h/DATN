import os
from threading import Lock

import cv2
import numpy as np
from paddleocr import PaddleOCR


# =========================
# 1. GIỚI HẠN CPU THREAD
# =========================
# Tránh việc PaddleOCR ăn toàn bộ CPU trong Docker
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "2")

# Tránh OpenCV tự mở nhiều thread
cv2.setNumThreads(0)


class OCREngine:
    def __init__(self):
        """
        PaddleOCR chỉ load model 1 lần khi container start.
        Không được khởi tạo PaddleOCR trong từng request.
        """

        self.lock = Lock()

        self.ocr = PaddleOCR(
            lang="vi",

            # Không dùng angle classifier để tăng tốc.
            # Hóa đơn nên yêu cầu người dùng chụp thẳng.
            use_angle_cls=False,

            # Giảm kích thước xử lý detection.
            # 960 chính xác hơn nhưng chậm hơn.
            # 736 nhanh hơn, phù hợp hóa đơn rõ.
            det_limit_side_len=736,

            # Threshold detection text box.
            # Giảm nhẹ để bắt được nhiều dòng chữ hơn.
            det_db_thresh=0.3,
            det_db_box_thresh=0.35,

            # Batch recognition giúp nhận dạng nhanh hơn.
            rec_batch_num=8,

            # Giới hạn số thread CPU cho PaddleOCR.
            cpu_threads=2,

            # Tăng tốc CPU nếu Paddle hỗ trợ.
            enable_mkldnn=True
        )

    # =========================
    # 2. RESIZE ẢNH
    # =========================
    def resize_image(self, image: np.ndarray, max_width: int = 1000) -> np.ndarray:
        """
        Resize ảnh trước khi OCR.

        Vì nếu ảnh hóa đơn quá lớn, PaddleOCR sẽ rất chậm.
        Nhưng nếu resize quá nhỏ thì mất dấu tiếng Việt.

        max_width khoảng 1000 - 1200 là hợp lý cho hóa đơn.
        """

        h, w = image.shape[:2]

        if w <= max_width:
            return image

        ratio = max_width / w
        new_h = int(h * ratio)

        return cv2.resize(
            image,
            (max_width, new_h),
            interpolation=cv2.INTER_AREA
        )

    # =========================
    # 3. PREPROCESS NHANH
    # =========================
    def preprocess_fast(self, image: np.ndarray) -> np.ndarray:
        """
        Chế độ nhanh:
        - Resize ảnh
        - Chuyển grayscale
        - Tăng tương phản nhẹ
        - Không blur

        Lý do không blur:
        Blur có thể làm mất dấu tiếng Việt, ví dụ:
        KẾ TOÁN -> KÉ TOÁN
        THIÊN ƯNG -> THIN UNG
        """

        image = self.resize_image(image, max_width=1000)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Tăng tương phản nhẹ, không quá mạnh
        gray = cv2.convertScaleAbs(gray, alpha=1.2, beta=3)

        # PaddleOCR vẫn nhận ảnh 3 kênh tốt hơn
        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    # =========================
    # 4. PREPROCESS MẠNH
    # =========================
    def preprocess_strong(self, image: np.ndarray) -> np.ndarray:
        """
        Chế độ fallback:
        Dùng khi OCR nhanh cho confidence thấp hoặc đọc quá ít dòng.

        Gồm:
        - Resize lớn hơn một chút
        - CLAHE tăng tương phản cục bộ
        - Sharpen nhẹ để rõ nét chữ
        """

        image = self.resize_image(image, max_width=1200)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Tăng tương phản cục bộ, tốt hơn tăng sáng toàn ảnh
        clahe = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8)
        )
        gray = clahe.apply(gray)

        # Sharpen nhẹ
        kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ])

        gray = cv2.filter2D(gray, -1, kernel)

        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    # =========================
    # 5. PARSE KẾT QUẢ PADDLEOCR
    # =========================
    def parse_result(self, result):
        """
        PaddleOCR có thể trả về nhiều format khác nhau tùy version.
        Hàm này xử lý cả:
        - Format cũ: list
        - Format mới OCRv5: dict
        """

        if not result or result == [None]:
            return {
                "raw_text": "",
                "lines": [],
                "avg_confidence": 0.0
            }

        lines = []
        total_confidence = 0.0

        first = result[0]

        # =========================
        # Format mới: dict
        # =========================
        if isinstance(first, dict):
            texts = first.get("rec_texts", [])
            scores = first.get("rec_scores", [])
            boxes = first.get("rec_polys", [])

            for i, text in enumerate(texts):
                text = str(text).strip()

                if not text:
                    continue

                confidence = float(scores[i]) if i < len(scores) else 0.0

                bbox = boxes[i] if i < len(boxes) else []
                if hasattr(bbox, "tolist"):
                    bbox = bbox.tolist()

                lines.append({
                    "index": len(lines),
                    "text": text,
                    "confidence": confidence,
                    "bbox": bbox
                })

                total_confidence += confidence

        # =========================
        # Format cũ: list
        # =========================
        elif isinstance(first, list):
            for line in first:
                if not line or len(line) < 2:
                    continue

                bbox = line[0]
                rec_info = line[1]

                if not isinstance(rec_info, (list, tuple)) or len(rec_info) < 2:
                    continue

                text = str(rec_info[0]).strip()
                confidence = float(rec_info[1])

                if not text:
                    continue

                if hasattr(bbox, "tolist"):
                    bbox = bbox.tolist()

                lines.append({
                    "index": len(lines),
                    "text": text,
                    "confidence": confidence,
                    "bbox": bbox
                })

                total_confidence += confidence

        raw_text = "\n".join([line["text"] for line in lines])
        avg_confidence = total_confidence / len(lines) if lines else 0.0

        return {
            "raw_text": raw_text,
            "lines": lines,
            "avg_confidence": avg_confidence
        }

    # =========================
    # 6. OCR CHÍNH
    # =========================
    def extract(self, image_np: np.ndarray):
        """
        Quy trình:
        1. Chạy OCR nhanh.
        2. Nếu confidence tốt thì trả luôn.
        3. Nếu confidence thấp hoặc đọc quá ít dòng thì chạy fallback mạnh hơn.
        """

        # Fast mode
        fast_img = self.preprocess_fast(image_np)

        with self.lock:
            fast_result = self.ocr.ocr(fast_img)

        fast_parsed = self.parse_result(fast_result)
        fast_parsed["mode"] = "fast"

        # Nếu kết quả đủ tốt thì trả luôn
        if (
            fast_parsed["avg_confidence"] >= 0.72
            and len(fast_parsed["lines"]) >= 3
        ):
            return fast_parsed

        # Strong fallback mode
        strong_img = self.preprocess_strong(image_np)

        with self.lock:
            strong_result = self.ocr.ocr(strong_img)

        strong_parsed = self.parse_result(strong_result)
        strong_parsed["mode"] = "strong"

        # Nếu fallback tốt hơn thì lấy fallback
        if strong_parsed["avg_confidence"] >= fast_parsed["avg_confidence"]:
            return strong_parsed

        # Nếu fallback không tốt hơn thì giữ kết quả fast
        return fast_parsed


ocr_engine = OCREngine()
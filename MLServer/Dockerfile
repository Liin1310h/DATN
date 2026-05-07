# Sử dụng Python 3.11-slim để nhẹ và tương thích scikit-learn 1.8.0
FROM python:3.11-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt công cụ build cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Tối ưu hóa Cache cho thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Copy toàn bộ code
COPY . .

# (Tùy chọn) Chạy một script nhỏ để tải sẵn model Sentence-Transformer 
# Việc này giúp container khởi động nhanh hơn khi 'docker run'
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Mở cổng
EXPOSE 8001

# Lệnh chạy (Sử dụng --workers 1 để tiết kiệm RAM nếu chạy trên máy cá nhân)
CMD ["uvicorn", "MLServer:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
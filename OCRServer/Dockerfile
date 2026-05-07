FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_DEFAULT_TIMEOUT=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN pip install --no-cache-dir --default-timeout=1000 --retries=20 \
    paddlepaddle==3.1.1 \
    -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

RUN pip install --no-cache-dir --default-timeout=1000 --retries=20 \
    paddleocr -r requirements.txt

COPY . .

CMD ["uvicorn", "app.OCRServer:app", "--host", "0.0.0.0", "--port", "8002"]
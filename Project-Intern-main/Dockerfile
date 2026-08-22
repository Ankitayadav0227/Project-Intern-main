# ================================
# 1. BUILD REACT FRONTEND
# ================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files first for better Docker caching
COPY frontend/package*.json ./

RUN npm install --no-audit --no-fund

# Copy React source code
COPY frontend/ ./

# Build React application
RUN npm run build


# ================================
# 2. PYTHON / FLASK BACKEND
# ================================
FROM python:3.12-slim

WORKDIR /app

# Python settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy backend requirements
COPY backend/requirements.txt ./backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Flask backend
COPY backend/ ./backend/

# Copy React production build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Move into Flask backend
WORKDIR /app/backend

# Railway provides PORT automatically
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 2 --threads 4 --timeout 120 app:app"]
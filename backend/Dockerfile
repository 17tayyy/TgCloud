FROM python:3.11.8-slim-bookworm

# Configuración base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copiar requirements y luego instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Crear usuario no root y preparar directorios con permisos correctos
RUN adduser --disabled-password --no-create-home appuser && \
    mkdir -p /app/data && \
    chown -R appuser /app

# Cambiar al usuario sin privilegios
USER appuser

# Exponer puerto
EXPOSE 8000

# Opcional: declarar volumen para persistencia de datos
VOLUME ["/app/data"]

# Comando de ejecución
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

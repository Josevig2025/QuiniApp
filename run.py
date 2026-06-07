"""
run.py — Arranque del servidor QuiniApp
Ejecutar desde CUALQUIER lugar: python run.py
"""
import os
import sys
import subprocess

# Ruta absoluta a backend/
BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")

# Cambiar directorio de trabajo a backend/ antes de invocar uvicorn
# Así Python encuentra 'engines' y 'routers' como si estuvieras parado ahí
os.chdir(BACKEND)

subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--reload",
    "--host", "0.0.0.0",
    "--port", "8000",
], check=True)

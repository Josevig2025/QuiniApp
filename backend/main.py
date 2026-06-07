"""
main.py — QuiniApp Uruguay API
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engines.motor_quiniela  import MotorQuiniela
from engines.motor_tombola   import MotorTombola
from engines.motor_redoblona import MotorRedoblona

from routers import quiniela
from routers import tombola
from routers import redoblona

BASE_DIR         = os.path.dirname(os.path.abspath(__file__))
QUINIELA_DATASET = os.path.join(BASE_DIR, "data", "quiniela.txt")
TOMBOLA_DATASET  = os.path.join(BASE_DIR, "data", "tombola.xlsx")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⚙️  Iniciando QuiniApp backend...")
    mq = MotorQuiniela(QUINIELA_DATASET)
    app.state.motor_quiniela  = mq
    app.state.motor_tombola   = MotorTombola(TOMBOLA_DATASET)
    app.state.motor_redoblona = MotorRedoblona(mq)   # reutiliza el dataset de quiniela
    print("✅ Motores cargados. Servidor listo.")
    yield
    print("🛑 Servidor detenido.")

app = FastAPI(
    title="QuiniApp Uruguay API",
    version="1.0.0",
    description="API de análisis estadístico de Quiniela y Tómbola de Uruguay",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiniela.router)
app.include_router(tombola.router)
app.include_router(redoblona.router)

@app.post("/admin/reload")
def reload_datasets():
    """Recarga los datasets sin reiniciar el servidor."""
    mq = MotorQuiniela(QUINIELA_DATASET)
    app.state.motor_quiniela  = mq
    app.state.motor_tombola.recargar(TOMBOLA_DATASET)
    app.state.motor_redoblona = MotorRedoblona(mq)
    return {
        "status":   "ok",
        "quiniela": app.state.motor_quiniela.info(),
        "tombola":  app.state.motor_tombola.info(),
    }

@app.get("/")
def root():
    return {"app": "QuiniApp Uruguay API", "version": "1.0.0", "status": "running", "docs": "/docs"}

"""
main.py — QuiniApp Backend
FastAPI + CORS configurado para desarrollo local y producción (Vercel/Render).
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engines.motor_quiniela  import MotorQuiniela
from engines.motor_tombola   import MotorTombola
from engines.motor_redoblona import MotorRedoblona

from routers import quiniela, tombola, redoblona

BASE_DIR         = os.path.dirname(__file__)
QUINIELA_DATASET = os.path.join(BASE_DIR, "data", "quiniela.txt")
TOMBOLA_DATASET  = os.path.join(BASE_DIR, "data", "tombola.xlsx")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⚙️  Iniciando QuiniApp backend...")
    app.state.motor_quiniela  = MotorQuiniela(QUINIELA_DATASET)
    app.state.motor_tombola   = MotorTombola(TOMBOLA_DATASET)
    app.state.motor_redoblona = MotorRedoblona(app.state.motor_quiniela)
    print("✅ Motores cargados. Servidor listo.")
    yield
    print("🛑 Servidor detenido.")

app = FastAPI(title="QuiniApp API", lifespan=lifespan)

# CORS — permite desarrollo local y cualquier dominio de Vercel
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# En producción agregar el dominio de Vercel desde variable de entorno
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# También permitir cualquier subdominio de vercel.app durante pruebas
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint de recarga sin bajar el servidor (para el scraper con crontab)
@app.post("/admin/reload")
async def reload(secret: str):
    expected = os.environ.get("RELOAD_SECRET", "")
    if not expected or secret != expected:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No autorizado")
    app.state.motor_quiniela  = MotorQuiniela(QUINIELA_DATASET)
    app.state.motor_tombola   = MotorTombola(TOMBOLA_DATASET)
    app.state.motor_redoblona = MotorRedoblona(app.state.motor_quiniela)
    return {"ok": True, "mensaje": "Motores recargados correctamente"}

app.include_router(quiniela.router,  prefix="/quiniela")
app.include_router(tombola.router,   prefix="/tombola")
app.include_router(redoblona.router, prefix="/redoblona")

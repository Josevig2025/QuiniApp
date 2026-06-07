"""
routers/quiniela.py
Endpoints REST para el módulo Quiniela.
Todos los parámetros llegan por query string.
El motor se inyecta desde main.py vía app.state.
"""

from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional

router = APIRouter(prefix="/quiniela", tags=["Quiniela"])


def _motor(request: Request):
    """Obtiene el motor desde el estado global de la app."""
    return request.app.state.motor_quiniela


# ---------------------------------------------------------------------------
# INFORMACIÓN Y SORTEOS
# ---------------------------------------------------------------------------

@router.get("/info")
def info(request: Request):
    """Metadatos del dataset: total sorteos, primera y última fecha."""
    return _motor(request).info()


@router.get("/sorteo/{idx}")
def sorteo(idx: int, request: Request):
    """Devuelve un sorteo completo por su índice en el historial."""
    resultado = _motor(request).obtener_sorteo(idx)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Índice fuera de rango")
    return resultado


@router.get("/recientes")
def recientes(
    request: Request,
    cantidad: int = Query(default=20, ge=1, le=200),
):
    """Últimos N sorteos del historial."""
    return _motor(request).obtener_sorteos_recientes(cantidad)


# ---------------------------------------------------------------------------
# HELPERS: conversión de filtros de fecha a índices
# ---------------------------------------------------------------------------

def _resolver_indices(request, idx_min, idx_max, desde, hasta_fecha,
                      ultimo_anio, ultimo_mes, ultimos_n):
    """
    Prioridad: si se pasan idx_min/idx_max se usan directamente.
    Si no, se convierten los filtros de fecha a índices.
    """
    mt = _motor(request)
    if idx_min is not None or idx_max is not None:
        return idx_min, idx_max
    return mt.fechas_a_indices(
        desde=desde,
        hasta_fecha=hasta_fecha,
        ultimo_anio=ultimo_anio,
        ultimo_mes=ultimo_mes,
        ultimos_n=ultimos_n,
    )


# Parámetros de filtro temporal compartidos por varios endpoints
_FILTROS = {
    "idx_min":     Query(default=None, ge=0),
    "idx_max":     Query(default=None, ge=0),
    "desde":       Query(default=None, description="Fecha inicio DD/MM/YY"),
    "hasta_fecha": Query(default=None, description="Fecha fin DD/MM/YY"),
    "ultimo_anio": Query(default=False),
    "ultimo_mes":  Query(default=False),
    "ultimos_n":   Query(default=None, ge=1),
}


# ---------------------------------------------------------------------------
# ANÁLISIS DE UN NÚMERO
# ---------------------------------------------------------------------------

@router.get("/numero/{numero}")
def analizar_numero(
    numero: str,
    request: Request,
    cifras: int   = Query(default=2, ge=1, le=3),
    hasta: int    = Query(default=20, ge=1, le=20),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Análisis completo de un número: gaps, frecuencia por posición, últimas apariciones."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).analizar_numero(numero, cifras, hasta, imin, imax)


# ---------------------------------------------------------------------------
# RANKINGS
# ---------------------------------------------------------------------------

@router.get("/ranking")
def ranking(
    request: Request,
    cifras: int   = Query(default=2, ge=1, le=3),
    hasta: int    = Query(default=20, ge=1, le=20),
    modo: str     = Query(default="atrasos", regex="^(atrasos|frecuencia)$"),
    top: int      = Query(default=20, ge=1, le=200),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Ranking de números por atraso o frecuencia."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).ranking(cifras, hasta, modo, top, imin, imax)


@router.get("/gaps-cortos")
def gaps_cortos(
    request: Request,
    cifras: int = Query(default=2, ge=1, le=3),
    hasta: int  = Query(default=20, ge=1, le=20),
    top: int    = Query(default=20, ge=1, le=200),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Números con menor gap promedio (más regulares)."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, None, None,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).ranking_gaps_cortos(cifras, hasta, top, imin, imax)


@router.get("/lideres")
def lideres(
    request: Request,
    cifras: int  = Query(default=2, ge=1, le=3),
    hasta: int   = Query(default=20, ge=1, le=20),
    top: int     = Query(default=20, ge=1, le=200),
    orden: str   = Query(default="atraso", regex="^(atraso|fecha)$"),
):
    """Historial de cuándo salió el número más atrasado y con qué atraso."""
    return _motor(request).atraso_lideres(cifras, hasta, top, orden)


@router.get("/racha")
def racha(
    request: Request,
    cifras: int  = Query(default=2, ge=1, le=3),
    hasta: int   = Query(default=20, ge=1, le=20),
    top: int     = Query(default=10, ge=1, le=100),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Números con mayor score de racha reciente."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, None, None,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).ranking_racha(cifras, hasta, top, imin, imax)


# ---------------------------------------------------------------------------
# SALIDAS (listado de sorteos)
# ---------------------------------------------------------------------------

@router.get("/salidas")
def salidas(
    request: Request,
    cifras: int = Query(default=2, ge=1, le=3),
    hasta: int  = Query(default=20, ge=1, le=20),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Listado de sorteos del rango con conteo de repetidos."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, None, None,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).mostrar_salidas(cifras, hasta, imin, imax)


# ---------------------------------------------------------------------------
# SUGERIR JUGADA
# ---------------------------------------------------------------------------

@router.get("/sugerir")
def sugerir(
    request: Request,
    cifras: int  = Query(default=2, ge=1, le=3),
    hasta: int   = Query(default=20, ge=1, le=20),
    top: int     = Query(default=5, ge=1, le=20),
    ventana: int = Query(default=300, ge=50, le=5000),
):
    """
    Candidatos basados en frecuencia reciente y atraso moderado.
    Disclaimer: no predice el futuro, solo muestra estadística histórica.
    """
    return {
        "disclaimer": "Estos datos son solo estadística histórica. El azar no puede predecirse.",
        "candidatos": _motor(request).sugerir_jugada(cifras, hasta, top, ventana),
    }


# ---------------------------------------------------------------------------
# BACKTESTING
# ---------------------------------------------------------------------------

@router.get("/backtest/{numero}")
def backtest(
    numero: str,
    request: Request,
    cifras: int    = Query(default=2, ge=1, le=3),
    hasta: int     = Query(default=20, ge=1, le=20),
    apuesta: float = Query(default=100.0, ge=1.0),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Simula apostar siempre al mismo número en el rango seleccionado."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, None, None,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).backtest(numero, cifras, hasta, apuesta, imin, imax)

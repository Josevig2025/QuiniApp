"""
routers/redoblona.py
Endpoints REST para el módulo Redoblona.
"""

from fastapi import APIRouter, Request, Query
from typing  import Optional
from datetime import datetime

router = APIRouter(prefix="/redoblona", tags=["Redoblona"])


def _motor(request: Request):
    return request.app.state.motor_redoblona


def _resolver_rango(mt, ultimos_n, desde, hasta_fecha):
    """Convierte filtros temporales a idx_min, idx_max."""
    total = mt.total
    idx_min, idx_max = 0, total - 1

    if ultimos_n:
        return max(0, total - ultimos_n), total - 1

    if desde or hasta_fecha:
        # Redoblona usa el historial de Quiniela: mq.historial[i][0] = fecha
        historial = mt.mq.historial

        def parse(s):
            s = str(s).strip().split()[0]
            for fmt in ["%Y-%m-%d", "%d/%m/%y", "%d/%m/%Y"]:
                try: return datetime.strptime(s, fmt)
                except: pass
            return None

        if desde:
            dt = parse(desde)
            if dt:
                for i, (fecha, _, _) in enumerate(historial):
                    fdt = parse(fecha)
                    if fdt and fdt >= dt:
                        idx_min = i; break

        if hasta_fecha:
            dt = parse(hasta_fecha)
            if dt:
                for i in range(total - 1, -1, -1):
                    fdt = parse(historial[i][0])
                    if fdt and fdt <= dt:
                        idx_max = i; break

    return idx_min, idx_max


PARAMS_TEMPORALES = {
    "idx_min":     Query(default=None),
    "idx_max":     Query(default=None),
    "ultimos_n":   Query(default=None, ge=10),
    "desde":       Query(default=None),
    "hasta_fecha": Query(default=None),
}


@router.get("/analizar")
def analizar(
    request: Request,
    n1:     str = Query(description="Primer número, ej: 07"),
    r1:     int = Query(default=5,  ge=1, le=20),
    n2:     str = Query(description="Segundo número, ej: 23"),
    r2:     int = Query(default=5,  ge=1, le=20),
    cifras: int = Query(default=2,  ge=1, le=3),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimos_n:   Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Análisis de un par específico."""
    mt = _motor(request)
    imin, imax = _resolver_rango(mt, ultimos_n, desde, hasta_fecha)
    if idx_min is not None: imin = idx_min
    if idx_max is not None: imax = idx_max
    return mt.analizar(n1, r1, n2, r2, cifras, imin, imax)


@router.get("/ranking")
def ranking(
    request: Request,
    r1:     int = Query(default=5,  ge=1, le=20),
    r2:     int = Query(default=5,  ge=1, le=20),
    cifras: int = Query(default=2,  ge=1, le=3),
    top:    int = Query(default=20, ge=1, le=200),
    modo:   str = Query(default="frecuencia", regex="^(frecuencia|atrasos)$"),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimos_n:   Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Ranking de pares más frecuentes o más atrasados."""
    mt = _motor(request)
    imin, imax = _resolver_rango(mt, ultimos_n, desde, hasta_fecha)
    if idx_min is not None: imin = idx_min
    if idx_max is not None: imax = idx_max
    return mt.ranking(r1, r2, cifras, top, modo, imin, imax)


@router.get("/sugerir")
def sugerir(
    request: Request,
    r1:      int = Query(default=5,   ge=1, le=20),
    r2:      int = Query(default=5,   ge=1, le=20),
    cifras:  int = Query(default=2,   ge=1, le=3),
    top:     int = Query(default=10,  ge=1, le=50),
    ventana: int = Query(default=300, ge=50, le=5000),
):
    """Pares candidatos por frecuencia reciente y atraso moderado."""
    return {
        "disclaimer": "Solo estadística histórica. El azar no puede predecirse.",
        "candidatos": _motor(request).sugerir(r1, r2, cifras, top, ventana),
    }

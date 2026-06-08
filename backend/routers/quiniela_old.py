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

@router.get("/por-fecha")
def por_fecha(
    request: Request,
    fecha: str = Query(description="Fecha: YYYY-MM-DD o DD/MM/YY"),
):
    """Sorteos de una fecha. Acepta YYYY-MM-DD (input date) o DD/MM/YY."""
    from datetime import datetime as dt
    mt = _motor(request)
    parsed = None
    for fmt in ["%Y-%m-%d", "%d/%m/%y", "%d/%m/%Y"]:
        try:
            parsed = dt.strptime(fecha.strip(), fmt)
            break
        except ValueError:
            pass
    if parsed is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Formato de fecha invalido. Usar YYYY-MM-DD")
    fecha_norm = parsed.strftime("%d/%m/%y")
    resultados = [
        {"idx": i, "fecha": f, "turno": t, "nums": [f"{int(n):03d}" for n in ns]}
        for i, (f, t, ns) in enumerate(mt.historial)
        if f == fecha_norm
    ]
    return {"fecha": fecha_norm, "sorteos": resultados}




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
    pos_exacta:  Optional[int] = Query(default=None, ge=1, le=20),
):
    """Análisis completo de un número. pos_exacta: filtrar solo esa posición (1-20)."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).analizar_numero(numero, cifras, hasta, imin, imax, pos_exacta)


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
    pos_exacta:  Optional[int] = Query(default=None, ge=1, le=20),
    dia_semana:  Optional[str] = Query(default=None),  # "0,1,2" lun=0..dom=6
    dia_mes:     Optional[str] = Query(default=None),  # "1,15,31"
):
    """Ranking por atraso o frecuencia."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    ds = [int(x) for x in dia_semana.split(',') if x.strip().isdigit()] if dia_semana else None
    dm = [int(x) for x in dia_mes.split(',')    if x.strip().isdigit()] if dia_mes    else None
    return _motor(request).ranking(cifras, hasta, modo, top, imin, imax, pos_exacta, ds, dm)


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
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Simula apostar siempre al mismo número en el rango seleccionado."""
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    return _motor(request).backtest(numero, cifras, hasta, apuesta, imin, imax)

@router.get("/top-roi")
def top_roi(
    request: Request,
    cifras: int   = Query(default=2, ge=1, le=3),
    hasta:  int   = Query(default=20, ge=1, le=20),
    top:    int   = Query(default=10, ge=1, le=50),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Ranking de todos los números por ROI con apuesta base x1. Top mejores y peores."""
    mt = _motor(request)
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, desde, hasta_fecha,
        ultimo_anio, ultimo_mes, ultimos_n
    )

    from engines.motor_quiniela import PAGOS_QUINIELA
    pagos   = PAGOS_QUINIELA.get(cifras, {})
    rangos  = sorted(pagos.keys())
    mk      = rangos[0]
    for r in rangos:
        if hasta >= r:
            mk = r
    mult    = pagos.get(mk, 0)

    if cifras == 1:
        universo = [str(i) for i in range(10)]
    elif cifras == 2:
        universo = [f"{i:02d}" for i in range(100)]
    else:
        universo = [f"{i:03d}" for i in range(1000)]

    resultados = []
    for num in universo:
        bt = mt.backtest(num, cifras, hasta, 1.0, imin, imax)
        apariciones = sum(bt['premios_detalle'].values())
        resultados.append({
            'numero':      num,
            'apariciones': apariciones,
            'ganado':      bt['total_ganado'],
            'balance':     bt['balance'],
            'roi':         bt['roi'],
        })

    resultados.sort(key=lambda x: x['roi'], reverse=True)
    total_sorteos = imax - imin + 1

    return {
        'top_mejores':    resultados[:top],
        'top_peores':     list(reversed(resultados[-top:])),
        'total_numeros':  len(resultados),
        'multiplicador':  mult,
        'sorteos':        total_sorteos,
    }

@router.get("/numero/{numero}/fechas")
def fechas_numero(
    numero: str,
    request: Request,
    cifras: int = Query(default=2, ge=1, le=3),
    hasta:  int = Query(default=20, ge=1, le=20),
    idx_min:     Optional[int] = Query(default=None),
    idx_max:     Optional[int] = Query(default=None),
    ultimo_anio: bool          = Query(default=False),
    ultimo_mes:  bool          = Query(default=False),
    ultimos_n:   Optional[int] = Query(default=None),
):
    """Devuelve todas las fechas de aparición de un número (para calcular días favoritos)."""
    mt = _motor(request)
    imin, imax = _resolver_indices(
        request, idx_min, idx_max, None, None,
        ultimo_anio, ultimo_mes, ultimos_n
    )
    analisis = mt.analizar_numero(numero, cifras, hasta, imin, imax)
    # Devolver solo las fechas de todas las apariciones
    return {
        'numero':  analisis['numero'],
        'total':   analisis['total'],
        'fechas':  [a['fecha'] for a in analisis['ultimas_apariciones']],
    }

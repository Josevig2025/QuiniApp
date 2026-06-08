"""
routers/tombola.py
Endpoints REST para el módulo Tómbola.
"""

from fastapi import APIRouter, Request, HTTPException, Query
from typing  import Optional

router = APIRouter(prefix="/tombola", tags=["Tómbola"])

def _norm(n: int) -> int:
    """Normaliza número de tómbola: 100 → 0 (el bolillo 00 se guarda como 0 en el motor)."""
    return 0 if n == 100 else n




def _motor(request: Request):
    return request.app.state.motor_tombola


# ---------------------------------------------------------------------------
# INFORMACIÓN
# ---------------------------------------------------------------------------

@router.get("/info")
def info(request: Request):
    """Metadatos del dataset de Tómbola."""
    return _motor(request).info()


@router.get("/sorteo/{idx}")
def sorteo(idx: int, request: Request):
    """Sorteo completo por índice."""
    r = _motor(request).obtener_sorteo(idx)
    if r is None:
        raise HTTPException(status_code=404, detail="Índice fuera de rango")
    return r


# ---------------------------------------------------------------------------
# MARCO COMBINATORIO
# ---------------------------------------------------------------------------

@router.get("/marco")
def marco(
    request: Request,
    k:         int          = Query(default=5, ge=3, le=7),
    idx_min:   Optional[int] = Query(default=None),
    idx_max:   Optional[int] = Query(default=None),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:     Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """
    Marco combinatorio para k números.
    Si se pasan filtros temporales, calcula sobre ese rango del dataset.
    """
    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)
    return mt.marco_combinatorio(k, idx_min=idx_min, idx_max=idx_max)


# ---------------------------------------------------------------------------
# ANÁLISIS DE COMBINACIÓN
# ---------------------------------------------------------------------------


@router.get("/numero/{numero}")
def analizar_numero(
    numero: int,
    request: Request,
    idx_min:   Optional[int] = Query(default=None),
    idx_max:   Optional[int] = Query(default=None),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Estadísticas de un número individual en Tómbola (apariciones, gaps)."""
    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)
    idx_min = idx_min or 0
    idx_max = idx_max if idx_max is not None else mt.total - 1

    rows = mt.rows[idx_min: idx_max + 1]
    N = len(rows)

    idxs = [i for i, row in enumerate(rows) if numero in row]
    if not idxs:
        return {
            "numero": numero,
            "apariciones": 0,
            "gap_actual": N,
            "gap_promedio": None,
            "gap_maximo": None,
        }

    from statistics import mean
    gap_actual = N - 1 - idxs[-1]
    gaps = [idxs[i] - idxs[i-1] - 1 for i in range(1, len(idxs))]
    gaps_con_actual = gaps + [gap_actual]

    return {
        "numero": numero,
        "apariciones": len(idxs),
        "gap_actual": gap_actual,
        "gap_promedio": round(mean(gaps_con_actual), 2),
        "gap_maximo": max(gaps_con_actual),
    }

@router.get("/combo")
def analizar_combo(
    request: Request,
    nums:      str = Query(description="Números separados por coma, ej: 10,25,37,50,75"),
    min_match: Optional[int] = Query(default=None, ge=2),
    idx_min:   Optional[int] = Query(default=None),
    idx_max:   Optional[int] = Query(default=None),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Análisis completo de una combinación: gaps, apariciones, ratio atraso/promedio."""
    try:
        lista = [_norm(int(x.strip())) for x in nums.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato inválido. Usá números separados por coma.")

    k = len(lista)
    if not (3 <= k <= 7):
        raise HTTPException(status_code=400, detail="La combinación debe tener entre 3 y 7 números.")
    if len(set(lista)) != k:
        raise HTTPException(status_code=400, detail="Los números de la combinación deben ser distintos.")

    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)

    return mt.analizar_combo(lista, min_match, idx_min, idx_max)


# ---------------------------------------------------------------------------
# BACKTEST
# ---------------------------------------------------------------------------

@router.get("/backtest")
def backtest(
    request: Request,
    nums:      str   = Query(description="Números separados por coma"),
    apuesta:   float = Query(default=50.0, ge=1.0),
    idx_min:   Optional[int] = Query(default=None),
    idx_max:   Optional[int] = Query(default=None),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Simula apostar siempre la misma combinación. Devuelve resultado económico."""
    try:
        lista = [_norm(int(x.strip())) for x in nums.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato inválido.")

    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)

    return mt.backtest(lista, apuesta, idx_min, idx_max)


# ---------------------------------------------------------------------------
# RANKING DE COMBINACIONES
# ---------------------------------------------------------------------------

@router.get("/ranking")
def ranking(
    request: Request,
    k:    int = Query(default=5, ge=3, le=7),
    top:  int = Query(default=20, ge=1, le=100),
    modo: str = Query(default="atrasos", regex="^(atrasos|frecuencia|score)$"),
    idx_min:   Optional[int] = Query(default=None),
    idx_max:   Optional[int] = Query(default=None),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """Ranking de combinaciones de k números por atraso, frecuencia o score combinado."""

    # Para k>4 en modo atrasos: el espacio es demasiado grande para
    # garantizar resultados representativos — informar al usuario
    if k > 4 and modo == "atrasos":
        mt = _motor(request)
        marco = mt.marco_combinatorio(k)
        return {
            "aviso": True,
            "mensaje": (
                f"Para {k} números en modo 'atrasadas', el espacio de "
                f"{marco['total_teorico']:,} combinaciones posibles es demasiado "
                f"grande. Solo se cubrió aprox. el {marco['cobertura_unica']:.4f}% "
                f"del total, por lo que las combinaciones 'atrasadas' no son "
                f"estadísticamente representativas. Usá 'Frecuentes' o 'Score'."
            ),
            "cobertura": marco['cobertura_unica'],
            "total_teorico": marco['total_teorico'],
            "datos": []
        }

    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)
    return mt.ranking_combos(k, top, modo, idx_min, idx_max)


# ---------------------------------------------------------------------------
# SUGERIR COMBINACIONES
# ---------------------------------------------------------------------------

@router.get("/sugerir")
def sugerir(
    request: Request,
    k:    int = Query(default=5, ge=3, le=7),
    top:  int = Query(default=10, ge=1, le=50),
    ultimos_n: Optional[int] = Query(default=None, ge=10),
    desde:       Optional[str] = Query(default=None),
    hasta_fecha: Optional[str] = Query(default=None),
):
    """
    Combinaciones candidatas por score combinado en zona de reactivación.
    Disclaimer: solo estadística histórica.
    """
    mt = _motor(request)
    idx_min, idx_max = mt.resolver_rango_completo(idx_min, idx_max, ultimos_n, desde, hasta_fecha)
    return {
        "disclaimer": "Solo estadística histórica. El azar no puede predecirse.",
        "candidatos": mt.sugerir_combos(k, top, idx_min, idx_max),
    }

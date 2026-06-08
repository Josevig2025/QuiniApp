"""
engines/motor_redoblona.py
Motor de análisis de Redoblona Uruguay.
Analiza pares de números que aparecen en el mismo sorteo
dentro de rangos de premios definidos independientemente para cada número.
Extraído y refactorizado desde mtu3.py.
"""

from statistics import mean
from collections import defaultdict


class MotorRedoblona:
    """
    Reutiliza el historial de Quiniela (mismo dataset).
    Se instancia pasándole el motor de Quiniela ya cargado
    para no duplicar la carga del archivo.
    """

    def __init__(self, motor_quiniela):
        """Recibe la instancia de MotorQuiniela ya cargada."""
        self.mq    = motor_quiniela
        self.total = motor_quiniela.total

    # -----------------------------------------------------------------------
    # ANÁLISIS DE UN PAR ESPECÍFICO
    # -----------------------------------------------------------------------

    def analizar(
        self,
        n1: str | int,
        r1: int,           # rango de premios para n1 (1–20)
        n2: str | int,
        r2: int,           # rango de premios para n2 (1–20)
        cifras: int = 2,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> dict:
        """
        Busca sorteos donde n1 aparece entre los primeros r1 premios
        Y n2 aparece entre los primeros r2 premios en el mismo sorteo.
        Devuelve apariciones, gaps, últimas ocurrencias.
        """
        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1

        # Normalizar números al formato correcto
        n1_int = int(str(n1)) % (10 ** cifras)
        n2_int = int(str(n2)) % (10 ** cifras)

        idxs    = []
        detalle = []   # lista de ocurrencias con fecha y posiciones

        for idx in range(idx_min, idx_max + 1):
            fecha, turno, nums = self.mq.historial[idx]
            reducidos = [int(n) % (10 ** cifras) for n in nums]

            pos1 = None
            pos2 = None

            # Buscar n1 dentro de r1 premios
            for pos in range(min(r1, len(reducidos))):
                if reducidos[pos] == n1_int:
                    pos1 = pos + 1
                    break

            # Buscar n2 dentro de r2 premios
            for pos in range(min(r2, len(reducidos))):
                if reducidos[pos] == n2_int:
                    pos2 = pos + 1
                    break

            if pos1 is not None and pos2 is not None:
                idxs.append(idx)
                detalle.append({
                    "idx":   idx,
                    "fecha": fecha,
                    "turno": turno,
                    "pos1":  pos1,
                    "pos2":  pos2,
                })

        total_sorteos = idx_max - idx_min + 1
        gap_actual    = total_sorteos - 1 - (idxs[-1] - idx_min) if idxs else total_sorteos
        gaps          = [idxs[i] - idxs[i-1] - 1 for i in range(1, len(idxs))]
        gap_prom      = mean(gaps) if gaps else None

        return {
            "n1":           str(n1_int).zfill(cifras),
            "r1":           r1,
            "n2":           str(n2_int).zfill(cifras),
            "r2":           r2,
            "cifras":       cifras,
            "apariciones":  len(idxs),
            "gap_actual":   gap_actual,
            "gap_promedio": round(gap_prom, 2) if gap_prom is not None else None,
            "gap_maximo":   max(gaps) if gaps else None,
            "ultimos_gaps": gaps[-10:],
            "ultimas_ocurrencias": detalle[-10:],
        }

    # -----------------------------------------------------------------------
    # RANKING DE PARES
    # -----------------------------------------------------------------------

    def ranking(
        self,
        r1: int,
        r2: int,
        cifras: int = 2,
        top: int = 20,
        modo: str = "frecuencia",   # "frecuencia" | "atrasos"
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> list[dict]:
        """
        Ranking de todos los pares que aparecieron juntos dentro de r1/r2 premios.
        Para cada sorteo registra qué pares coincidieron.
        """
        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1

        # Índice: par (n1,n2) → lista de índices de sorteo donde coincidieron
        pares: dict[tuple, list[int]] = defaultdict(list)

        for idx in range(idx_min, idx_max + 1):
            _, _, nums = self.mq.historial[idx]
            reducidos = [int(n) % (10 ** cifras) for n in nums]

            # Números dentro de r1 y r2 respectivamente (rangos INDEPENDIENTES)
            set_r1 = set(reducidos[:min(r1, len(reducidos))])
            set_r2 = set(reducidos[:min(r2, len(reducidos))])

            # Generar todos los pares (a, b) con a en set_r1, b en set_r2, a != b
            # Ordenar el par para evitar (05,23) y (23,05) como pares distintos
            pares_este_sorteo = set()
            for a in set_r1:
                for b in set_r2:
                    if a != b:
                        par = (min(a, b), max(a, b))
                        pares_este_sorteo.add(par)
            for par in pares_este_sorteo:
                pares[par].append(idx)

        if not pares:
            return []

        total_sorteos = idx_max - idx_min + 1
        resultados    = []

        for (a, b), idxs in pares.items():
            gap_actual = total_sorteos - 1 - (idxs[-1] - idx_min)
            gaps       = [idxs[i] - idxs[i-1] - 1 for i in range(1, len(idxs))]
            gap_prom   = mean(gaps) if gaps else gap_actual

            resultados.append({
                "n1":           str(a).zfill(cifras),
                "n2":           str(b).zfill(cifras),
                "apariciones":  len(idxs),
                "gap_actual":   gap_actual,
                "gap_promedio": round(gap_prom, 2),
                "gap_maximo":   max(gaps) if gaps else gap_actual,
            })

        key = (lambda x: x["apariciones"]) if modo == "frecuencia" \
              else (lambda x: x["gap_actual"])
        resultados.sort(key=key, reverse=True)
        return resultados[:top]

    # -----------------------------------------------------------------------
    # SUGERIR PARES
    # -----------------------------------------------------------------------

    def sugerir(
        self,
        r1: int,
        r2: int,
        cifras: int = 2,
        top: int = 10,
        ventana: int = 300,
    ) -> list[dict]:
        """
        Pares candidatos: frecuencia reciente alta + atraso moderado.
        """
        idx_min = max(0, self.total - ventana)
        todos   = self.ranking(r1, r2, cifras, top=200, modo="frecuencia",
                               idx_min=idx_min)

        # Filtrar atraso moderado (no recién salió, no demasiado atrasado)
        candidatos = [
            r for r in todos
            if 3 <= r["gap_actual"] <= r["gap_promedio"] * 2
        ]

        if len(candidatos) < top:
            candidatos = todos

        return candidatos[:top]

"""
engines/motor_tombola.py
Motor de análisis de Tómbola Uruguay.
Dataset: .xlsx con columnas fecha, turno, N1..N20
"""

from itertools import combinations
from statistics import mean, stdev
from math import comb as math_comb
from collections import Counter, defaultdict
import pandas as pd

PAGOS_TOMBOLA: dict[int, dict[int, float]] = {
    3: {3: 60},
    4: {4: 180, 3: 9},
    5: {5: 900, 4: 24, 3: 3},
    6: {6: 3600, 5: 90, 4: 9, 3: 1.5},
    7: {7: 12000, 6: 600, 5: 30, 4: 3, 3: 1},
}

# Columnas que NO son números del sorteo
COLS_META = {'fecha', 'date', 'dia', 'día', 'turno', 'session',
             'id', 'index', 'sorteo', 'numero', 'nro'}

# Límite de combinaciones únicas a trackear en memoria para k>=5
# Evita explosión de memoria con datasets grandes
MAX_COMBOS_EN_MEMORIA = 500_000


class MotorTombola:

    def __init__(self, archivo: str):
        self.rows:   list[set[int]] = []
        self.fechas: list[str]      = []
        self.turnos: list[str]      = []
        self.total:  int            = 0
        self.nums_por_sorteo: int   = 20
        self._cargar(archivo)

    def _cargar(self, archivo: str) -> None:
        df = pd.read_excel(archivo, header=0)

        cols_meta = [c for c in df.columns if str(c).lower().strip() in COLS_META]
        cols_nums = [c for c in df.columns if str(c).lower().strip() not in COLS_META]

        fecha_col = next((c for c in cols_meta if str(c).lower().strip() in
                          {'fecha', 'date', 'dia', 'día'}), None)
        turno_col = next((c for c in cols_meta if str(c).lower().strip() in
                          {'turno', 'session'}), None)

        for _, row in df.iterrows():
            self.fechas.append(str(row[fecha_col]) if fecha_col else '')
            self.turnos.append(str(row[turno_col]) if turno_col else '')

            nums = set()
            for col in cols_nums:
                try:
                    n = int(row[col])
                    if 0 <= n <= 99:
                        nums.add(n)
                except (ValueError, TypeError):
                    pass
            if nums:
                self.rows.append(nums)

        self.total = len(self.rows)
        if self.rows:
            conteo = Counter(len(r) for r in self.rows)
            self.nums_por_sorteo = conteo.most_common(1)[0][0]

    def recargar(self, archivo: str) -> None:
        self.rows.clear()
        self.fechas.clear()
        self.turnos.clear()
        self._cargar(archivo)

    # ── Info ──────────────────────────────────────────────────────────

    def info(self) -> dict:
        return {
            "total":           self.total,
            "nums_por_sorteo": self.nums_por_sorteo,
            "primera_fecha":   self.fechas[0]  if self.fechas else None,
            "ultima_fecha":    self.fechas[-1] if self.fechas else None,
        }

    def obtener_sorteo(self, idx: int) -> dict | None:
        if not (0 <= idx < self.total):
            return None
        return {
            "idx":   idx,
            "fecha": self.fechas[idx] if self.fechas else None,
            "turno": self.turnos[idx] if self.turnos else None,
            "nums":  sorted(self.rows[idx]),
        }

    # ── Marco combinatorio ────────────────────────────────────────────

    def marco_combinatorio(self, k: int, idx_min: int | None = None, idx_max: int | None = None) -> dict:
        """
        Calcula el marco combinatorio para k números.
        
        Métricas:
        - cobertura_sorteo: % del espacio cubierto por UN sorteo
        - veces_esperadas: cuántas veces debería salir cada combo en promedio
        - cobertura_real: % del espacio cubierto (100% cuando veces_esperadas >= 1)
        - Para k<=4 cuenta combos únicas exactas (viable en memoria)
        - Para k>=5 solo muestra métricas esperadas (sin conteo exacto)
        """
        universo         = 100
        total_teorico    = math_comb(universo, k)
        eventos_x_sorteo = math_comb(self.nums_por_sorteo, k)

        # Usar rango si se especifica
        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1
        rows_rango = self.rows[idx_min: idx_max + 1]
        n_sorteos  = len(rows_rango)

        total_eventos    = eventos_x_sorteo * n_sorteos
        cobertura_sorteo = (eventos_x_sorteo / total_teorico) * 100
        veces_esperadas  = total_eventos / total_teorico
        cobertura_real   = min(100.0, veces_esperadas * 100)

        # Fechas del rango
        fecha_desde = self.fechas[idx_min] if self.fechas else None
        fecha_hasta = self.fechas[idx_max] if self.fechas else None

        # Conteo exacto solo para k<=4
        if k <= 4:
            vistas: set = set()
            for row in rows_rango:
                for combo in combinations(sorted(row), k):
                    vistas.add(combo)
            combos_unicas   = len(vistas)
            cobertura_unica = (combos_unicas / total_teorico) * 100
            metodo = "exacto"
        else:
            combos_unicas   = None
            cobertura_unica = None
            metodo = "teórico"

        # Mensaje contextual según k
        rango_txt = f"{n_sorteos:,} sorteos" + (f" ({fecha_desde} — {fecha_hasta})" if fecha_desde else "")
        if veces_esperadas >= 1:
            msg_cob = (
                f"Con {rango_txt}, estadísticamente cada combinación de {k} números "
                f"debería haber salido {veces_esperadas:.1f} veces en promedio. "
                f"El espacio de {total_teorico:,} combinaciones posibles está cubierto."
            )
        else:
            msg_cob = (
                f"Con {rango_txt} solo se cubrió el {cobertura_real:.1f}% "
                f"del espacio de {total_teorico:,} combinaciones posibles de {k} números. "
                f"Cada combo tiene probabilidad {100/total_teorico:.8f}% de salir en un sorteo."
            )

        return {
            "k":                    k,
            "n_sorteos":            n_sorteos,
            "fecha_desde":          fecha_desde,
            "fecha_hasta":          fecha_hasta,
            "universo":             universo,
            "nums_por_sorteo":      self.nums_por_sorteo,
            "total_teorico":        total_teorico,
            "eventos_x_sorteo":     eventos_x_sorteo,
            "total_eventos":        total_eventos,
            "veces_esperadas":      round(veces_esperadas, 2),
            "cobertura_x_sorteo":   round(cobertura_sorteo, 8),
            "cobertura_real":       round(cobertura_real, 2),
            "combos_unicas_vistas": combos_unicas,
            "cobertura_unica":      round(cobertura_unica, 2) if cobertura_unica else None,
            "metodo":               metodo,
            "mensaje": msg_cob,
        }

    # ── Análisis de combinación ───────────────────────────────────────

    def analizar_combo(self, nums: list[int], min_match: int | None = None,
                       idx_min: int | None = None, idx_max: int | None = None) -> dict:
        k         = len(nums)
        combo_set = set(nums)
        if min_match is None:
            min_match = k

        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1
        rows    = self.rows[idx_min: idx_max + 1]

        idxs = [i for i, row in enumerate(rows)
                if len(row & combo_set) >= min_match]

        total_sorteos = len(rows)
        gap_actual    = total_sorteos - 1 - idxs[-1] if idxs else total_sorteos
        gaps          = [idxs[i] - idxs[i-1] - 1 for i in range(1, len(idxs))]
        gap_prom      = mean(gaps) if gaps else None
        ratio         = round(gap_actual / gap_prom, 2) if gap_prom else None

        return {
            "combo":        sorted(nums),
            "k":            k,
            "min_match":    min_match,
            "apariciones":  len(idxs),
            "gap_actual":   gap_actual,
            "gap_promedio": round(gap_prom, 2) if gap_prom is not None else None,
            "gap_maximo":   max(gaps) if gaps else None,
            "ultimos_gaps": gaps[-10:],
            "ratio_atraso": ratio,
            "ultima_fecha": self.fechas[idx_min + idxs[-1]] if idxs and self.fechas else None,
        }

    # ── Backtest ──────────────────────────────────────────────────────

    def backtest(self, nums: list[int], apuesta: float,
                 idx_min: int | None = None, idx_max: int | None = None) -> dict:
        k       = len(nums)
        pagos_k = PAGOS_TOMBOLA.get(k, {})
        combo   = set(nums)

        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1
        rows    = self.rows[idx_min: idx_max + 1]

        total_apostado = len(rows) * apuesta
        total_ganado   = 0.0
        detalle: dict[int, int] = {}

        for row in rows:
            aciertos = len(row & combo)
            if aciertos in pagos_k:
                total_ganado += pagos_k[aciertos] * apuesta
                detalle[aciertos] = detalle.get(aciertos, 0) + 1

        balance = total_ganado - total_apostado
        roi     = (balance / total_apostado * 100) if total_apostado > 0 else 0.0

        return {
            "combo":            sorted(nums),
            "k":                k,
            "apuesta":          apuesta,
            "sorteos":          len(rows),
            "total_apostado":   round(total_apostado, 2),
            "total_ganado":     round(total_ganado, 2),
            "balance":          round(balance, 2),
            "roi":              round(roi, 2),
            "detalle_premios":  detalle,
            "pagos_referencia": pagos_k,
        }

    # ── Ranking de combinaciones — OPTIMIZADO ─────────────────────────

    def ranking_combos(self, k: int, top: int = 20, modo: str = "atrasos",
                       idx_min: int | None = None, idx_max: int | None = None) -> list[dict]:
        """
        Para k<=3: calcula todas las combinaciones (manejable).
        Para k>=5: usa dos pasadas —
          1ra pasada: contar frecuencias (Counter liviano)
          2da pasada: calcular gaps solo para el top-N por frecuencia
        Esto evita guardar millones de listas de índices en memoria.
        """
        idx_min = idx_min or 0
        idx_max = idx_max if idx_max is not None else self.total - 1
        rows    = self.rows[idx_min: idx_max + 1]
        N       = len(rows)

        # Siempre usar el método optimizado — es rápido y preciso para todos los k
        return self._ranking_optimizado(rows, N, k, top, modo)

    def _ranking_exacto(self, rows, N, k, top, modo):
        """Ranking exacto para k<=4 — genera todos los índices."""
        apariciones: dict[tuple, list[int]] = {}
        for i, row in enumerate(rows):
            for combo in combinations(sorted(row), k):
                if combo not in apariciones:
                    apariciones[combo] = []
                apariciones[combo].append(i)

        if not apariciones:
            return []

        return self._calcular_scores(apariciones, N, top, modo)

    def _ranking_optimizado(self, rows, N, k, top, modo):
        """
        Ranking optimizado para k>=5.
        Pasada 1: solo contar frecuencias (Counter, muy liviano).
        Pasada 2: recalcular índices solo para el top-500 por frecuencia.
        """
        # Pasada 1: frecuencias
        freq: Counter = Counter()
        for row in rows:
            for combo in combinations(sorted(row), k):
                freq[combo] += 1

        if not freq:
            return []

        # Tomar solo las top-500 combos más frecuentes para la pasada 2
        candidatas = {combo for combo, _ in freq.most_common(500)}

        # Pasada 2: calcular índices solo para candidatas
        apariciones: dict[tuple, list[int]] = {c: [] for c in candidatas}
        for i, row in enumerate(rows):
            for combo in combinations(sorted(row), k):
                if combo in apariciones:
                    apariciones[combo].append(i)

        return self._calcular_scores(apariciones, N, top, modo)

    def _calcular_scores(self, apariciones, N, top, modo):
        """Calcula gaps, score y arma el resultado final."""
        max_salidas = max(len(v) for v in apariciones.values())
        resultados  = []

        for combo, idxs in apariciones.items():
            salidas    = len(idxs)
            gap_actual = N - 1 - idxs[-1]
            gaps       = [idxs[i] - idxs[i-1] - 1 for i in range(1, len(idxs))]
            gaps_total = gaps + [gap_actual]
            gap_prom   = mean(gaps_total)
            gap_max    = max(gaps_total)
            cv = (stdev(gaps_total) / gap_prom
                  if len(gaps_total) >= 2 and gap_prom > 0 else 0)

            freq_norm = salidas / max_salidas
            score     = freq_norm * 0.4 + (1/(1+cv)) * 0.3 + (1/(1+gap_max)) * 0.3

            resultados.append({
                "combo":        list(combo),
                "salidas":      salidas,
                "gap_actual":   gap_actual,
                "gap_promedio": round(gap_prom, 2),
                "gap_maximo":   gap_max,
                "coef_var":     round(cv, 3),
                "score":        round(score, 4),
            })

        key = {
            "atrasos":    lambda x: x["gap_actual"],
            "frecuencia": lambda x: x["salidas"],
            "score":      lambda x: x["score"],
        }.get(modo, lambda x: x["gap_actual"])

        resultados.sort(key=key, reverse=True)
        return resultados[:top]

    # ── Sugerir combinaciones ─────────────────────────────────────────

    def sugerir_combos(self, k: int, top: int = 10,
                       idx_min: int | None = None, idx_max: int | None = None) -> list[dict]:
        todos      = self.ranking_combos(k, top=200, modo="score",
                                         idx_min=idx_min, idx_max=idx_max)
        filtrados  = [r for r in todos if r["salidas"] >= 3]
        reactiv    = [r for r in filtrados if r["gap_actual"] > r["gap_promedio"]]
        candidatos = reactiv if len(reactiv) >= top else filtrados
        candidatos.sort(key=lambda x: x["score"], reverse=True)
        return candidatos[:top]

    # ── Utilidad ──────────────────────────────────────────────────────

    def resolver_rango(self, ultimos_n: int | None = None) -> tuple[int, int]:
        if ultimos_n:
            return max(0, self.total - ultimos_n), self.total - 1
        return 0, self.total - 1

    def resolver_rango_completo(
        self,
        idx_min: int | None = None,
        idx_max: int | None = None,
        ultimos_n: int | None = None,
        desde: str | None = None,
        hasta_fecha: str | None = None,
    ) -> tuple[int, int]:
        """Resuelve rango con soporte para todos los tipos de filtro temporal."""
        if ultimos_n:
            return max(0, self.total - ultimos_n), self.total - 1
        if idx_min is not None or idx_max is not None:
            return idx_min or 0, idx_max if idx_max is not None else self.total - 1
        if desde or hasta_fecha:
            from datetime import datetime
            def parse(s):
                s = str(s).strip().split()[0]
                for fmt in ["%Y-%m-%d", "%d/%m/%y", "%d/%m/%Y"]:
                    try: return datetime.strptime(s, fmt)
                    except: pass
                return None
            imin, imax = 0, self.total - 1
            if desde:
                dt = parse(desde)
                if dt:
                    for i, f in enumerate(self.fechas):
                        fdt = parse(f)
                        if fdt and fdt >= dt:
                            imin = i; break
            if hasta_fecha:
                dt = parse(hasta_fecha)
                if dt:
                    for i in range(self.total-1, -1, -1):
                        fdt = parse(self.fechas[i])
                        if fdt and fdt <= dt:
                            imax = i; break
            return imin, imax
        return 0, self.total - 1

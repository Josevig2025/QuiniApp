"""
motor_quiniela.py
Motor de análisis de Quiniela Uruguay.
Extraído y refactorizado desde mtu3.py.
Toda la lógica vive aquí; los routers solo llaman a estos métodos.
"""

from collections import defaultdict
from statistics import mean
from datetime import datetime
from math import comb as math_comb


# ---------------------------------------------------------------------------
# TABLAS DE REFERENCIA
# ---------------------------------------------------------------------------

# Multiplicadores de pago por cifras y cantidad de premios jugados
PAGOS_QUINIELA: dict[int, dict[int, float]] = {
    1: {1: 7,    5: 1.4,  10: 0.7,  20: 0.35},
    2: {1: 70,   5: 14,   10: 7,    20: 3.5},
    3: {1: 500,  5: 100,  10: 50,   20: 25},
}


# ---------------------------------------------------------------------------
# HELPERS INTERNOS
# ---------------------------------------------------------------------------

def _zfill(numero: str | int, cifras: int) -> str:
    """Formatea un número con ceros a la izquierda según las cifras pedidas."""
    return str(int(numero) % (10 ** cifras)).zfill(cifras)


def _reducir(n: str | int, cifras: int) -> str:
    """Reduce un número de 3 cifras a 2 o 1 según el modo de análisis."""
    n = int(n)
    if cifras == 3:
        return f"{n:03d}"
    elif cifras == 2:
        return f"{n % 100:02d}"
    else:
        return str(n % 10)


def _calcular_gaps(indices: list[int]) -> list[int]:
    """Dado una lista de índices de aparición, devuelve la lista de gaps entre ellos."""
    if len(indices) < 2:
        return []
    return [indices[i] - indices[i - 1] - 1 for i in range(1, len(indices))]


def _parse_fecha(fecha_str: str) -> datetime:
    """Parsea una fecha en formato DD/MM/YY a datetime."""
    partes = fecha_str.strip().split()
    return datetime.strptime(partes[0], "%d/%m/%y")


# ---------------------------------------------------------------------------
# CLASE PRINCIPAL
# ---------------------------------------------------------------------------

class MotorQuiniela:
    """
    Carga el dataset de Quiniela y expone todos los métodos de análisis.
    Se instancia una sola vez al arrancar el servidor (singleton en main.py).
    """

    def __init__(self, archivo: str):
        """Carga el dataset desde un .txt y construye los índices de búsqueda."""
        self.historial: list[tuple[str, str, list[str]]] = []
        # índices: número_string -> lista de (idx_sorteo, posicion_1based, fecha)
        self.indices_3: dict[str, list[tuple]] = defaultdict(list)
        self.indices_2: dict[str, list[tuple]] = defaultdict(list)
        self.indices_1: dict[str, list[tuple]] = defaultdict(list)

        self._cargar(archivo)
        self._construir_indices()

    # -----------------------------------------------------------------------
    # CARGA E INDEXADO
    # -----------------------------------------------------------------------

    def _cargar(self, archivo: str) -> None:
        """Lee el archivo .txt línea por línea y llena self.historial."""
        with open(archivo, "r", encoding="utf-8") as f:
            for linea in f:
                partes = linea.strip().split()
                if len(partes) < 22:
                    continue
                fecha  = partes[0]
                turno  = partes[1]
                nums   = partes[2:22]   # siempre 20 premios
                self.historial.append((fecha, turno, nums))
        self.total = len(self.historial)

    def _construir_indices(self) -> None:
        """Construye índices invertidos para búsqueda rápida por número."""
        for idx, (fecha, turno, nums) in enumerate(self.historial):
            for pos, n in enumerate(nums, start=1):
                n3 = f"{int(n):03d}"
                n2 = n3[-2:]
                n1 = n3[-1]
                self.indices_3[n3].append((idx, pos, fecha))
                self.indices_2[n2].append((idx, pos, fecha))
                self.indices_1[n1].append((idx, pos, fecha))

    def recargar(self, archivo: str) -> None:
        """Recarga el dataset sin reiniciar el servidor (útil tras actualización del cron)."""
        self.historial.clear()
        self.indices_3.clear()
        self.indices_2.clear()
        self.indices_1.clear()
        self._cargar(archivo)
        self._construir_indices()

    # -----------------------------------------------------------------------
    # HELPERS DE INSTANCIA
    # -----------------------------------------------------------------------

    def _dic(self, cifras: int) -> dict:
        """Devuelve el índice correspondiente al número de cifras."""
        return {3: self.indices_3, 2: self.indices_2, 1: self.indices_1}[cifras]

    def _resolver_rango(
        self,
        idx_min: int | None,
        idx_max: int | None,
    ) -> tuple[int, int]:
        """Devuelve idx_min e idx_max seguros (con defaults al dataset completo)."""
        return (idx_min or 0, idx_max if idx_max is not None else self.total - 1)

    def _filtrar_apariciones(
        self,
        apariciones: list[tuple],
        hasta: int,
        idx_min: int,
        idx_max: int,
    ) -> list[tuple]:
        """Filtra una lista de (idx, pos, fecha) por rango de premios e índices."""
        return [
            (i, p, f)
            for i, p, f in apariciones
            if p <= hasta and idx_min <= i <= idx_max
        ]

    # -----------------------------------------------------------------------
    # INFORMACIÓN GENERAL
    # -----------------------------------------------------------------------

    def info(self) -> dict:
        """Devuelve metadatos del dataset: total sorteos, primera y última fecha."""
        if not self.historial:
            return {"total": 0, "primera_fecha": None, "ultima_fecha": None}
        return {
            "total": self.total,
            "primera_fecha": self.historial[0][0],
            "ultima_fecha":  self.historial[-1][0],
        }

    def obtener_sorteo(self, idx: int) -> dict | None:
        """Devuelve un sorteo completo dado su índice en el historial."""
        if not (0 <= idx < self.total):
            return None
        fecha, turno, nums = self.historial[idx]
        return {
            "idx":   idx,
            "fecha": fecha,
            "turno": turno,
            "nums":  [f"{int(n):03d}" for n in nums],
        }

    def obtener_sorteos_recientes(self, cantidad: int = 20) -> list[dict]:
        """Devuelve los últimos N sorteos del historial."""
        resultado = []
        for idx in range(max(0, self.total - cantidad), self.total):
            fecha, turno, nums = self.historial[idx]
            resultado.append({
                "idx":   idx,
                "fecha": fecha,
                "turno": turno,
                "nums":  [f"{int(n):03d}" for n in nums],
            })
        return list(reversed(resultado))

    # -----------------------------------------------------------------------
    # ANÁLISIS DE UN NÚMERO
    # -----------------------------------------------------------------------

    def analizar_numero(
        self,
        numero: str | int,
        cifras: int,
        hasta: int,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> dict:
        """
        Análisis completo de un número: apariciones, gaps, frecuencia por posición
        y últimas 10 apariciones.
        """
        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        numero_str = _zfill(numero, cifras)
        numero_int = int(numero_str)

        apariciones = []
        for idx in range(idx_min, idx_max + 1):
            _, _, nums = self.historial[idx]
            for pos in range(min(hasta, len(nums))):
                n = int(nums[pos]) % (10 ** cifras)
                if n == numero_int:
                    fecha, turno, _ = self.historial[idx]
                    apariciones.append({
                        "idx":   idx,
                        "fecha": fecha,
                        "turno": turno,
                        "pos":   pos + 1,
                    })
                    break

        if not apariciones:
            return {
                "numero":       numero_str,
                "total":        0,
                "gap_actual":   idx_max - idx_min + 1,
                "gap_promedio": None,
                "gap_maximo":   None,
                "ultimos_gaps": [],
                "freq_posicion": {},
                "ultimas_apariciones": [],
            }

        idxs = [a["idx"] for a in apariciones]
        gaps = _calcular_gaps(idxs)
        gap_actual = idx_max - idxs[-1]

        # Frecuencia por posición
        freq_pos: dict[int, int] = {}
        for a in apariciones:
            p = a["pos"]
            freq_pos[p] = freq_pos.get(p, 0) + 1

        return {
            "numero":       numero_str,
            "total":        len(apariciones),
            "gap_actual":   gap_actual,
            "gap_promedio": round(mean(gaps), 2) if gaps else None,
            "gap_maximo":   max(gaps) if gaps else None,
            "ultimos_gaps": gaps[-10:],
            "freq_posicion": freq_pos,
            "ultimas_apariciones": apariciones[-10:],
        }

    # -----------------------------------------------------------------------
    # RANKING (ATRASOS / SALIDORES)
    # -----------------------------------------------------------------------

    def ranking(
        self,
        cifras: int,
        hasta: int,
        modo: str = "atrasos",   # "atrasos" | "frecuencia"
        top: int = 20,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> list[dict]:
        """
        Ranking de números ordenados por mayor atraso o mayor frecuencia.
        Devuelve lista de dicts con número, salidas, gap_actual, gap_promedio, gap_maximo.
        """
        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        d = self._dic(cifras)
        resultados = []

        for num, apariciones in d.items():
            filtradas = self._filtrar_apariciones(apariciones, hasta, idx_min, idx_max)
            if not filtradas:
                continue

            idxs = [i for i, _, _ in filtradas]
            gap_actual = idx_max - idxs[-1]
            gaps = _calcular_gaps(idxs)
            gaps_con_actual = gaps + [gap_actual]

            resultados.append({
                "numero":       num,
                "salidas":      len(idxs),
                "gap_actual":   gap_actual,
                "gap_promedio": round(mean(gaps_con_actual), 2),
                "gap_maximo":   max(gaps_con_actual),
            })

        # Ordenar según modo
        key = "gap_actual" if modo == "atrasos" else "salidas"
        resultados.sort(key=lambda x: x[key], reverse=True)
        return resultados[:top]

    # -----------------------------------------------------------------------
    # GAPS CORTOS (más regulares)
    # -----------------------------------------------------------------------

    def ranking_gaps_cortos(
        self,
        cifras: int,
        hasta: int,
        top: int = 20,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> list[dict]:
        """Números con menor gap promedio: los más regulares/constantes."""
        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        d = self._dic(cifras)
        resultados = []

        for num, apariciones in d.items():
            filtradas = self._filtrar_apariciones(apariciones, hasta, idx_min, idx_max)
            if len(filtradas) < 3:   # necesitamos al menos 3 apariciones para que sea significativo
                continue

            idxs = [i for i, _, _ in filtradas]
            gap_actual = idx_max - idxs[-1]
            gaps = _calcular_gaps(idxs) + [gap_actual]

            resultados.append({
                "numero":       num,
                "salidas":      len(idxs),
                "gap_promedio": round(mean(gaps), 2),
                "gap_maximo":   max(gaps),
                "gap_actual":   gap_actual,
            })

        resultados.sort(key=lambda x: x["gap_promedio"])
        return resultados[:top]

    # -----------------------------------------------------------------------
    # ATRASO AL SALIR DE LÍDERES
    # -----------------------------------------------------------------------

    def atraso_lideres(
        self,
        cifras: int,
        hasta: int,
        top: int = 20,
        orden: str = "atraso",   # "atraso" | "fecha"
    ) -> list[dict]:
        """
        Historial de eventos donde el número más atrasado salió en ese sorteo.
        Muestra con qué atraso salió cada vez.
        """
        if cifras == 1:
            universo = [str(i) for i in range(10)]
        elif cifras == 2:
            universo = [f"{i:02d}" for i in range(100)]
        else:
            universo = [f"{i:03d}" for i in range(1000)]

        atrasos_actuales = {n: 0 for n in universo}
        eventos = []

        for idx, (fecha, turno, nums) in enumerate(self.historial):
            nums_reducidos = [_reducir(n, cifras) for n in nums[:hasta]]
            max_atraso = max(atrasos_actuales.values())

            for numero in nums_reducidos:
                if atrasos_actuales.get(numero, 0) == max_atraso and max_atraso > 0:
                    eventos.append({
                        "numero": numero,
                        "atraso": max_atraso,
                        "fecha":  f"{fecha} {turno}",
                    })

            # Actualizar atrasos
            for num in universo:
                if num in nums_reducidos:
                    atrasos_actuales[num] = 0
                else:
                    atrasos_actuales[num] += 1

        if orden == "fecha":
            eventos.sort(key=lambda x: _parse_fecha(x["fecha"]), reverse=True)
        else:
            eventos.sort(key=lambda x: x["atraso"], reverse=True)

        return eventos[:top]

    # -----------------------------------------------------------------------
    # NÚMEROS EN RACHA
    # -----------------------------------------------------------------------

    def ranking_racha(
        self,
        cifras: int,
        hasta: int,
        top: int = 10,
        idx_min: int | None = None,
        idx_max: int | None = None,
        ventana_racha: int = 5,   # últimas N apariciones para calcular racha
    ) -> list[dict]:
        """
        Números con mayor score de racha reciente.
        Score = frecuencia_reciente / (gap_promedio_últimas_apariciones + 1)
        """
        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        d = self._dic(cifras)
        resultados = []

        for num, apariciones in d.items():
            filtradas = self._filtrar_apariciones(apariciones, hasta, idx_min, idx_max)
            if len(filtradas) < 2:
                continue

            idxs = [i for i, _, _ in filtradas]
            ultimos = idxs[-ventana_racha:]
            gaps_recientes = [ultimos[i] - ultimos[i - 1] for i in range(1, len(ultimos))]

            if not gaps_recientes:
                continue

            gap_prom_reciente = mean(gaps_recientes)
            freq_reciente     = len(ultimos)
            gap_actual        = idx_max - idxs[-1]
            score             = freq_reciente / (gap_prom_reciente + 1)

            resultados.append({
                "numero":             num,
                "freq_reciente":      freq_reciente,
                "gap_actual":         gap_actual,
                "gap_prom_reciente":  round(gap_prom_reciente, 2),
                "score":              round(score, 4),
            })

        resultados.sort(key=lambda x: x["score"], reverse=True)
        return resultados[:top]

    # -----------------------------------------------------------------------
    # SUGERIR JUGADA
    # -----------------------------------------------------------------------

    def sugerir_jugada(
        self,
        cifras: int,
        hasta: int,
        top: int = 5,
        ventana: int = 300,
    ) -> list[dict]:
        """
        Sugiere números candidatos basándose en frecuencia reciente y atraso moderado.
        No predice el futuro — solo muestra qué números han sido más activos.
        """
        d = self._dic(cifras)
        limite_idx = max(0, self.total - ventana)
        resultados = []

        for num, apariciones in d.items():
            filtradas = [(i, p) for i, p, _ in apariciones if p <= hasta]
            if not filtradas:
                continue

            freq_reciente = sum(1 for i, _ in filtradas if i >= limite_idx)
            ultimo_idx    = filtradas[-1][0]
            atraso        = self.total - 1 - ultimo_idx

            # Excluir números con atraso muy largo o muy corto
            if atraso > ventana or atraso < 3:
                continue

            resultados.append({
                "numero":        num,
                "freq_reciente": freq_reciente,
                "atraso":        atraso,
            })

        if not resultados:
            return []

        # Filtrar los de mayor frecuencia (≥ 60% del máximo)
        max_freq = max(r["freq_reciente"] for r in resultados)
        candidatos = [r for r in resultados if r["freq_reciente"] >= max_freq * 0.6]

        if len(candidatos) < 10:
            resultados.sort(key=lambda x: x["freq_reciente"], reverse=True)
            candidatos = resultados[:20]

        candidatos.sort(key=lambda x: x["atraso"], reverse=True)
        return candidatos[:top]

    # -----------------------------------------------------------------------
    # BACKTESTING
    # -----------------------------------------------------------------------

    def backtest(
        self,
        numero: str | int,
        cifras: int,
        hasta: int,
        apuesta: float,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> dict:
        """
        Simula apostar siempre al mismo número en cada sorteo del rango.
        Devuelve totales económicos y detalle de premios ganados.
        """
        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        numero_str  = _zfill(numero, cifras)
        numero_int  = int(numero_str)
        pagos       = PAGOS_QUINIELA.get(cifras, {})

        # Encontrar el multiplicador de pago correcto según "hasta"
        # El juego paga según en cuántos premios estás jugando (1, 5, 10 o 20)
        # Si el usuario juega en "hasta=3", usamos el pago del rango más cercano
        rangos_pago = sorted(pagos.keys())   # [1, 5, 10, 20]
        multiplicador_key = rangos_pago[0]
        for rango in rangos_pago:
            if hasta >= rango:
                multiplicador_key = rango
        multiplicador = pagos.get(multiplicador_key, 0)

        total_sorteos  = 0
        total_apostado = 0.0
        total_ganado   = 0.0
        premios_detalle: dict[int, int] = {}   # posicion -> cantidad de veces

        for idx in range(idx_min, idx_max + 1):
            _, _, nums = self.historial[idx]
            total_sorteos  += 1
            total_apostado += apuesta

            for pos in range(min(hasta, len(nums))):
                n = int(nums[pos]) % (10 ** cifras)
                if n == numero_int:
                    ganado = apuesta * multiplicador
                    total_ganado += ganado
                    premios_detalle[pos + 1] = premios_detalle.get(pos + 1, 0) + 1
                    break

        balance = total_ganado - total_apostado
        roi     = (balance / total_apostado * 100) if total_apostado > 0 else 0.0

        return {
            "numero":           numero_str,
            "cifras":           cifras,
            "hasta":            hasta,
            "apuesta_unitaria": apuesta,
            "sorteos":          total_sorteos,
            "total_apostado":   round(total_apostado, 2),
            "total_ganado":     round(total_ganado, 2),
            "balance":          round(balance, 2),
            "roi":              round(roi, 2),
            "multiplicador":    multiplicador,
            "premios_detalle":  premios_detalle,
        }

    # -----------------------------------------------------------------------
    # MOSTRAR SALIDAS (listado de sorteos con un número buscado)
    # -----------------------------------------------------------------------

    def mostrar_salidas(
        self,
        cifras: int,
        hasta: int,
        idx_min: int | None = None,
        idx_max: int | None = None,
    ) -> list[dict]:
        """
        Devuelve los sorteos del rango, con cada número reducido a las cifras pedidas.
        Incluye conteo de repetición por número (para resaltar en la UI).
        """
        from collections import Counter

        idx_min, idx_max = self._resolver_rango(idx_min, idx_max)
        filas = []

        for idx in range(idx_min, idx_max + 1):
            fecha, turno, nums = self.historial[idx]
            reducidos = [_reducir(n, cifras) for n in nums[:hasta]]
            filas.append({
                "idx":   idx,
                "fecha": fecha,
                "turno": turno,
                "nums":  reducidos,
            })

        # Conteo global de repetidos
        todos = [n for fila in filas for n in fila["nums"]]
        conteo = Counter(todos)

        return {
            "sorteos": filas,
            "repetidos": dict(conteo.most_common(10)),
        }

    # -----------------------------------------------------------------------
    # UTILIDAD: convertir rango de fechas a índices
    # -----------------------------------------------------------------------

    def fechas_a_indices(
        self,
        desde: str | None = None,   # formato DD/MM/YY
        hasta_fecha: str | None = None,
        ultimo_anio: bool = False,
        ultimo_mes: bool = False,
        ultimos_n: int | None = None,
    ) -> tuple[int, int]:
        """
        Convierte diferentes tipos de filtro temporal a (idx_min, idx_max).
        Permite usar cualquiera de las opciones del prompt maestro.
        """
        if ultimos_n is not None:
            idx_max = self.total - 1
            idx_min = max(0, self.total - ultimos_n)
            return idx_min, idx_max

        if ultimo_mes:
            ultima = _parse_fecha(self.historial[-1][0])
            idx_min = 0
            for i, (fecha, _, _) in enumerate(self.historial):
                d = _parse_fecha(fecha)
                if (ultima - d).days <= 31:
                    idx_min = i
                    break
            return idx_min, self.total - 1

        if ultimo_anio:
            ultima = _parse_fecha(self.historial[-1][0])
            idx_min = 0
            for i, (fecha, _, _) in enumerate(self.historial):
                d = _parse_fecha(fecha)
                if (ultima - d).days <= 365:
                    idx_min = i
                    break
            return idx_min, self.total - 1

        if desde or hasta_fecha:
            idx_min = 0
            idx_max = self.total - 1
            if desde:
                dt_desde = datetime.strptime(desde, "%d/%m/%y")
                for i, (fecha, _, _) in enumerate(self.historial):
                    if _parse_fecha(fecha) >= dt_desde:
                        idx_min = i
                        break
            if hasta_fecha:
                dt_hasta = datetime.strptime(hasta_fecha, "%d/%m/%y")
                for i in range(self.total - 1, -1, -1):
                    fecha, _, _ = self.historial[i]
                    if _parse_fecha(fecha) <= dt_hasta:
                        idx_max = i
                        break
            return idx_min, idx_max

        return 0, self.total - 1

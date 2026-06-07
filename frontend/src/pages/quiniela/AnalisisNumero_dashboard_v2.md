# AnalisisNumero - Versión Dashboard (Alternativa)

## Objetivo
Mantener exactamente los mismos componentes, hooks y lógica, pero reorganizar la cabecera.

### Cambios propuestos

1. Header dentro de una card principal.
2. Número centrado y dominante.
3. Gap debajo del número.
4. Botones de navegación en una fila independiente.
5. Input manual más pequeño.
6. Teclado e input agrupados visualmente.
7. Links rápidos alineados en una barra secundaria.

### Reemplazar el bloque:

{/* Header */}

por una estructura tipo:

<div className="card p-5 space-y-4">
  ...
</div>

### Número principal

fontSize: 'clamp(4rem, 12vw, 7rem)'

### Input auxiliar

width: 90
height: 64
fontSize: '2rem'

### Navegación

Centrada debajo del número principal.

### Resultado esperado

- Número = protagonista absoluto.
- Input = herramienta secundaria.
- Mejor balance visual.
- Más estilo dashboard estadístico.

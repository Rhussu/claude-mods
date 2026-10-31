import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import type { Git, Idioma, Info, Limite, Medicion } from '../types'

const REFRESCO_MS = 30_000
const CUADRO_MS = 250
// Clave de `$.store` (persiste entre sesiones): el aviso de bienvenida ya se vio.
const BIENVENIDA = 'bienvenida'

// Cambiar la etiqueta `shape` si cambian los campos: descarta lo guardado
// por una versión anterior, que sobrevive a una recarga.
const medicion = atom({ plugin: 'aurorastate', key: 'medicion' } as const, null, { shape: 'medicion-3' })
const tendencia = atom({ plugin: 'aurorastate', key: 'tendencia' } as const, null, { shape: 'tendencia-1' })
const info = atom({ plugin: 'aurorastate', key: 'info' } as const, null, { shape: 'info-3' })
const frame = atom({ plugin: 'aurorastate', key: 'frame' } as const, 0)
const effort = atom({ plugin: 'aurorastate', key: 'effort' } as const, null)
const idioma = atom({ plugin: 'aurorastate', key: 'idioma' } as const, 'en')

// Niveles de effort, de menos a más: cada uno llena un tramo del medidor.
const NIVELES = ['low', 'medium', 'high', 'xhigh', 'max']

// ── Paleta "Aurora" ─────────────────────────────────────────────
// De menta (vacío) a rosa (lleno): cuanto más se llena una barra,
// más cálido es su extremo.
const AURORA = ['#34d399', '#2dd4bf', '#60a5fa', '#818cf8', '#c084fc', '#f472b6', '#fb7185']
const MARCO = '#6d5dfc'
const TENUE = '#5b5b7a'
const VACIO = '#3b3b55'
const ORO = '#fbbf24'
const MENTA = '#34d399'
const TURQUESA = '#2dd4bf'
const LILA = '#c4b5fd'

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
const mezclar = (a: string, b: string, t: number) => {
  const ca = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16))
  const cb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + ca.map((v, i) => hex(v + ((cb[i] ?? v) - v) * t)).join('')
}
// Color del degradado en la posición `t` (0 a 1).
const aurora = (t: number) => {
  const x = Math.min(1, Math.max(0, t)) * (AURORA.length - 1)
  const i = Math.min(AURORA.length - 2, Math.floor(x))
  return mezclar(AURORA[i]!, AURORA[i + 1]!, x - i)
}

// ── Textos en los dos idiomas ───────────────────────────────────
const TEXTOS = {
  en: {
    bienvenida:
      '✦ aurorastate is on · reads usage, model, effort & git status · no network, no file writes · Ctrl+X Ctrl+A hides it',
    trabajando: 'working',
    turno: 'your turn',
    sinDatos: 'ctx no data',
    sinGit: 'no git',
    limites: { five_hour: '5 h', seven_day: '7 days', spend_limit: 'Spend' } as Record<string, string>,
  },
  es: {
    bienvenida:
      '✦ aurorastate está activo · lee uso, modelo, effort y estado de git · sin red, no escribe archivos · Ctrl+X Ctrl+A lo oculta',
    trabajando: 'trabajando',
    turno: 'tu turno',
    sinDatos: 'ctx sin datos',
    sinGit: 'sin git',
    limites: { five_hour: '5 h', seven_day: '7 días', spend_limit: 'Gasto' } as Record<string, string>,
  },
} as const

const esEspanol = (v: unknown) => typeof v === 'string' && /^(es|span|espa)/i.test(v.trim())

// `auto`: el idioma de los ajustes de Claude Code, luego $LANG, luego inglés.
async function resolverIdioma($: EngineInterface, opcion: unknown): Promise<Idioma> {
  if (opcion === 'en' || opcion === 'es') return opcion
  if (esEspanol(await $.settings.read({ key: 'language' }))) return 'es'
  return esEspanol(await $.env.get('LANG')) ? 'es' : 'en'
}

// "claude-opus-5-5[1m]" → "Opus 5.5 · 1M"
const modeloBonito = (id: string) => {
  const extra = /\[(\w+)\]$/.exec(id)?.[1]
  const base = id.replace(/\[.*\]$/, '').replace(/^claude-/, '')
  const [familia, ...version] = base.split('-')
  if (!familia) return id
  const nombreFam = familia.charAt(0).toUpperCase() + familia.slice(1)
  const v = version.filter(p => /^\d+$/.test(p)).join('.')
  return [nombreFam, v].filter(Boolean).join(' ') + (extra ? ` · ${extra.toUpperCase()}` : '')
}

const desdeUso = (u: Pick<SessionUsage, 'context' | 'rateLimits'>): Medicion => ({
  contexto: u.context.percent,
  limites: u.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed })),
})

async function leerGit($: EngineInterface): Promise<Git | null> {
  try {
    const rama = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { timeoutMs: 5000 })
    if (rama.exitCode !== 0) return null
    const estado = await $.process.run(['git', 'status', '--porcelain'], { timeoutMs: 5000 })
    const cambios = estado.stdout.split('\n').filter(l => l.trim() !== '').length
    return { rama: rama.stdout.trim(), cambios }
  } catch {
    return null
  }
}

async function refrescarInfo($: EngineInterface) {
  const [modelo, git] = await Promise.all([$.session.model(), leerGit($)])
  const nueva: Info = { modelo, git }
  await update($, info, () => nueva)
}

async function registrarMedicion($: EngineInterface, m: Medicion) {
  await update($, medicion, () => m)
  const pct = m.contexto
  if (pct === undefined) return
  // La tendencia guarda el último cambio: se mantiene entre mediciones iguales.
  await update($, tendencia, t =>
    t === null ? { pct, delta: 0 } : pct === t.pct ? t : { pct, delta: pct - t.pct },
  )
}

export const register: Register = (on, options) => {
  let refresco: { cancel: () => void } | undefined
  let animacion: { cancel: () => void } | undefined

  const pararAnimacion = () => {
    animacion?.cancel()
    animacion = undefined
  }

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const elegido = await resolverIdioma($, options.language)
    await update($, idioma, () => elegido)
    // Una sola vez tras instalar: qué hace y qué no, para que nada sea sorpresa.
    if ((await $.store.get(BIENVENIDA)) === undefined) {
      $.ui.toast(TEXTOS[elegido].bienvenida, { timeoutMs: 12_000 })
      await $.store.set(BIENVENIDA, '0.1.0')
    }
    const ajuste = await $.settings.read({ key: 'effortLevel' })
    if (typeof ajuste === 'string') await update($, effort, () => ajuste)
    await registrarMedicion($, desdeUso(await $.session.usage()))
    await refrescarInfo($)
    refresco?.cancel()
    refresco = $.clock.every(REFRESCO_MS, () => void refrescarInfo($))
    return r
  })

  on('session.end', async ($, e, next) => {
    refresco?.cancel()
    pararAnimacion()
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await registrarMedicion($, desdeUso(e))
    await refrescarInfo($)
    return next(e)
  })

  // Animación del indicador mientras el hilo principal trabaja.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      pararAnimacion()
      animacion = $.clock.every(CUADRO_MS, () => void update($, frame, n => (n + 1) % 1_000_000))
    }
    return next(e)
  })

  // El effort real de cada petición del hilo principal (cambia con /effort).
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined && e.effort !== undefined) {
      const nivel = String(e.effort)
      await update($, effort, () => nivel)
    }
    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) pararAnimacion()
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.maxRows < 4) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const m = await read($, medicion)
    const t = await read($, tendencia)
    const i = await read($, info)
    const f = await read($, frame)
    const ef = await read($, effort)
    const tx = TEXTOS[await read($, idioma)]
    const nombre = (kind: string) => tx.limites[kind] ?? kind
    const trabaja = e.props.isWorking

    // ── Piezas ──
    const barra = (pct: number, ancho: number) => {
      const llenas = Math.round((Math.min(100, Math.max(0, pct)) / 100) * ancho)
      return (
        <Text>
          {Array.from({ length: llenas }, (_, k) => (
            <Text color={aurora(k / Math.max(1, ancho - 1))}>━</Text>
          ))}
          <Text color={VACIO}>{'┄'.repeat(ancho - llenas)}</Text>
        </Text>
      )
    }
    const degradado = (texto: string, desde: number, hasta: number) =>
      Array.from(texto).map((c, k, a) => (
        <Text color={aurora(desde + ((hasta - desde) * k) / Math.max(1, a.length - 1))}>{c}</Text>
      ))

    // Un vaivén de 0 a 1 que avanza con cada cuadro.
    const vaiven = (n: number, pasos: number) => {
      const x = n % (pasos * 2)
      return (x < pasos ? x : pasos * 2 - x) / pasos
    }

    // ── Estado de Claude ──
    let estado: { texto: string; icono: string; color: string; borde: string }
    if (trabaja) {
      const c = aurora(vaiven(f, 12))
      estado = { icono: '◐◓◑◒'[f % 4]!, texto: tx.trabajando, color: c, borde: c }
    } else {
      estado = { icono: '◇', texto: tx.turno, color: MENTA, borde: MARCO }
    }

    // ── Segmentos, con el ancho que ocupan, para recortar según el espacio ──
    type Opciones = { barraCtx: number; barraLim: number; limites: number; git: boolean; modelo: boolean }
    const ctxPct = m?.contexto
    const delta = t !== null && ctxPct !== undefined && t.pct === ctxPct ? t.delta : 0
    const textoDelta = delta > 0 ? ` ↗+${delta}` : delta < 0 ? ` ↘−${-delta}` : ''
    const limites = m?.limites ?? []
    const textoModelo = i ? modeloBonito(i.modelo) : ''
    const nivelEf = ef === null ? -1 : NIVELES.indexOf(ef)
    const textoEf = ef === null ? '' : nivelEf >= 0 ? ` ${'▰'.repeat(5)} ${ef}` : ` ⚡${ef}`
    const textoGit = i?.git ? `⎇ ${i.git.rama}${i.git.cambios > 0 ? ` ●${i.git.cambios}` : ' ✓'}` : `⎇ ${tx.sinGit}`

    const medir = (o: Opciones) => {
      const piezas = [estado.icono.length + 1 + estado.texto.length]
      piezas.push(ctxPct === undefined ? tx.sinDatos.length + 2 : 2 + o.barraCtx + 1 + `${ctxPct}%`.length + textoDelta.length)
      for (const l of limites.slice(0, o.limites)) {
        piezas.push(nombre(l.kind).length + 1 + (o.barraLim > 0 ? o.barraLim + 1 : 0) + `${Math.round(l.percentUsed)}%`.length)
      }
      if (o.modelo && i) piezas.push(2 + textoModelo.length + textoEf.length)
      const izquierda = piezas.reduce((a, b) => a + b, 0) + (piezas.length - 1) * 3
      // Git va aparte, a la derecha, con al menos 3 espacios de separación.
      return izquierda + (o.git && i ? 3 + textoGit.length : 0)
    }

    const todo: Opciones = { barraCtx: 10, barraLim: 5, limites: limites.length, git: true, modelo: true }
    const variantes: Opciones[] = [
      todo,
      { ...todo, barraLim: 0 },
      { ...todo, barraLim: 0, limites: Math.min(1, limites.length) },
      { ...todo, barraLim: 0, limites: Math.min(1, limites.length), git: false },
      { ...todo, barraLim: 0, limites: Math.min(1, limites.length), git: false, modelo: false },
      { barraCtx: 6, barraLim: 0, limites: Math.min(1, limites.length), git: false, modelo: false },
      { barraCtx: 6, barraLim: 0, limites: 0, git: false, modelo: false },
    ]
    const espacio = (e.props.bodyColumns ?? 80) - 4
    const o = variantes.find(v => medir(v) <= espacio) ?? variantes[variantes.length - 1]!

    const sep = <Text color={VACIO}> │ </Text>
    const segmentos = [
      <Text>
        <Text bold color={estado.color}>{estado.icono}</Text>
        <Text color={estado.color}> {estado.texto}</Text>
      </Text>,
      ctxPct === undefined ? (
        <Text color={TENUE} italic>◉ {tx.sinDatos}</Text>
      ) : (
        <Text>
          <Text color={ORO}>◉ </Text>
          {barra(ctxPct, o.barraCtx)}
          <Text bold color={aurora(ctxPct / 100)}> {ctxPct}%</Text>
          {textoDelta !== '' && <Text color={delta > 0 ? '#f9a8d4' : MENTA}>{textoDelta}</Text>}
        </Text>
      ),
      ...limites.slice(0, o.limites).map((l: Limite) => (
        <Text>
          <Text color={LILA}>{nombre(l.kind)} </Text>
          {o.barraLim > 0 && barra(l.percentUsed, o.barraLim)}
          {o.barraLim > 0 && <Text> </Text>}
          <Text bold color={aurora(l.percentUsed / 100)}>{Math.round(l.percentUsed)}%</Text>
        </Text>
      )),
      o.modelo && i && (
        <Text>
          <Text color={aurora(0.55)}>◆ </Text>
          {degradado(textoModelo, 0.35, 0.85)}
          {ef !== null &&
            (nivelEf >= 0 ? (
              <Text>
                <Text> </Text>
                {NIVELES.map((_, k) => (
                  <Text color={k <= nivelEf ? aurora(k / 4) : VACIO}>▰</Text>
                ))}
                <Text bold color={aurora(nivelEf / 4)}> {ef}</Text>
              </Text>
            ) : (
              <Text color={ORO}> ⚡{ef}</Text>
            ))}
        </Text>
      ),
    ].filter(Boolean)

    const git = o.git && i && (
      <Text>
        <Text color={TURQUESA}>⎇ {i.git ? i.git.rama : tx.sinGit}</Text>
        {i.git && (i.git.cambios > 0 ? <Text color={ORO}> ●{i.git.cambios}</Text> : <Text color={MENTA}> ✓</Text>)}
      </Text>
    )

    return (
      <Box marginTop={1} borderStyle="round" borderColor={estado.borde} paddingX={1} justifyContent="space-between">
        <Text wrap="truncate-end">
          {segmentos.map((s, k) => (
            <Text>
              {k > 0 && sep}
              {s}
            </Text>
          ))}
        </Text>
        {git}
      </Box>
    )
  })
}

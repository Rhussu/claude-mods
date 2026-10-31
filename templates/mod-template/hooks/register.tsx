import type { EngineInterface, Register } from 'claude-code'

// Plantilla mínima de un mod de rhussu-mods: textos en inglés y español,
// idioma elegido con la opción `language` y un aviso único la primera vez.
// Reemplazar lo marcado con TODO y borrar lo que no se use.

type Idioma = 'en' | 'es'

// Clave de `$.store` (persiste entre sesiones): el aviso de bienvenida ya se vio.
const BIENVENIDA = 'bienvenida'

// ── Textos en los dos idiomas ───────────────────────────────────
const TEXTOS = {
  en: {
    // TODO: qué hace el mod, qué lee y qué NO hace, en una línea.
    bienvenida: '✦ mod-template is on · TODO: what it reads · what it never does',
  },
  es: {
    bienvenida: '✦ mod-template está activo · TODO: qué lee · qué nunca hace',
  },
} as const

const esEspanol = (v: unknown) => typeof v === 'string' && /^(es|span|espa)/i.test(v.trim())

// `auto`: el idioma de los ajustes de Claude Code, luego $LANG, luego inglés.
async function resolverIdioma($: EngineInterface, opcion: unknown): Promise<Idioma> {
  if (opcion === 'en' || opcion === 'es') return opcion
  if (esEspanol(await $.settings.read({ key: 'language' }))) return 'es'
  return esEspanol(await $.env.get('LANG')) ? 'es' : 'en'
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const idioma = await resolverIdioma($, options.language)
    // Una sola vez tras instalar: qué hace y qué no, para que nada sea sorpresa.
    if ((await $.store.get(BIENVENIDA)) === undefined) {
      $.ui.toast(TEXTOS[idioma].bienvenida, { timeoutMs: 12_000 })
      await $.store.set(BIENVENIDA, '0.1.0')
    }
    // TODO: el comportamiento del mod.
    return r
  })
}

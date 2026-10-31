export type Limite = { kind: string; percentUsed: number }

export type Medicion = {
  // % de la ventana de contexto en uso; ausente hasta la primera respuesta.
  contexto?: number
  limites: Limite[]
}

export type Idioma = 'en' | 'es'

export type Git = { rama: string; cambios: number }

export type Info = {
  modelo: string
  git: Git | null
}

declare module 'claude-code' {
  interface PluginState {
    'aurorastate': {
      medicion: Shaped<Medicion | null>
      // Último % de contexto que cambió y el cambio respecto al anterior.
      tendencia: Shaped<{ pct: number; delta: number } | null>
      info: Shaped<Info | null>
      frame: number
      // Nivel de effort del modelo (low…max, o un número); null sin datos.
      effort: string | null
      // Idioma de los textos, resuelto al iniciar la sesión.
      idioma: Idioma
    }
  }
}

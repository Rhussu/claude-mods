import { expect, mock, test } from 'claude-code/testing'

type On = (ev: string, fn: (...a: any[]) => unknown) => void

// El motor simulado: ajustes, $LANG, un store en memoria y los toasts mostrados.
const motor = (on: unknown, { lang }: { lang?: string } = {}) => {
  const o = on as On
  o('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  o('settings.read', () => ({ value: {} }))
  o('env.get', () => ({ value: lang }))
  mock.store(on as never)
  const toasts: string[] = []
  o('ui.toast', (_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  return toasts
}

const iniciar = ($: any) => $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

test('the welcome notice shows once, in English by default', async ($, on) => {
  const toasts = motor(on)
  await iniciar($)
  await iniciar($)
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/is on/)
})

test('auto sigue $LANG', async ($, on) => {
  const toasts = motor(on, { lang: 'es_CL.UTF-8' })
  await iniciar($)
  expect(toasts[0]).toMatch(/está activo/)
})

// TODO: pruebas del comportamiento del mod.

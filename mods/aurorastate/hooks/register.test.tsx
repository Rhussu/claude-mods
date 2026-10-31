import { expect, mock, test } from 'claude-code/testing'

const SUPERFICIES = ['terminal', 'desktop'] as const

type On = (ev: string, fn: (...a: any[]) => unknown) => void

const linea = (surface: (typeof SUPERFICIES)[number], props: Partial<{ isWorking: boolean; bodyColumns: number }> = {}) =>
  ({
    plugin: 'aurorastate',
    component: 'AbovePrompt',
    surface,
    props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: 160, ...props },
  }) as never

// El motor simulado: el modelo, una carpeta sin git, los ajustes y el
// $LANG que pida la prueba, un store en memoria y los toasts mostrados.
const motor = (on: unknown, { lang, ajustes = {} }: { lang?: string; ajustes?: Record<string, unknown> } = {}) => {
  const o = on as On
  o('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  o('session.measure', () => ({ changed: [] }))
  o('process.run', () => ({ value: { exitCode: 128, stdout: '', stderr: '' } }))
  o('session.model', () => ({ value: 'claude-opus-5-5' }))
  o('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  o('settings.read', () => ({ value: ajustes }))
  o('env.get', () => ({ value: lang }))
  o('clock.every', () => ({ value: { cancel: () => {} } }))
  mock.store(on as never)
  const toasts: string[] = []
  o('ui.toast', (_: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  return toasts
}

const iniciar = ($: any) => $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

const medir = (percent: number) =>
  ({
    context: { tokens: percent * 2000, window: 200000, percent },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 18 },
      { kind: 'seven_day', percentUsed: 6 },
    ],
    cost: { usd: 0.37 },
  }) as never

test('in English by default, with everything and no cost', async ($, on) => {
  motor(on)
  await iniciar($)
  await $.session.measure(medir(39))
  await $.session.measure(medir(42))

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount(linea(surface))
    for (const texto of [/your turn/, /42%/, /↗\+3/, /5 h/, /7 days/, /Opus/, /no git/]) {
      expect(await ui.find({ type: 'Text', text: texto })).toBeDefined()
    }
    expect(await ui.find({ type: 'Text', text: /0\.37/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('en español con la opción es', { options: { language: 'es' } }, async ($, on) => {
  motor(on)
  await iniciar($)
  await $.session.measure(medir(42))

  const ui = await $.ui.mount(linea('terminal'))
  for (const texto of [/tu turno/, /7 días/, /sin git/]) {
    expect(await ui.find({ type: 'Text', text: texto })).toBeDefined()
  }
  await ui.unmount()
})

test('auto sigue $LANG', async ($, on) => {
  motor(on, { lang: 'es_CL.UTF-8' })
  await iniciar($)
  await $.session.measure(medir(42))

  const ui = await $.ui.mount(linea('terminal'))
  expect(await ui.find({ type: 'Text', text: /tu turno/ })).toBeDefined()
  await ui.unmount()
})

test("auto prefers Claude Code's language setting", async ($, on) => {
  motor(on, { lang: 'en_US.UTF-8', ajustes: { language: 'spanish' } })
  await iniciar($)
  await $.session.measure(medir(42))

  const ui = await $.ui.mount(linea('terminal'))
  expect(await ui.find({ type: 'Text', text: /tu turno/ })).toBeDefined()
  await ui.unmount()
})

test('shows when Claude is working', async ($, on) => {
  motor(on)
  await iniciar($)
  await $.session.measure(medir(10))
  const ui = await $.ui.mount(linea('terminal', { isWorking: true }))
  expect(await ui.find({ type: 'Text', text: /working/ })).toBeDefined()
  await ui.unmount()
})

test('at 60 columns it trims and keeps the essentials', async ($, on) => {
  motor(on)
  await iniciar($)
  await $.session.measure(medir(42))
  const ui = await $.ui.mount(linea('terminal', { bodyColumns: 60 }))
  expect(await ui.find({ type: 'Text', text: /your turn/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /no git/ })).toBeUndefined()
  await ui.unmount()
})

test('shows the effort level', async ($, on) => {
  motor(on, { ajustes: { effortLevel: 'high' } })
  await iniciar($)
  await $.session.measure(medir(42))

  const ui = await $.ui.mount(linea('terminal'))
  expect(await ui.find({ type: 'Text', text: /high/ })).toBeDefined()
  await ui.unmount()
})

test('the welcome notice shows once, in the chosen language', { options: { language: 'es' } }, async ($, on) => {
  const toasts = motor(on)
  await iniciar($)
  await iniciar($)
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/aurorastate está activo/)
  expect(toasts[0]).toMatch(/sin red/)
})

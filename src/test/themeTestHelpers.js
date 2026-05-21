import useThemeStore from '../store/useThemeStore'

export const DEFAULT_THEME = { base: 'whatsapp', mode: 'light' }

/** Maps legacy theme ids to store + persisted combined key */
export const LEGACY_THEME_SPEC = {
  light: { theme: { base: 'whatsapp', mode: 'light' }, key: 'whatsapp-light' },
  dark: { theme: { base: 'whatsapp', mode: 'dark' }, key: 'whatsapp-dark' },
  whatsapp: { theme: { base: 'whatsapp', mode: 'light' }, key: 'whatsapp-light' },
  telegram: { theme: { base: 'telegram', mode: 'light' }, key: 'telegram-light' },
}

export const LEGACY_THEME_IDS = Object.keys(LEGACY_THEME_SPEC)

export const resetThemeTestState = () => {
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', LEGACY_THEME_SPEC.light.key)
  useThemeStore.setState({ theme: { ...DEFAULT_THEME } })
}

export const setLegacyTheme = (legacyId) => {
  useThemeStore.getState().setTheme(legacyId)
}

export const expectLegacyThemeApplied = (legacyId, { checkStorage = true } = {}) => {
  const spec = LEGACY_THEME_SPEC[legacyId]
  expect(useThemeStore.getState().theme).toEqual(spec.theme)
  expect(document.documentElement.getAttribute('data-theme')).toBe(spec.key)
  if (checkStorage) {
    expect(localStorage.getItem('theme')).toBe(spec.key)
  }
}

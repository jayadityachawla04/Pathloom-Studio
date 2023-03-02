// Theme store: 'system' | 'light' | 'dark'
// Persists to localStorage, defaults to 'system' (follows OS preference)

import { browser } from '$app/environment'

type ThemeValue = 'system' | 'light' | 'dark'

function getInitialTheme(): ThemeValue {
  if (!browser) return 'system'
  let stored: string | null
  try {
    stored =
      typeof localStorage?.getItem === 'function'
        ? localStorage.getItem('theme')
        : null
  } catch {
    stored = null
  }
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

let theme = $state<ThemeValue>(getInitialTheme())

if (browser) {
  $effect.root(() => {
    $effect(() => {
      document.documentElement.setAttribute('data-theme', theme)
      try {
        if (typeof localStorage?.setItem === 'function') {
          localStorage.setItem('theme', theme)
        }
      } catch {
        // Theme persistence is optional; DOM theme still updates.
      }
    })
  })
}

const CYCLE: ThemeValue[] = ['system', 'light', 'dark']

export const themeStore = {
  get current(): ThemeValue {
    return theme
  },
  set(value: ThemeValue) {
    theme = value
  },
  cycle() {
    const idx = CYCLE.indexOf(theme)
    theme = CYCLE[(idx + 1) % CYCLE.length]
  },
}

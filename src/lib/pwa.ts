import { registerSW } from 'virtual:pwa-register'

export function setupPWA() {
  if (typeof window === 'undefined') return
  registerSW({ immediate: true })
}

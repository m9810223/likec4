import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

export interface SatoriFontConfig {
  name: string
  data: ArrayBuffer
  weight: 400 | 600
  style: 'normal'
}

const require = createRequire(import.meta.url)

function resolveFontPath(weight: string): string {
  // Prefer .woff over .ttf — NOT .woff2 (Satori doesn't support it)
  return require.resolve(`@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}-normal.woff`)
}

export async function loadFonts(): Promise<SatoriFontConfig[]> {
  const [regular, semibold] = await Promise.all([
    readFile(resolveFontPath('400')),
    readFile(resolveFontPath('600')),
  ])

  return [
    { name: 'IBM Plex Sans', data: regular.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'IBM Plex Sans', data: semibold.buffer as ArrayBuffer, weight: 600, style: 'normal' },
  ]
}

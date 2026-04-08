import type { Color } from '@likec4/core/types'

export interface ElementColorValues {
  readonly fill: string
  readonly stroke: string
  readonly hiContrast: string
  readonly loContrast: string
}

export interface RelationshipColorValues {
  readonly line: string
  readonly labelBg: string
  readonly label: string
}

const elementColors: Record<string, ElementColorValues> = {
  primary: { fill: '#3b82f6', stroke: '#2563eb', hiContrast: '#eff6ff', loContrast: '#bfdbfe' },
  blue: { fill: '#3b82f6', stroke: '#2563eb', hiContrast: '#eff6ff', loContrast: '#bfdbfe' },
  secondary: { fill: '#0284c7', stroke: '#0369a1', hiContrast: '#f0f9ff', loContrast: '#B6ECF7' },
  sky: { fill: '#0284c7', stroke: '#0369a1', hiContrast: '#f0f9ff', loContrast: '#B6ECF7' },
  muted: { fill: '#64748b', stroke: '#475569', hiContrast: '#f8fafc', loContrast: '#cbd5e1' },
  slate: { fill: '#64748b', stroke: '#475569', hiContrast: '#f8fafc', loContrast: '#cbd5e1' },
  gray: { fill: '#737373', stroke: '#525252', hiContrast: '#fafafa', loContrast: '#d4d4d4' },
  red: { fill: '#AC4D39', stroke: '#853A2D', hiContrast: '#FBD3CB', loContrast: '#f5b2a3' },
  green: { fill: '#428a4f', stroke: '#2d5d39', hiContrast: '#f8fafc', loContrast: '#c2f0c2' },
  amber: { fill: '#A35829', stroke: '#7E451D', hiContrast: '#FFE0C2', loContrast: '#f9b27c' },
  indigo: { fill: '#6366f1', stroke: '#4f46e5', hiContrast: '#eef2ff', loContrast: '#c7d2fe' },
}

const relationshipColors: Record<string, RelationshipColorValues> = {
  primary: { line: '#3b82f6', labelBg: '#172554', label: '#60a5fa' },
  blue: { line: '#3b82f6', labelBg: '#172554', label: '#60a5fa' },
  secondary: { line: '#0ea5e9', labelBg: '#082f49', label: '#38bdf8' },
  sky: { line: '#0ea5e9', labelBg: '#082f49', label: '#38bdf8' },
  muted: { line: '#64748b', labelBg: '#0f172a', label: '#cbd5e1' },
  slate: { line: '#64748b', labelBg: '#0f172a', label: '#cbd5e1' },
  gray: { line: '#8D8D8D', labelBg: '#18191B', label: '#C9C9C9' },
  red: { line: '#AC4D39', labelBg: '#b91c1c', label: '#f5b2a3' },
  green: { line: '#15803d', labelBg: '#052e16', label: '#22c55e' },
  amber: { line: '#b45309', labelBg: '#78350f', label: '#FFE0C2' },
  indigo: { line: '#6366f1', labelBg: '#1e1b4b', label: '#818cf8' },
}

const FALLBACK_COLOR = 'muted'

export function getElementColors(color: Color): ElementColorValues {
  return elementColors[color as string] ?? elementColors[FALLBACK_COLOR]!
}

export function getRelationshipColors(color: Color): RelationshipColorValues {
  return relationshipColors[color as string] ?? relationshipColors[FALLBACK_COLOR]!
}

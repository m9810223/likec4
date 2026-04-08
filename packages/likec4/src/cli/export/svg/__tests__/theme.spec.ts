import { describe, expect, it } from 'vitest'
import { getElementColors, getRelationshipColors } from '../theme'

describe('theme', () => {
  describe('getElementColors', () => {
    it('returns correct colors for primary theme', () => {
      expect(getElementColors('primary')).toEqual({
        fill: '#3b82f6',
        stroke: '#2563eb',
        hiContrast: '#eff6ff',
        loContrast: '#bfdbfe',
      })
    })

    it('returns correct colors for red theme', () => {
      expect(getElementColors('red')).toEqual({
        fill: '#AC4D39',
        stroke: '#853A2D',
        hiContrast: '#FBD3CB',
        loContrast: '#f5b2a3',
      })
    })

    it('returns muted as fallback for unknown color', () => {
      expect(getElementColors('nonexistent' as any)).toEqual({
        fill: '#64748b',
        stroke: '#475569',
        hiContrast: '#f8fafc',
        loContrast: '#cbd5e1',
      })
    })
  })

  describe('getRelationshipColors', () => {
    it('returns correct colors for primary theme', () => {
      expect(getRelationshipColors('primary')).toEqual({
        line: '#3b82f6',
        labelBg: '#172554',
        label: '#60a5fa',
      })
    })

    it('returns muted as fallback for unknown color', () => {
      expect(getRelationshipColors('nonexistent' as any)).toEqual({
        line: '#64748b',
        labelBg: '#0f172a',
        label: '#cbd5e1',
      })
    })
  })
})

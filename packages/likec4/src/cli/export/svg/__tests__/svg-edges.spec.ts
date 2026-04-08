import type { NonEmptyArray, Point } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { buildEdgeLabelSvg, buildEdgePath, buildEdgeSvg, buildMarkerDefs } from '../svg-edges'

describe('svg-edges', () => {
  describe('buildEdgePath', () => {
    it('builds cubic bezier path from points', () => {
      const points: NonEmptyArray<Point> = [[10, 20], [30, 40], [50, 60], [70, 80]]
      const result = buildEdgePath(points)
      expect(result).toBe('M 10,20 C 30,40 50,60 70,80')
    })

    it('builds multi-segment bezier path', () => {
      const points: NonEmptyArray<Point> = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
        [40, 40],
        [50, 50],
        [60, 60],
      ]
      const result = buildEdgePath(points)
      expect(result).toBe('M 0,0 C 10,10 20,20 30,30 C 40,40 50,50 60,60')
    })

    it('handles single point (just moveTo)', () => {
      const points: NonEmptyArray<Point> = [[100, 200]]
      const result = buildEdgePath(points)
      expect(result).toBe('M 100,200')
    })
  })

  describe('buildMarkerDefs', () => {
    it('generates arrow marker SVG', () => {
      const svg = buildMarkerDefs('test-arrow', 'normal', '#3b82f6')
      expect(svg).toContain('<marker')
      expect(svg).toContain('id="test-arrow"')
      expect(svg).toContain('fill="#3b82f6"')
    })

    it('returns empty string for none arrow type', () => {
      const svg = buildMarkerDefs('test-none', 'none', '#000')
      expect(svg).toBe('')
    })

    it('generates diamond marker SVG', () => {
      const svg = buildMarkerDefs('test-diamond', 'diamond', '#ff0000')
      expect(svg).toContain('id="test-diamond"')
      expect(svg).toContain('fill="#ff0000"')
    })
  })

  describe('buildEdgeSvg', () => {
    it('builds complete edge SVG with path and markers', () => {
      const svg = buildEdgeSvg({
        id: 'edge-1',
        points: [[0, 0], [50, 50], [100, 50], [150, 100]] as NonEmptyArray<Point>,
        color: '#3b82f6',
        line: 'solid',
        head: 'normal',
        tail: 'none',
      })
      expect(svg).toContain('<path')
      expect(svg).toContain('stroke="#3b82f6"')
      expect(svg).toContain('marker-end')
      expect(svg).not.toContain('marker-start')
    })

    it('applies dashed stroke for dashed line', () => {
      const svg = buildEdgeSvg({
        id: 'edge-2',
        points: [[0, 0], [50, 50], [100, 50], [150, 100]] as NonEmptyArray<Point>,
        color: '#000',
        line: 'dashed',
        head: 'none',
        tail: 'none',
      })
      expect(svg).toContain('stroke-dasharray="8,10"')
    })

    it('applies dotted stroke for dotted line', () => {
      const svg = buildEdgeSvg({
        id: 'edge-3',
        points: [[0, 0], [50, 50], [100, 50], [150, 100]] as NonEmptyArray<Point>,
        color: '#000',
        line: 'dotted',
        head: 'none',
        tail: 'none',
      })
      expect(svg).toContain('stroke-dasharray="1,8"')
    })
  })

  describe('buildEdgeLabelSvg', () => {
    it('renders label text at bbox position', () => {
      const svg = buildEdgeLabelSvg({
        text: 'uses',
        labelBBox: { x: 100, y: 50, width: 40, height: 20 },
        labelColor: '#60a5fa',
        labelBgColor: '#172554',
      })
      expect(svg).toContain('uses')
      expect(svg).toContain('fill="#60a5fa"')
      expect(svg).toContain('fill="#172554"')
    })

    it('returns empty string when text is null', () => {
      const svg = buildEdgeLabelSvg({
        text: null,
        labelBBox: { x: 0, y: 0, width: 0, height: 0 },
        labelColor: '#000',
        labelBgColor: '#000',
      })
      expect(svg).toBe('')
    })
  })
})

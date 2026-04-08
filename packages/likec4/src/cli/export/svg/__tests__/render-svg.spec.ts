import type { DiagramEdge, DiagramNode, LayoutedView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { loadFonts } from '../fonts'
import { renderViewToSvg } from '../render-svg'

describe('renderViewToSvg', () => {
  it('renders a simple view with one node to SVG string', async () => {
    const fonts = await loadFonts()

    const node: DiagramNode = {
      id: 'system1' as any,
      kind: 'element' as any,
      parent: null,
      title: 'System 1',
      description: null,
      technology: null,
      children: [],
      inEdges: [],
      outEdges: [],
      shape: 'rectangle',
      color: 'primary' as any,
      icon: null,
      style: {},
      level: 0,
      x: 10,
      y: 10,
      width: 200,
      height: 120,
      labelBBox: { x: 10, y: 10, width: 200, height: 120 },
    } as any

    const view = {
      _type: 'element',
      _stage: 'layouted',
      id: 'index' as any,
      title: 'Test View',
      nodes: [node],
      edges: [],
      bounds: { x: 0, y: 0, width: 220, height: 140 },
      autoLayout: { direction: 'TB' },
    } as unknown as LayoutedView

    const svg = await renderViewToSvg(view, { fonts })
    expect(svg).toContain('<svg')
    // Satori converts text to SVG path glyphs, not readable text nodes
    // Verify width/height dimensions are correct (bounds + 2*padding)
    expect(svg).toContain('width="260"') // 220 + 2*20 padding
    expect(svg).toContain('height="180"') // 140 + 2*20 padding
    // Verify node fill color is present (primary color = #3b82f6)
    expect(svg).toContain('#3b82f6')
  })

  it('renders edges as SVG paths', async () => {
    const fonts = await loadFonts()

    const node1: DiagramNode = {
      id: 'a' as any,
      kind: 'element' as any,
      parent: null,
      title: 'A',
      children: [],
      inEdges: ['e1' as any],
      outEdges: [],
      shape: 'rectangle',
      color: 'primary' as any,
      style: {},
      level: 0,
      x: 10,
      y: 10,
      width: 100,
      height: 60,
      labelBBox: { x: 10, y: 10, width: 100, height: 60 },
    } as any

    const node2: DiagramNode = {
      id: 'b' as any,
      kind: 'element' as any,
      parent: null,
      title: 'B',
      children: [],
      inEdges: [],
      outEdges: ['e1' as any],
      shape: 'rectangle',
      color: 'blue' as any,
      style: {},
      level: 0,
      x: 10,
      y: 200,
      width: 100,
      height: 60,
      labelBBox: { x: 10, y: 200, width: 100, height: 60 },
    } as any

    const edge: DiagramEdge = {
      id: 'e1' as any,
      parent: null,
      source: 'a' as any,
      target: 'b' as any,
      label: 'uses',
      color: 'primary' as any,
      line: 'solid',
      head: 'normal',
      tail: 'none',
      points: [[60, 70], [60, 100], [60, 150], [60, 200]] as any,
      labelBBox: { x: 40, y: 130, width: 40, height: 16 },
    } as any

    const view = {
      _type: 'element',
      _stage: 'layouted',
      id: 'test' as any,
      title: 'Test',
      nodes: [node1, node2],
      edges: [edge],
      bounds: { x: 0, y: 0, width: 120, height: 270 },
      autoLayout: { direction: 'TB' },
    } as unknown as LayoutedView

    const svg = await renderViewToSvg(view, { fonts })
    expect(svg).toContain('<path')
    expect(svg).toContain('stroke="#3b82f6"')
    expect(svg).toContain('uses')
    expect(svg).toContain('marker-end')
  })
})

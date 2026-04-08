import type { LayoutedView } from '@likec4/core'
import satori from 'satori'
import type { SatoriFontConfig } from './fonts'
import { SatoriDiagram } from './satori-nodes'
import { buildEdgeLabelSvg, buildEdgeSvg } from './svg-edges'
import { getRelationshipColors } from './theme'

const PADDING = 20

export interface RenderSvgOptions {
  fonts: SatoriFontConfig[]
  padding?: number
}

export async function renderViewToSvg(
  view: LayoutedView,
  options: RenderSvgOptions,
): Promise<string> {
  const { fonts, padding = PADDING } = options
  const { bounds, nodes, edges } = view

  const width = bounds.width + padding * 2
  const height = bounds.height + padding * 2

  const offsetX = -bounds.x + padding
  const offsetY = -bounds.y + padding

  // Shift nodes for Satori rendering
  const shiftedNodes = nodes.map(n => ({
    ...n,
    x: n.x + offsetX,
    y: n.y + offsetY,
  }))

  // Render nodes with Satori
  const nodesSvg = await satori(
    SatoriDiagram({ nodes: shiftedNodes, width, height }),
    {
      width,
      height,
      fonts: fonts.map(f => ({
        name: f.name,
        data: f.data,
        weight: f.weight,
        style: f.style,
      })),
    },
  )

  // Build edge SVG elements
  const edgeElements: string[] = []
  for (const edge of edges) {
    const relColors = getRelationshipColors(edge.color)
    const shiftedPoints = edge.points.map(([x, y]) => [x + offsetX, y + offsetY] as const) as typeof edge.points

    edgeElements.push(
      buildEdgeSvg({
        id: edge.id,
        points: shiftedPoints,
        color: relColors.line,
        line: edge.line,
        head: edge.head,
        tail: edge.tail,
      }),
    )

    if (edge.label && edge.labelBBox) {
      edgeElements.push(
        buildEdgeLabelSvg({
          text: edge.label,
          labelBBox: {
            x: edge.labelBBox.x + offsetX,
            y: edge.labelBBox.y + offsetY,
            width: edge.labelBBox.width,
            height: edge.labelBBox.height,
          },
          labelColor: relColors.label,
          labelBgColor: relColors.labelBg,
        }),
      )
    }
  }

  // Combine: inject edges into the Satori SVG
  if (edgeElements.length === 0) {
    return nodesSvg
  }

  // Insert edge group before the closing </svg> tag
  const edgeGroup = `<g class="edges">${edgeElements.join('')}</g>`
  return nodesSvg.replace('</svg>', `${edgeGroup}</svg>`)
}

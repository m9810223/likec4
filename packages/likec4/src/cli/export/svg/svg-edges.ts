import type { BBox, NonEmptyArray, Point } from '@likec4/core'
import type { RelationshipArrowType, RelationshipLineType } from '@likec4/core/types'
import { hasAtLeast } from 'remeda'

function printPoint(point: Point): string {
  return `${Math.trunc(point[0])},${Math.trunc(point[1])}`
}

export function buildEdgePath(points: NonEmptyArray<Point>): string {
  const [start, ...rest] = points
  let path = `M ${printPoint(start)}`
  const remaining = [...rest]

  while (hasAtLeast(remaining, 3)) {
    const cp1 = remaining.shift()!
    const cp2 = remaining.shift()!
    const end = remaining.shift()!
    path += ` C ${printPoint(cp1)} ${printPoint(cp2)} ${printPoint(end)}`
  }

  return path
}

export function buildMarkerDefs(
  id: string,
  arrowType: RelationshipArrowType | undefined,
  color: string,
): string {
  if (!arrowType || arrowType === 'none') return ''

  switch (arrowType) {
    case 'normal':
      return `<marker id="${id}" viewBox="-1 -1 12 10" refX="4" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 8 3 L 0 6 L 1 3 z" fill="${color}" stroke-width="0"/></marker>`
    case 'onormal':
      return `<marker id="${id}" viewBox="-1 -1 12 10" refX="4" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 8 3 L 0 6 L 1 3 z" stroke="${color}" fill="white" stroke-width="1.25" stroke-linejoin="miter"/></marker>`
    case 'open':
    case 'vee':
      return `<marker id="${id}" viewBox="-4 -4 14 16" refX="5" refY="4" markerWidth="7" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L7,4 L0,8 L4,4 Z" stroke="${color}" fill="${color}" stroke-width="1" stroke-linecap="round"/></marker>`
    case 'diamond':
      return `<marker id="${id}" viewBox="-4 -4 16 14" refX="5" refY="4" markerWidth="10" markerHeight="8" orient="auto-start-reverse"><path d="M5,0 L10,4 L5,8 L0,4 Z" fill="${color}" stroke-width="0"/></marker>`
    case 'odiamond':
      return `<marker id="${id}" viewBox="-4 -4 16 14" refX="6" refY="4" markerWidth="10" markerHeight="8" orient="auto-start-reverse"><path d="M5,0 L10,4 L5,8 L0,4 Z" stroke="${color}" fill="white" stroke-width="1.25"/></marker>`
    case 'crow':
      return `<marker id="${id}" viewBox="-1 -1 12 12" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 8 0 L 0 4 L 8 8 M 8 4 L 0 4" fill="none" stroke="${color}" stroke-width="1"/></marker>`
    case 'dot':
      return `<marker id="${id}" viewBox="0 0 10 10" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><circle cx="4" cy="4" r="3" fill="${color}" stroke-width="0"/></marker>`
    case 'odot':
      return `<marker id="${id}" viewBox="0 0 10 10" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><circle cx="4" cy="4" r="3" stroke="${color}" fill="white" stroke-width="1.25"/></marker>`
    default:
      return ''
  }
}

function lineStyleToDashArray(line: RelationshipLineType): string | undefined {
  switch (line) {
    case 'dashed':
      return '8,10'
    case 'dotted':
      return '1,8'
    case 'solid':
      return undefined
  }
}

export function buildEdgeSvg(opts: {
  id: string
  points: NonEmptyArray<Point>
  color: string
  line: RelationshipLineType
  head: RelationshipArrowType | undefined
  tail: RelationshipArrowType | undefined
}): string {
  const { id, points, color, line, head, tail } = opts
  const pathD = buildEdgePath(points)
  const dashArray = lineStyleToDashArray(line)

  const defs: string[] = []
  let markerEnd = ''
  let markerStart = ''

  if (head && head !== 'none') {
    const markerId = `${id}-head`
    defs.push(buildMarkerDefs(markerId, head, color))
    markerEnd = ` marker-end="url(#${markerId})"`
  }

  if (tail && tail !== 'none') {
    const markerId = `${id}-tail`
    defs.push(buildMarkerDefs(markerId, tail, color))
    markerStart = ` marker-start="url(#${markerId})"`
  }

  const defsStr = defs.length > 0 ? `<defs>${defs.join('')}</defs>` : ''
  const dashAttr = dashArray ? ` stroke-dasharray="${dashArray}"` : ''

  return `${defsStr}<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"${dashAttr}${markerEnd}${markerStart}/>`
}

export function buildEdgeLabelSvg(opts: {
  text: string | null
  labelBBox: BBox
  labelColor: string
  labelBgColor: string
}): string {
  const { text, labelBBox, labelColor, labelBgColor } = opts
  if (!text) return ''

  const { x, y, width, height } = labelBBox
  const cx = Math.round(x + width / 2)
  const cy = Math.round(y + height / 2)
  const padding = 6
  const rx = 4

  return `<rect x="${x - padding}" y="${y - padding / 2}" width="${width + padding * 2}" height="${
    height + padding
  }" rx="${rx}" fill="${labelBgColor}"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="${labelColor}" font-family="IBM Plex Sans" font-size="14">${
    escapeXml(text)
  }</text>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

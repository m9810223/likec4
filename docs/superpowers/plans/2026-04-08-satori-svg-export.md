# Satori SVG Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native SVG export to the LikeC4 CLI using Satori, rendering Element Views to SVG without requiring a browser.

**Architecture:** Two-layer rendering — Satori renders nodes as JSX with absolute positioning, then a post-processing step injects SVG edge paths, arrow markers, and edge labels into the output. Theme colors are mapped from the existing `ElementColors` and `RelationshipColors` definitions.

**Tech Stack:** `satori` (JSX→SVG), IBM Plex Sans TTF fonts (bundled), `yargs` CLI (existing pattern), `@likec4/core` types.

---

## File Structure

```
packages/likec4/src/cli/export/svg/
  handler.ts          -- CLI command registration + handler (yargs pattern)
  render-svg.ts       -- Orchestrates Satori render + edge post-processing
  satori-nodes.tsx    -- SatoriDiagram, SatoriNode, SatoriCompound JSX components
  svg-edges.ts        -- Edge path generation, markers, labels (pure SVG string building)
  theme.ts            -- Maps ThemeColor → hex values for elements and relationships
  fonts.ts            -- Loads bundled IBM Plex Sans TTF files for Satori
  fonts/
    IBMPlexSans-Regular.ttf
    IBMPlexSans-SemiBold.ttf
  __tests__/
    theme.spec.ts
    svg-edges.spec.ts
    render-svg.spec.ts
packages/likec4/src/cli/export/index.ts  -- Add svgCmd to export command pipe
```

---

### Task 1: Theme Color Mapping

**Files:**
- Create: `packages/likec4/src/cli/export/svg/theme.ts`
- Create: `packages/likec4/src/cli/export/svg/__tests__/theme.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/likec4/src/cli/export/svg/__tests__/theme.spec.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/theme.spec.ts`
Expected: FAIL — module `../theme` not found

- [ ] **Step 3: Write minimal implementation**

Create `packages/likec4/src/cli/export/svg/theme.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/theme.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/likec4/src/cli/export/svg/theme.ts packages/likec4/src/cli/export/svg/__tests__/theme.spec.ts
git commit -m "feat(export): add theme color mapping for SVG export"
```

---

### Task 2: SVG Edge Path Generation

**Files:**
- Create: `packages/likec4/src/cli/export/svg/svg-edges.ts`
- Create: `packages/likec4/src/cli/export/svg/__tests__/svg-edges.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/likec4/src/cli/export/svg/__tests__/svg-edges.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildEdgePath, buildMarkerDefs, buildEdgeSvg, buildEdgeLabelSvg } from '../svg-edges'
import type { NonEmptyArray, Point } from '@likec4/core'

describe('svg-edges', () => {
  describe('buildEdgePath', () => {
    it('builds cubic bezier path from points', () => {
      const points: NonEmptyArray<Point> = [[10, 20], [30, 40], [50, 60], [70, 80]]
      const result = buildEdgePath(points)
      expect(result).toBe('M 10,20 C 30,40 50,60 70,80')
    })

    it('builds multi-segment bezier path', () => {
      const points: NonEmptyArray<Point> = [
        [0, 0], [10, 10], [20, 20], [30, 30],
        [40, 40], [50, 50], [60, 60],
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/svg-edges.spec.ts`
Expected: FAIL — module `../svg-edges` not found

- [ ] **Step 3: Write minimal implementation**

Create `packages/likec4/src/cli/export/svg/svg-edges.ts`:

```typescript
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

  return `<rect x="${x - padding}" y="${y - padding / 2}" width="${width + padding * 2}" height="${height + padding}" rx="${rx}" fill="${labelBgColor}"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="${labelColor}" font-family="IBM Plex Sans" font-size="14">${escapeXml(text)}</text>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/svg-edges.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/likec4/src/cli/export/svg/svg-edges.ts packages/likec4/src/cli/export/svg/__tests__/svg-edges.spec.ts
git commit -m "feat(export): add SVG edge path generation"
```

---

### Task 3: Font Loading

**Files:**
- Create: `packages/likec4/src/cli/export/svg/fonts.ts`
- Create: `packages/likec4/src/cli/export/svg/fonts/` (directory for TTF files)

Satori requires font data as `ArrayBuffer`. We need to bundle IBM Plex Sans TTF files since Satori does not support WOFF2 (the format used by `@fontsource-variable`). We'll download the static TTF files from the `@fontsource/ibm-plex-sans` package (non-variable, static weights).

- [ ] **Step 1: Install the static font package**

Run: `cd packages/likec4 && pnpm add @fontsource/ibm-plex-sans`

This provides static TTF/WOFF files for individual weights. We need Regular (400) and SemiBold (600).

- [ ] **Step 2: Write font loading module**

Create `packages/likec4/src/cli/export/svg/fonts.ts`:

```typescript
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
```

Note: We use WOFF files from `@fontsource/ibm-plex-sans` since Satori supports WOFF (but not WOFF2). If the package only has WOFF2, we'll fall back to bundling TTF files manually — verify the file exists at the resolved path after install.

- [ ] **Step 3: Verify font file resolution works**

Run: `cd packages/likec4 && node -e "const r = require('module').createRequire(import.meta.url || __filename); console.log(r.resolve('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff'))"`

If this fails, check what files are available:
Run: `ls node_modules/@fontsource/ibm-plex-sans/files/ | head -20`

Adapt the file path in `fonts.ts` to match what's actually available (e.g., `.ttf` instead of `.woff`).

- [ ] **Step 4: Commit**

```bash
git add packages/likec4/src/cli/export/svg/fonts.ts packages/likec4/package.json pnpm-lock.yaml
git commit -m "feat(export): add font loading for Satori SVG export"
```

---

### Task 4: Satori Node Components (JSX)

**Files:**
- Create: `packages/likec4/src/cli/export/svg/satori-nodes.tsx`

This is the core rendering logic. Satori components use only Satori-compatible CSS (Flexbox, absolute positioning, basic box model). All nodes are positioned absolutely using coordinates from `LayoutedView`.

- [ ] **Step 1: Install satori dependency**

Run: `cd packages/likec4 && pnpm add satori`

- [ ] **Step 2: Create satori-nodes.tsx**

Create `packages/likec4/src/cli/export/svg/satori-nodes.tsx`:

```tsx
import type { DiagramEdge, DiagramNode } from '@likec4/core'
import type { ElementShape } from '@likec4/core/types'
import type { ReactNode } from 'react'
import { getElementColors } from './theme'

function shapeToRadius(shape: ElementShape): number {
  switch (shape) {
    case 'cylinder':
    case 'storage':
    case 'bucket':
    case 'queue':
    case 'document':
      return 6
    case 'rectangle':
      return 2
    case 'component':
    case 'browser':
    case 'mobile':
    case 'person':
      return 6
    default:
      return 6
  }
}

interface SatoriNodeProps {
  node: DiagramNode
}

function SatoriNode({ node }: SatoriNodeProps) {
  const colors = getElementColors(node.color)
  const radius = shapeToRadius(node.shape)

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: colors.fill,
        borderRadius: radius,
        border: `2px solid ${colors.stroke}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        overflow: 'hidden',
      }}
    >
      {node.icon && node.icon !== 'none' && (
        <img
          src={node.icon as string}
          width={32}
          height={32}
          style={{ marginBottom: 4 }}
        />
      )}
      <div
        style={{
          color: colors.hiContrast,
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'IBM Plex Sans',
          textAlign: 'center',
          lineClamp: 2,
          display: 'flex',
        }}
      >
        {node.title}
      </div>
      {node.technology && (
        <div
          style={{
            color: colors.loContrast,
            fontSize: 12,
            fontFamily: 'IBM Plex Sans',
            textAlign: 'center',
            marginTop: 2,
            display: 'flex',
          }}
        >
          {node.technology}
        </div>
      )}
      {node.description && (
        <div
          style={{
            color: colors.loContrast,
            fontSize: 12,
            fontFamily: 'IBM Plex Sans',
            textAlign: 'center',
            marginTop: 4,
            lineClamp: 3,
            display: 'flex',
          }}
        >
          {String(node.description)}
        </div>
      )}
    </div>
  )
}

interface SatoriCompoundProps {
  node: DiagramNode
}

function SatoriCompound({ node }: SatoriCompoundProps) {
  const colors = getElementColors(node.color)
  const opacity = (node.style?.opacity ?? 100) / 100

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: `${colors.fill}18`,
        borderRadius: 8,
        border: `2px dashed ${colors.stroke}60`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          color: colors.hiContrast,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'IBM Plex Sans',
          padding: '6px 12px',
          display: 'flex',
        }}
      >
        {node.title}
      </div>
    </div>
  )
}

export interface SatoriDiagramProps {
  nodes: DiagramNode[]
  width: number
  height: number
}

export function SatoriDiagram({ nodes, width, height }: SatoriDiagramProps) {
  const compounds: DiagramNode[] = []
  const elements: DiagramNode[] = []

  for (const node of nodes) {
    if (node.children.length > 0) {
      compounds.push(node)
    } else {
      elements.push(node)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
      }}
    >
      {compounds.map(node => (
        <SatoriCompound key={node.id} node={node} />
      ))}
      {elements.map(node => (
        <SatoriNode key={node.id} node={node} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/likec4/src/cli/export/svg/satori-nodes.tsx packages/likec4/package.json pnpm-lock.yaml
git commit -m "feat(export): add Satori JSX components for SVG node rendering"
```

---

### Task 5: SVG Render Orchestration

**Files:**
- Create: `packages/likec4/src/cli/export/svg/render-svg.ts`
- Create: `packages/likec4/src/cli/export/svg/__tests__/render-svg.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/likec4/src/cli/export/svg/__tests__/render-svg.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { renderViewToSvg } from '../render-svg'
import { loadFonts } from '../fonts'
import type { LayoutedView, DiagramNode, DiagramEdge } from '@likec4/core'

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
    expect(svg).toContain('System 1')
    expect(svg).toContain('width="260"')  // 220 + 2*20 padding
    expect(svg).toContain('height="180"') // 140 + 2*20 padding
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
      x: 10, y: 10, width: 100, height: 60,
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
      x: 10, y: 200, width: 100, height: 60,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/render-svg.spec.ts`
Expected: FAIL — module `../render-svg` not found

- [ ] **Step 3: Write minimal implementation**

Create `packages/likec4/src/cli/export/svg/render-svg.ts`:

```typescript
import type { LayoutedView } from '@likec4/core'
import satori from 'satori'
import { SatoriDiagram } from './satori-nodes'
import { buildEdgeSvg, buildEdgeLabelSvg } from './svg-edges'
import { getRelationshipColors } from './theme'
import type { SatoriFontConfig } from './fonts'

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/__tests__/render-svg.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/likec4/src/cli/export/svg/render-svg.ts packages/likec4/src/cli/export/svg/__tests__/render-svg.spec.ts
git commit -m "feat(export): add SVG render orchestration (Satori + edge post-processing)"
```

---

### Task 6: CLI Command Registration

**Files:**
- Create: `packages/likec4/src/cli/export/svg/handler.ts`
- Modify: `packages/likec4/src/cli/export/index.ts`

- [ ] **Step 1: Create the CLI handler**

Create `packages/likec4/src/cli/export/svg/handler.ts`:

```typescript
import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { type ViteLogger, createLikeC4Logger, startTimer } from '../../../logger'
import { path, project, useDotBin } from '../../options'
import { showSupportUsMessage } from '../../support-message'
import { loadFonts } from './fonts'
import { renderViewToSvg } from './render-svg'

type SvgExportArgs = {
  path: string
  output: string | undefined
  project: string | undefined
  useDot: boolean
  theme: 'light' | 'dark'
  outputType: 'relative' | 'flat'
  filter: string[] | undefined
}

async function runExportSvg(args: SvgExportArgs, logger: ViteLogger): Promise<void> {
  const timer = startTimer(logger)

  await using likec4 = await fromWorkspace(args.path, {
    graphviz: args.useDot ? 'binary' : 'wasm',
    watch: false,
  })

  const projects = [...likec4.projectsManager.all]
  if (args.project) {
    if (!projects.some(p => p === args.project)) {
      logger.error(`project not found: ${args.project}`)
      throw new Error(`project not found: ${args.project}`)
    }
  }
  if (!hasAtLeast(projects, 1)) {
    logger.error('No projects found')
    throw new Error('No projects found')
  }

  const fonts = await loadFonts()
  logger.info(k.dim('fonts loaded'))

  for (const prj of projects) {
    if (args.project && prj !== args.project) continue

    let views = await likec4.diagrams(prj)

    if (args.filter && hasAtLeast(args.filter, 1) && hasAtLeast(views, 1)) {
      const { default: picomatch } = await import('picomatch')
      const matcher = picomatch(args.filter)
      views = views.filter(v => matcher(v.id))
    }

    // MVP: only element views
    views = views.filter(v => v._type === 'element')

    if (!hasAtLeast(views, 1)) {
      logger.warn('no element views found')
      continue
    }

    const output = args.output ?? resolve(args.path, 'export', 'svg')

    for (const view of views) {
      let relativePath = '.'
      if (args.outputType === 'relative' && view.sourcePath) {
        const rp = view.sourcePath
        relativePath = rp.includes('/') ? rp.slice(0, rp.lastIndexOf('/')) : '.'
      }

      const outPath = resolve(output, relativePath, `${view.id}.svg`)
      await mkdir(dirname(outPath), { recursive: true })

      const svg = await renderViewToSvg(view, { fonts })
      await writeFile(outPath, svg)

      const displayPath = outPath.startsWith(args.path) ? relative(args.path, outPath) : outPath
      logger.info(`${k.dim('exported')} ${displayPath}`)
    }
  }

  timer.stopAndLog(`✓ export in `)
}

async function svgHandler(args: SvgExportArgs): Promise<void> {
  const logger = createLikeC4Logger('c4:export')
  await runExportSvg(args, logger)
}

export function svgCmd(yargs: Argv) {
  return yargs.command({
    command: 'svg [path]',
    describe: 'export views to SVG',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          'outdir': {
            alias: ['o', 'output'],
            type: 'string',
            desc: 'output directory for SVG files',
            normalize: true,
            nargs: 1,
            coerce: resolve,
          },
          project,
          'use-dot': useDotBin,
          'theme': {
            choices: ['light', 'dark'] as const,
            desc: 'color-scheme to use, defaults to light',
            nargs: 1,
          },
          'flat': {
            alias: ['flatten'],
            type: 'boolean',
            desc: 'flatten all SVGs in outdir ignoring sources structure',
          },
          'filter': {
            alias: 'f',
            array: true,
            string: true,
            desc: 'include views with ids matching given patterns',
          },
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export svg')}
    ${k.gray('Export element views to SVG in current directory')}

  ${k.green('$0 export svg -o ./out src/likec4')}
    ${k.gray('Export element views from src/likec4 to ./out directory')}
`),
    handler: async args => {
      await svgHandler({
        path: args.path,
        output: args.outdir,
        project: args.project,
        useDot: !!args['use-dot'],
        theme: (args.theme as 'light' | 'dark') ?? 'light',
        outputType: args.flat ? 'flat' : 'relative',
        filter: args.filter,
      })
      showSupportUsMessage()
    },
  })
}
```

- [ ] **Step 2: Register svgCmd in export index**

Edit `packages/likec4/src/cli/export/index.ts`:

Add import at top:
```typescript
import { svgCmd } from './svg/handler'
```

Add `svgCmd` to the pipe chain:
```typescript
pipe(
  yargs.usage(`${k.bold('Usage:')} $0 export <format> [path]`),
  pngCmd,
  jsonCmd,
  drawioCmd,
  svgCmd,
)
```

Update describe:
```typescript
describe: 'Export to images, JSON, SVG, or DrawIO',
```

- [ ] **Step 3: Verify the CLI command is registered**

Run: `cd packages/likec4 && pnpm exec tsx src/cli/index.ts export --help`

Expected: Output should list `svg` as one of the available formats.

- [ ] **Step 4: Commit**

```bash
git add packages/likec4/src/cli/export/svg/handler.ts packages/likec4/src/cli/export/index.ts
git commit -m "feat(export): add CLI command for SVG export"
```

---

### Task 7: End-to-End Test with Example Project

**Files:** No new files — uses existing example projects.

- [ ] **Step 1: Run SVG export against example project**

Run: `cd packages/likec4 && pnpm exec tsx src/cli/index.ts export svg ../../examples/cloud-system -o /tmp/likec4-svg-test`

Expected: SVG files generated in `/tmp/likec4-svg-test/`. Should see element views exported.

- [ ] **Step 2: Verify SVG output is valid**

Run: `head -5 /tmp/likec4-svg-test/*.svg` to check SVG headers.

Open one of the generated SVG files in a browser to visually verify:
- Nodes are positioned correctly
- Colors match the theme
- Edges connect the right nodes
- Labels are readable

- [ ] **Step 3: Fix any issues found**

Address any rendering issues (positioning offsets, missing elements, broken paths) and re-run until the output looks correct.

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix(export): address SVG rendering issues from e2e testing"
```

---

### Task 8: Final Cleanup and All Tests Pass

- [ ] **Step 1: Run all SVG export tests**

Run: `pnpm --filter likec4 exec vitest run src/cli/export/svg/`
Expected: All tests PASS

- [ ] **Step 2: Run full package typecheck**

Run: `pnpm --filter likec4 typecheck`
Expected: No type errors

- [ ] **Step 3: Run full package test suite**

Run: `pnpm --filter likec4 test --no-typecheck`
Expected: All existing tests still PASS, new tests PASS

- [ ] **Step 4: Format code**

Run: `pnpm exec dprint fmt packages/likec4/src/cli/export/svg/**`
Expected: Files formatted according to project conventions.

- [ ] **Step 5: Final commit**

```bash
git add -u
git commit -m "chore(export): format and finalize SVG export"
```

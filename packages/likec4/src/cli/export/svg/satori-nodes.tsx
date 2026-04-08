import type { DiagramNode } from '@likec4/core'
import type { ElementShape } from '@likec4/core/types'
import { getElementColors } from './theme'

function shapeToRadius(shape: ElementShape): number {
  switch (shape) {
    case 'rectangle':
      return 2
    case 'cylinder':
    case 'storage':
    case 'bucket':
    case 'queue':
    case 'document':
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
      {compounds.map(node => <SatoriCompound key={node.id} node={node} />)}
      {elements.map(node => <SatoriNode key={node.id} node={node} />)}
    </div>
  )
}

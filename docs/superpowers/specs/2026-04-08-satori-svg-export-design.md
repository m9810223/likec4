# Satori SVG Export Design

## Goal

Add native SVG export to LikeC4 CLI using [Satori](https://github.com/vercel/satori), eliminating the need for Playwright/headless browser for SVG output.

## Background

Current PNG export depends on Playwright (headless Chromium) to render React components and screenshot them. This is heavy, platform-dependent, and only produces raster output. There is no native SVG export.

Satori converts React JSX to SVG strings server-side without a browser. Combined with the fact that `LayoutedView` already contains all positional data, we can render architecture diagrams directly to SVG.

## Scope (MVP)

- **In scope**: Element View only (nodes, edges, compound nodes)
- **In scope**: CLI command `likec4 export svg`
- **In scope**: Light/dark theme support
- **Out of scope**: Dynamic View, Deployment View, Sequence Diagram (future work)

## Architecture

### Two-Layer Rendering

1. **Satori layer**: Renders nodes using simplified React JSX components. Handles text layout, colors, shapes, icons.
2. **SVG post-processing layer**: Programmatically injects edge `<path>` elements, arrow markers, and edge labels into the Satori-generated SVG.

This split exists because Satori only supports HTML/CSS (Flexbox), and cannot draw SVG `<path>` elements directly. Edges require bezier curves and arrow markers that are best expressed as raw SVG.

### Data Flow

```
CLI: likec4 export svg [path]
  -> Load workspace, get LayoutedView[]
  -> For each view:
      1. Build JSX tree from LayoutedView nodes (SatoriDiagram)
      2. Satori renders JSX -> SVG string (nodes only)
      3. Post-process: parse SVG, inject edge paths/markers/labels
      4. Write final .svg file
```

## Component Design (Satori JSX)

All components use only Satori-compatible CSS (Flexbox, absolute positioning, basic box model).

### SatoriDiagram

Root container. Sets dimensions from `LayoutedView.bounds`. Contains all node components positioned absolutely.

```tsx
<div style={{ position: 'relative', width, height }}>
  {compounds.map(node => <SatoriCompound key={node.id} {...node} />)}
  {elements.map(node => <SatoriNode key={node.id} {...node} />)}
</div>
```

Rendering order: compounds first (background), then elements on top.

### SatoriNode

Single element node, absolutely positioned at `(node.position.x, node.position.y)` with `node.size.width` and `node.size.height`.

Contents:
- Shape background: CSS `border-radius`, `background-color`, `border` to approximate element shapes
- Icon: `<img src="data:...">` (base64-encoded) or icon URL
- Title: text with font-weight 600
- Technology: smaller text, muted color
- Description: smaller text, limited lines

### SatoriCompound

Compound/group node. Same absolute positioning. Renders as a bordered container with a title bar at top.

### Shape Mapping (MVP)

| LikeC4 Shape | CSS Approximation |
|---|---|
| `rectangle`, `box` | No border-radius |
| `rounded-box` | `border-radius: 8px` |
| `circle` | `border-radius: 50%` |
| `cylinder` | Rounded top/bottom borders (approximation) |
| `hexagon` | Rectangular with border-radius (approximation) |
| `browser`, `mobile`, `queue`, `storage` | Rectangular with distinguishing visual cues |

Complex shapes (hexagon, cylinder) will use CSS approximations in MVP. Exact SVG shapes can be added via post-processing in future iterations.

## Edge Rendering (Post-Processing)

After Satori produces the node SVG, edges are injected programmatically:

### Edge Paths

From `LayoutedView` edge data, extract control points and generate SVG paths:
- Straight edges: `<line>` or `<path>` with `M` and `L` commands
- Curved edges: `<path>` with cubic bezier (`C`) commands using waypoints

### Arrow Markers

Define `<marker>` elements in `<defs>`:
- `arrow-filled`: Solid triangle arrowhead
- `arrow-open`: Open arrowhead
- `arrow-none`: No marker

Each edge references its head/tail marker via `marker-start`/`marker-end`.

### Edge Labels

Positioned at the midpoint of the edge path:
- Use `<text>` elements for simple labels
- Font: IBM Plex Sans, smaller size than node text
- Background rectangle behind label text for readability

### Edge Styling

- Line color from edge `color` property (mapped to theme)
- Line style: solid, dashed, dotted (via `stroke-dasharray`)
- Line width based on edge style

## Font Strategy

### Bundled Fonts

Package IBM Plex Sans TTF files with the export module:
- **Regular (400)**: For descriptions, technology labels, edge labels
- **SemiBold (600)**: For node titles, compound titles

IBM Plex Sans uses OFL license, allowing redistribution.

### Font Loading

```ts
// fonts.ts
export async function loadFonts(): Promise<SatoriOptions['fonts']> {
  return [
    { name: 'IBM Plex Sans', data: await readFile('IBMPlexSans-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'IBM Plex Sans', data: await readFile('IBMPlexSans-SemiBold.ttf'), weight: 600, style: 'normal' },
  ]
}
```

### Font File Location

Font TTF files stored in `packages/likec4/src/cli/export/svg/fonts/` directory.

## Theme Support

Reuse existing LikeC4 theme color mappings. The theme determines:
- Node background colors
- Node border colors
- Text colors
- Edge colors
- Compound background/border colors

Both `light` and `dark` themes are supported via the `--theme` CLI option.

## CLI Interface

```
likec4 export svg [path] [options]

Arguments:
  path              Path to LikeC4 source directory (default: current dir)

Options:
  -o, --output      Output directory (default: ./export/svg)
  --theme           Theme: light | dark (default: light)
  --output-type     Output structure: relative | flat (default: flat)
```

### Handler Pattern

Follows the same pattern as existing PNG export handler:

```ts
// handler.ts
export async function exportViewsToSVG(args: SvgExportArgs): Promise<void> {
  const likec4 = await fromWorkspace(args.path)
  const views = await likec4.diagrams(projectId)
  const fonts = await loadFonts()

  for (const view of views) {
    if (view._type !== 'element') continue  // MVP: element views only
    const svg = await renderViewToSVG(view, { fonts, theme: args.theme })
    await writeFile(outputPath, svg)
  }
}
```

## File Structure

```
packages/likec4/src/cli/export/svg/
  handler.ts          -- CLI handler (load workspace, iterate views, write files)
  render-svg.ts       -- Orchestrates Satori render + edge post-processing
  satori-nodes.tsx    -- SatoriDiagram, SatoriNode, SatoriCompound JSX components
  svg-edges.ts        -- Edge path generation, markers, labels
  fonts.ts            -- Font loading utilities
  theme.ts            -- Theme color mapping for Satori components
  fonts/
    IBMPlexSans-Regular.ttf
    IBMPlexSans-SemiBold.ttf
```

## Dependencies

| Package | Purpose |
|---|---|
| `satori` | React JSX to SVG conversion |
| `@resvg/resvg-js` | (Optional, future) SVG to PNG conversion without Playwright |

No new CSS framework or layout library needed. All positioning comes from `LayoutedView` coordinates.

## Icon Handling

Node icons in LikeC4 can be:
1. **Built-in tech icons** (`@likec4/icons`): SVG strings, convert to base64 data URI for Satori `<img>`
2. **URL icons**: Fetch and embed as base64 data URI (or reference directly if SVG allows external resources)

For MVP, icons are embedded as base64 data URIs to ensure the SVG is self-contained.

## Testing Strategy

- **Unit tests**: Test individual functions (edge path generation, theme mapping, font loading)
- **Snapshot tests**: Render sample `LayoutedView` fixtures to SVG, compare against snapshots
- **Visual verification**: Manual comparison of SVG output against browser-rendered diagrams

## Future Extensions

1. **Deployment View** support
2. **Dynamic View / Sequence Diagram** support
3. **PNG export via resvg** (Satori SVG -> resvg -> PNG, replacing Playwright)
4. **Exact shape rendering** via SVG clipPath post-processing
5. **Web app integration** (export SVG from browser UI)

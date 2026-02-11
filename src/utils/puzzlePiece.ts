import { createSeededRandom } from './seededRandom'

export type EdgeType = -1 | 0 | 1

export interface PieceEdges {
  top: EdgeType
  right: EdgeType
  bottom: EdgeType
  left: EdgeType
}

export interface EdgeMap {
  horizontal: EdgeType[][] // (rows+1) x cols
  vertical: EdgeType[][]   // rows x (cols+1)
}

export function getTabSize(tileSize: number): number {
  return Math.max(2, Math.round(tileSize * 0.14))
}

/**
 * Generate a deterministic edge map for the entire puzzle.
 *
 * horizontal[r][c]: shared edge between row r-1 and row r.
 *   1 = piece above has tab going down, piece below has blank going up.
 *  -1 = piece below has tab going up, piece above has blank going down.
 *   0 = border (r=0 or r=rows).
 *
 * vertical[r][c]: shared edge between col c-1 and col c.
 *   1 = piece to left has tab going right, piece to right has blank going left.
 *  -1 = piece to right has tab going left, piece to left has blank going right.
 *   0 = border (c=0 or c=cols).
 */
export function generateEdgeMap(seed: number, rows: number, cols: number): EdgeMap {
  const random = createSeededRandom(seed + 7919)

  const horizontal: EdgeType[][] = []
  for (let r = 0; r <= rows; r++) {
    horizontal[r] = []
    for (let c = 0; c < cols; c++) {
      horizontal[r][c] = (r === 0 || r === rows) ? 0 : (random() > 0.5 ? 1 : -1)
    }
  }

  const vertical: EdgeType[][] = []
  for (let r = 0; r < rows; r++) {
    vertical[r] = []
    for (let c = 0; c <= cols; c++) {
      vertical[r][c] = (c === 0 || c === cols) ? 0 : (random() > 0.5 ? 1 : -1)
    }
  }

  return { horizontal, vertical }
}

/**
 * Get the edges for a specific piece.
 * Returns 1 for tab (protrudes outward), -1 for blank (indented), 0 for flat border.
 */
export function getPieceEdges(edgeMap: EdgeMap, row: number, col: number): PieceEdges {
  return {
    top: (-edgeMap.horizontal[row][col]) as EdgeType,
    bottom: edgeMap.horizontal[row + 1][col] as EdgeType,
    left: (-edgeMap.vertical[row][col]) as EdgeType,
    right: edgeMap.vertical[row][col + 1] as EdgeType,
  }
}

/**
 * Generate an SVG path string for the jigsaw piece clip-path.
 * The path is defined in a coordinate space where the tile element
 * is (tileSize + 2*tabSize) x (tileSize + 2*tabSize), with the
 * content area centered at (tabSize, tabSize).
 */
export function generatePieceClipPath(
  tileSize: number,
  tabSize: number,
  edges: PieceEdges,
): string {
  const t = tabSize
  const s = tileSize

  // Content area corners within the extended element
  const x0 = t
  const y0 = t
  const x1 = t + s
  const y1 = t + s

  let path = `M ${r(x0)} ${r(y0)} `
  path += edgePath(x0, y0, x1, y0, edges.top, t)
  path += edgePath(x1, y0, x1, y1, edges.right, t)
  path += edgePath(x1, y1, x0, y1, edges.bottom, t)
  path += edgePath(x0, y1, x0, y0, edges.left, t)
  path += 'Z'

  return path
}

function r(n: number): string {
  return n.toFixed(2)
}

/**
 * Generate path segment for one edge of a jigsaw piece.
 * Traces from (x0,y0) to (x1,y1) with an optional tab or blank.
 * The outward normal (for tabs) points 90° clockwise from the
 * travel direction in screen coordinates.
 */
function edgePath(
  x0: number, y0: number,
  x1: number, y1: number,
  edge: EdgeType,
  tabSize: number,
): string {
  if (edge === 0) {
    return `L ${r(x1)} ${r(y1)} `
  }

  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.sqrt(dx * dx + dy * dy)

  // Along-edge unit vector
  const ax = dx / len
  const ay = dy / len

  // Outward normal (90° CW from travel direction in screen coords)
  const px = ay
  const py = -ax

  // Protrusion factor: positive = outward (tab), negative = inward (blank)
  const t = tabSize * edge

  // Helper: compute a point at (fraction along edge, perpendicular offset)
  const pt = (along: number, perp: number): string => {
    const x = x0 + ax * along * len + px * perp * t
    const y = y0 + ay * along * len + py * perp * t
    return `${r(x)} ${r(y)}`
  }

  let p = ''

  // Straight approach to neck
  p += `L ${pt(0.36, 0)} `

  // Left side of neck (curving outward toward head)
  p += `C ${pt(0.36, 0.12)}, ${pt(0.44, 0.12)}, ${pt(0.44, 0.36)} `

  // Left side of head (expanding outward)
  p += `C ${pt(0.44, 0.68)}, ${pt(0.30, 1.0)}, ${pt(0.50, 1.0)} `

  // Right side of head (contracting inward)
  p += `C ${pt(0.70, 1.0)}, ${pt(0.56, 0.68)}, ${pt(0.56, 0.36)} `

  // Right side of neck (curving back to edge)
  p += `C ${pt(0.56, 0.12)}, ${pt(0.64, 0.12)}, ${pt(0.64, 0)} `

  // Straight departure to end
  p += `L ${pt(1.0, 0)} `

  return p
}

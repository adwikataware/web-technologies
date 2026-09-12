// Draws the relationships. Each edge is a straight segment between the two
// boxes, clipped to their borders so it never runs underneath a class, with the
// UML adornments supplied as SVG markers: a hollow triangle for inheritance, a
// filled or hollow diamond on the whole end of a composition or aggregation,
// and a plain open arrow for an association or dependency.

import { NODE_WIDTH, nodeHeight, relationKind } from '../model/uml.js'

const PARALLEL_GAP = 18

export function RelationMarkers() {
  return (
    <defs>
      <marker id="uml-triangle" markerWidth="14" markerHeight="14"
        refX="13" refY="7" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L13,7 L0,14 Z" className="marker-hollow" />
      </marker>
      <marker id="uml-arrow" markerWidth="12" markerHeight="12"
        refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L11,6 L0,12" className="marker-open" />
      </marker>
      <marker id="uml-diamond-filled" markerWidth="18" markerHeight="12"
        refX="0" refY="6" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,6 L8,0 L16,6 L8,12 Z" className="marker-filled" />
      </marker>
      <marker id="uml-diamond-hollow" markerWidth="18" markerHeight="12"
        refX="0" refY="6" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,6 L8,0 L16,6 L8,12 Z" className="marker-hollow" />
      </marker>
    </defs>
  )
}

const centreOf = (node) => ({
  x: node.x + NODE_WIDTH / 2,
  y: node.y + nodeHeight(node) / 2
})

// Where the segment from `from` towards `to` leaves the box around `from`.
function borderPoint(node, from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return from
  const halfW = NODE_WIDTH / 2
  const halfH = nodeHeight(node) / 2
  const sx = dx === 0 ? Infinity : halfW / Math.abs(dx)
  const sy = dy === 0 ? Infinity : halfH / Math.abs(dy)
  const s = Math.min(sx, sy)
  return { x: from.x + dx * s, y: from.y + dy * s }
}

// Several relationships between the same pair would sit on top of each other,
// so they are fanned out along the perpendicular.
function parallelOffset(relation, relations) {
  const siblings = relations.filter(
    (r) => (r.sourceId === relation.sourceId && r.targetId === relation.targetId) ||
      (r.sourceId === relation.targetId && r.targetId === relation.sourceId)
  )
  if (siblings.length < 2) return 0
  const index = siblings.findIndex((r) => r.id === relation.id)
  return (index - (siblings.length - 1) / 2) * PARALLEL_GAP
}

export function edgeGeometry(relation, relations, byId) {
  const source = byId.get(relation.sourceId)
  const target = byId.get(relation.targetId)
  if (!source || !target) return null

  let a = centreOf(source)
  let b = centreOf(target)

  const shift = parallelOffset(relation, relations)
  if (shift) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    a = { x: a.x + nx * shift, y: a.y + ny * shift }
    b = { x: b.x + nx * shift, y: b.y + ny * shift }
  }

  return {
    start: borderPoint(source, a, b),
    end: borderPoint(target, b, a),
    source,
    target
  }
}

function Edge({ relation, geometry, selected, onSelect }) {
  const kind = relationKind(relation.kind)
  const { start, end } = geometry

  const markerEnd = kind.head === 'hollow-triangle'
    ? 'url(#uml-triangle)'
    : 'url(#uml-arrow)'
  const markerStart = kind.tail === 'filled-diamond'
    ? 'url(#uml-diamond-filled)'
    : kind.tail === 'hollow-diamond'
      ? 'url(#uml-diamond-hollow)'
      : undefined

  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }

  // The role name and the multiplicity belong at the target end, but outside
  // the box and clear of the line itself, so they are stepped back along the
  // segment and pushed to opposite sides of it.
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  // They also sit at different distances from the box, otherwise a near
  // vertical edge leaves them side by side and they read as one word.
  const backMult = Math.min(20, len / 3)
  const backRole = Math.min(52, len / 2)
  const rolePoint = {
    x: end.x - ux * backRole - uy * 13,
    y: end.y - uy * backRole + ux * 13
  }
  const multPoint = {
    x: end.x - ux * backMult + uy * 13,
    y: end.y - uy * backMult - ux * 13
  }

  const showMultiplicity = ['association', 'aggregation', 'composition']
    .includes(relation.kind) && relation.multiplicity

  return (
    <g
      className={`edge edge-${relation.kind}${selected ? ' is-selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(relation.id) }}
    >
      {/* a fat invisible line so the edge is easy to click */}
      <line className="edge-hit"
        x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      <line
        className={`edge-line${kind.line === 'dashed' ? ' is-dashed' : ''}`}
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {relation.label && (
        <text className="edge-label" x={mid.x} y={mid.y - 6}>{relation.label}</text>
      )}
      {relation.targetRole && (
        <text className="edge-role" x={rolePoint.x} y={rolePoint.y}>
          {relation.targetRole}
        </text>
      )}
      {showMultiplicity && (
        <text className="edge-multiplicity" x={multPoint.x} y={multPoint.y}>
          {relation.multiplicity}
        </text>
      )}
    </g>
  )
}

export default function RelationLayer({ diagram, selectedId, onSelect }) {
  const byId = new Map(diagram.classes.map((c) => [c.id, c]))

  return (
    <g className="edges">
      {diagram.relations.map((relation) => {
        const geometry = edgeGeometry(relation, diagram.relations, byId)
        if (!geometry) return null
        return (
          <Edge
            key={relation.id}
            relation={relation}
            geometry={geometry}
            selected={relation.id === selectedId}
            onSelect={onSelect}
          />
        )
      })}
    </g>
  )
}

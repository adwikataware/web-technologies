// A single class box, drawn as plain SVG so the diagram stays crisp at any
// zoom and exports cleanly. Notation follows UML: the stereotype sits above
// the name, an abstract name is italic, a static member is underlined, and
// visibility is the usual + - # ~ prefix.

import {
  NODE_WIDTH, ROW_HEIGHT, COMPARTMENT_PAD,
  headerHeight, compartmentHeight, nodeHeight,
  visibilitySymbol, stereotypeOf
} from '../model/uml.js'

const CHAR_LIMIT = 32

const clip = (text) =>
  text.length > CHAR_LIMIT ? `${text.slice(0, CHAR_LIMIT - 1)}…` : text

const attributeLabel = (a) =>
  `${visibilitySymbol(a.visibility)} ${a.name}: ${a.type}`

const methodLabel = (m) => {
  const args = m.parameters.map((p) => `${p.name}: ${p.type}`).join(', ')
  return `${visibilitySymbol(m.visibility)} ${m.name}(${args}): ${m.returnType}`
}

function MemberRow({ x, y, label, isStatic, isAbstract, muted }) {
  return (
    <text
      x={x}
      y={y}
      className={[
        'node-member',
        isStatic ? 'is-static' : '',
        isAbstract ? 'is-abstract' : '',
        muted ? 'is-muted' : ''
      ].filter(Boolean).join(' ')}
    >
      {clip(label)}
    </text>
  )
}

export default function ClassNode({
  node, selected, linkingFrom, onPointerDown, onSelect
}) {
  const height = nodeHeight(node)
  const header = headerHeight(node)
  const stereotype = stereotypeOf(node)
  const isEnum = node.kind === 'enum'

  const rows = isEnum
    ? node.literals.map((l) => ({ key: l, label: l }))
    : node.attributes.map((a) => ({
      key: a.id, label: attributeLabel(a), isStatic: a.isStatic
    }))

  const attrBox = compartmentHeight(rows.length)
  const methodRows = isEnum ? [] : node.methods
  const methodTop = header + attrBox

  const classes = [
    'node',
    `node-${node.kind}`,
    selected ? 'is-selected' : '',
    linkingFrom ? 'is-linking' : ''
  ].filter(Boolean).join(' ')

  return (
    <g
      className={classes}
      transform={`translate(${node.x}, ${node.y})`}
      onPointerDown={(e) => onPointerDown(e, node)}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
    >
      <rect className="node-body" width={NODE_WIDTH} height={height} rx="4" />

      {/* header */}
      {stereotype && (
        <text x={NODE_WIDTH / 2} y="17" className="node-stereotype">{stereotype}</text>
      )}
      <text
        x={NODE_WIDTH / 2}
        y={stereotype ? 36 : 22}
        className={`node-name${node.kind === 'abstract' ? ' is-abstract' : ''}`}
      >
        {clip(node.name)}
      </text>
      <line className="node-rule" x1="0" y1={header} x2={NODE_WIDTH} y2={header} />

      {/* attributes, or the enumeration constants */}
      {rows.length === 0 && (
        <text x="10" y={header + COMPARTMENT_PAD + 13} className="node-member is-muted">
          {isEnum ? 'no constants' : 'no attributes'}
        </text>
      )}
      {rows.map((row, i) => (
        <MemberRow
          key={row.key}
          x={10}
          y={header + COMPARTMENT_PAD + 13 + i * ROW_HEIGHT}
          label={row.label}
          isStatic={row.isStatic}
        />
      ))}

      {/* operations */}
      {!isEnum && (
        <>
          <line className="node-rule" x1="0" y1={methodTop} x2={NODE_WIDTH} y2={methodTop} />
          {methodRows.length === 0 && (
            <text x="10" y={methodTop + COMPARTMENT_PAD + 13} className="node-member is-muted">
              no operations
            </text>
          )}
          {methodRows.map((m, i) => (
            <MemberRow
              key={m.id}
              x={10}
              y={methodTop + COMPARTMENT_PAD + 13 + i * ROW_HEIGHT}
              label={methodLabel(m)}
              isStatic={m.isStatic}
              isAbstract={m.isAbstract || node.kind === 'interface'}
            />
          ))}
        </>
      )}
    </g>
  )
}

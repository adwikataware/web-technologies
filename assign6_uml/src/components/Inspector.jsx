// Everything about the selected element is edited here: the class header, its
// attributes and operations (with parameters), or, when an edge is selected,
// the relationship itself.

import {
  CLASS_KINDS, VISIBILITY, COMMON_TYPES, RELATION_KINDS, MULTIPLICITIES,
  FIELD_RELATIONS, relationKind
} from '../model/uml.js'

function TypeField({ value, onChange, includeVoid = false, id }) {
  const options = includeVoid ? COMMON_TYPES : COMMON_TYPES.filter((t) => t !== 'void')
  return (
    <>
      <input
        id={id}
        className="type-input"
        list={includeVoid ? 'uml-types-void' : 'uml-types'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type"
      />
      <datalist id={includeVoid ? 'uml-types-void' : 'uml-types'}>
        {options.map((t) => <option key={t} value={t} />)}
      </datalist>
    </>
  )
}

function VisibilityField({ value, onChange }) {
  return (
    <select className="vis-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {VISIBILITY.map((v) => (
        <option key={v.id} value={v.id}>{v.symbol} {v.id}</option>
      ))}
    </select>
  )
}

function AttributeRow({ node, attribute, dispatch }) {
  const patch = (p) => dispatch({
    type: 'updateAttribute', id: node.id, memberId: attribute.id, patch: p
  })

  return (
    <li className="member-row">
      <div className="member-main">
        <VisibilityField value={attribute.visibility} onChange={(v) => patch({ visibility: v })} />
        <input
          className="name-input"
          value={attribute.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="name"
        />
        <TypeField value={attribute.type} onChange={(t) => patch({ type: t })} />
        <button
          type="button"
          className="icon-btn danger"
          onClick={() => dispatch({ type: 'deleteAttribute', id: node.id, memberId: attribute.id })}
          aria-label={`Delete ${attribute.name}`}
        >
          ×
        </button>
      </div>
      <div className="member-flags">
        <label>
          <input type="checkbox" checked={attribute.isStatic}
            onChange={(e) => patch({ isStatic: e.target.checked })} /> static
        </label>
        <label>
          <input type="checkbox" checked={attribute.isFinal}
            onChange={(e) => patch({ isFinal: e.target.checked })} /> final
        </label>
      </div>
    </li>
  )
}

function MethodRow({ node, method, dispatch }) {
  const patch = (p) => dispatch({
    type: 'updateMethod', id: node.id, memberId: method.id, patch: p
  })
  const isInterface = node.kind === 'interface'

  return (
    <li className="member-row">
      <div className="member-main">
        {!isInterface && (
          <VisibilityField value={method.visibility} onChange={(v) => patch({ visibility: v })} />
        )}
        <input
          className="name-input"
          value={method.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="operation"
        />
        <TypeField value={method.returnType} onChange={(t) => patch({ returnType: t })} includeVoid />
        <button
          type="button"
          className="icon-btn danger"
          onClick={() => dispatch({ type: 'deleteMethod', id: node.id, memberId: method.id })}
          aria-label={`Delete ${method.name}`}
        >
          ×
        </button>
      </div>

      {!isInterface && (
        <div className="member-flags">
          <label>
            <input type="checkbox" checked={method.isStatic}
              onChange={(e) => patch({ isStatic: e.target.checked })} /> static
          </label>
          <label>
            <input type="checkbox" checked={method.isAbstract}
              onChange={(e) => patch({ isAbstract: e.target.checked, isStatic: false })} /> abstract
          </label>
        </div>
      )}

      <ul className="param-list">
        {method.parameters.map((p) => (
          <li key={p.id}>
            <input
              className="name-input"
              value={p.name}
              onChange={(e) => dispatch({
                type: 'updateParameter', id: node.id, memberId: method.id,
                paramId: p.id, patch: { name: e.target.value }
              })}
              placeholder="arg"
            />
            <TypeField
              value={p.type}
              onChange={(t) => dispatch({
                type: 'updateParameter', id: node.id, memberId: method.id,
                paramId: p.id, patch: { type: t }
              })}
            />
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => dispatch({
                type: 'deleteParameter', id: node.id, memberId: method.id, paramId: p.id
              })}
              aria-label="Delete parameter"
            >
              ×
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="text-btn"
            onClick={() => dispatch({ type: 'addParameter', id: node.id, memberId: method.id })}
          >
            + parameter
          </button>
        </li>
      </ul>
    </li>
  )
}

function ClassInspector({ node, diagram, dispatch, onSelect }) {
  const patch = (p) => dispatch({ type: 'updateClass', id: node.id, patch: p })
  const isEnum = node.kind === 'enum'

  const connected = diagram.relations.filter(
    (r) => r.sourceId === node.id || r.targetId === node.id
  )

  return (
    <div className="inspector">
      <div className="field">
        <label htmlFor="class-name">Class name</label>
        <input
          id="class-name"
          value={node.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="class-kind">Kind</label>
        <select
          id="class-kind"
          value={node.kind}
          onChange={(e) => patch({ kind: e.target.value })}
        >
          {CLASS_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>

      {isEnum ? (
        <div className="field">
          <label htmlFor="enum-literals">Constants (one per line)</label>
          <textarea
            id="enum-literals"
            rows={5}
            value={node.literals.join('\n')}
            onChange={(e) => dispatch({
              type: 'setLiterals',
              id: node.id,
              value: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
            })}
          />
        </div>
      ) : (
        <>
          <section className="member-block">
            <header>
              <h3>Attributes</h3>
              <button type="button" className="text-btn"
                onClick={() => dispatch({ type: 'addAttribute', id: node.id })}>
                + attribute
              </button>
            </header>
            <ul className="member-list">
              {node.attributes.map((a) => (
                <AttributeRow key={a.id} node={node} attribute={a} dispatch={dispatch} />
              ))}
              {!node.attributes.length && <li className="empty">None yet.</li>}
            </ul>
          </section>

          <section className="member-block">
            <header>
              <h3>Operations</h3>
              <button type="button" className="text-btn"
                onClick={() => dispatch({ type: 'addMethod', id: node.id })}>
                + operation
              </button>
            </header>
            <ul className="member-list">
              {node.methods.map((m) => (
                <MethodRow key={m.id} node={node} method={m} dispatch={dispatch} />
              ))}
              {!node.methods.length && <li className="empty">None yet.</li>}
            </ul>
          </section>
        </>
      )}

      {connected.length > 0 && (
        <section className="member-block">
          <header><h3>Relationships</h3></header>
          <ul className="relation-list">
            {connected.map((r) => {
              const other = diagram.classes.find(
                (c) => c.id === (r.sourceId === node.id ? r.targetId : r.sourceId)
              )
              const outgoing = r.sourceId === node.id
              return (
                <li key={r.id}>
                  <button type="button" className="link-btn"
                    onClick={() => onSelect({ type: 'relation', id: r.id })}>
                    {relationKind(r.kind).label} {outgoing ? '→' : '←'} {other?.name ?? '?'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <button
        type="button"
        className="danger-btn"
        onClick={() => { dispatch({ type: 'deleteClass', id: node.id }); onSelect(null) }}
      >
        Delete {node.name}
      </button>
    </div>
  )
}

function RelationInspector({ relation, diagram, dispatch, onSelect }) {
  const patch = (p) => dispatch({ type: 'updateRelation', id: relation.id, patch: p })
  const name = (id) => diagram.classes.find((c) => c.id === id)?.name ?? '?'
  const carriesField = FIELD_RELATIONS.includes(relation.kind)

  return (
    <div className="inspector">
      <p className="relation-summary">
        <strong>{name(relation.sourceId)}</strong>
        <span className="arrow"> → </span>
        <strong>{name(relation.targetId)}</strong>
      </p>

      <div className="field">
        <label htmlFor="rel-kind">Relationship</label>
        <select id="rel-kind" value={relation.kind}
          onChange={(e) => patch({ kind: e.target.value })}>
          {RELATION_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <p className="hint">{relationKind(relation.kind).hint}</p>
      </div>

      <button
        type="button"
        className="text-btn"
        onClick={() => patch({ sourceId: relation.targetId, targetId: relation.sourceId })}
      >
        ⇄ Swap direction
      </button>

      {carriesField && (
        <>
          <div className="field">
            <label htmlFor="rel-role">Role name (becomes the field name)</label>
            <input
              id="rel-role"
              value={relation.targetRole}
              onChange={(e) => patch({ targetRole: e.target.value })}
              placeholder={`defaults to ${name(relation.targetId).toLowerCase()}`}
            />
          </div>

          <div className="field">
            <label htmlFor="rel-mult">Multiplicity</label>
            <select id="rel-mult" value={relation.multiplicity}
              onChange={(e) => patch({ multiplicity: e.target.value })}>
              {MULTIPLICITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <p className="hint">
              Many-valued ends generate a <code>List&lt;{name(relation.targetId)}&gt;</code>.
            </p>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="rel-label">Label</label>
        <input id="rel-label" value={relation.label}
          onChange={(e) => patch({ label: e.target.value })} placeholder="optional" />
      </div>

      <button
        type="button"
        className="danger-btn"
        onClick={() => { dispatch({ type: 'deleteRelation', id: relation.id }); onSelect(null) }}
      >
        Delete relationship
      </button>
    </div>
  )
}

export default function InspectorPanel({ diagram, selection, dispatch, onSelect }) {
  if (!selection) {
    return (
      <div className="inspector empty-state">
        <h3>Nothing selected</h3>
        <p>Click a class or a relationship to edit it.</p>
        <ul className="tips">
          <li>Double-click empty canvas to add a class.</li>
          <li>Pick a relationship from the toolbar, then click source and target.</li>
          <li>Drag a box to move it; drag the background to pan.</li>
        </ul>
      </div>
    )
  }

  if (selection.type === 'class') {
    const node = diagram.classes.find((c) => c.id === selection.id)
    if (!node) return <div className="inspector empty-state"><p>That class is gone.</p></div>
    return (
      <ClassInspector node={node} diagram={diagram} dispatch={dispatch} onSelect={onSelect} />
    )
  }

  const relation = diagram.relations.find((r) => r.id === selection.id)
  if (!relation) return <div className="inspector empty-state"><p>That relationship is gone.</p></div>
  return (
    <RelationInspector
      relation={relation} diagram={diagram} dispatch={dispatch} onSelect={onSelect}
    />
  )
}

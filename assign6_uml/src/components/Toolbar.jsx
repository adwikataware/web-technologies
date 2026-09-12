// Top bar: the package the code lands in, the add / relationship tools, undo
// and redo, and moving a diagram in and out as JSON.

import { useRef } from 'react'
import { RELATION_KINDS } from '../model/uml.js'
import { downloadText } from '../codegen/zip.js'

export default function Toolbar({
  diagram, dispatch, canUndo, canRedo, undo, redo,
  loadSample, clear, pendingRelation, onPickRelation
}) {
  const fileInput = useRef(null)

  const importJson = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!Array.isArray(parsed.classes) || !Array.isArray(parsed.relations)) {
          throw new Error('missing classes or relations')
        }
        dispatch({
          type: 'load',
          diagram: {
            packageName: parsed.packageName ?? '',
            classes: parsed.classes,
            relations: parsed.relations
          }
        })
      } catch (error) {
        window.alert(`That file is not a diagram this editor can read.\n\n${error.message}`)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <header className="toolbar">
      <div className="toolbar-row toolbar-title">
        <h1>UML Class Diagram Generator</h1>
        <div className="package-field">
          <label htmlFor="package">package</label>
          <input
            id="package"
            value={diagram.packageName}
            onChange={(e) => dispatch({ type: 'setPackage', value: e.target.value })}
            placeholder="com.example.app"
          />
        </div>
      </div>

      <div className="toolbar-row">
        <div className="tool-group">
          <button type="button" className="primary"
            onClick={() => dispatch({ type: 'addClass', overrides: { x: 60, y: 60 } })}>
            + Class
          </button>
          <button type="button"
            onClick={() => dispatch({ type: 'addClass', overrides: { x: 60, y: 60, kind: 'interface', name: 'NewInterface' } })}>
            + Interface
          </button>
          <button type="button"
            onClick={() => dispatch({ type: 'addClass', overrides: { x: 60, y: 60, kind: 'enum', name: 'NewEnum', literals: ['FIRST', 'SECOND'] } })}>
            + Enum
          </button>
        </div>

        <div className="tool-group relation-tools">
          {RELATION_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              title={k.hint}
              className={pendingRelation === k.id ? 'is-armed' : ''}
              onClick={() => onPickRelation(pendingRelation === k.id ? null : k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="tool-group">
          <button type="button" onClick={undo} disabled={!canUndo}>Undo</button>
          <button type="button" onClick={redo} disabled={!canRedo}>Redo</button>
        </div>

        <div className="tool-group">
          <button type="button" onClick={loadSample}>Load example</button>
          <button type="button" onClick={() => {
            if (window.confirm('Clear the whole diagram?')) clear()
          }}>
            Clear
          </button>
          <button type="button"
            onClick={() => downloadText(JSON.stringify(diagram, null, 2), 'diagram.json', 'application/json')}>
            Export JSON
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>Import JSON</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={importJson}
            hidden
          />
        </div>
      </div>
    </header>
  )
}

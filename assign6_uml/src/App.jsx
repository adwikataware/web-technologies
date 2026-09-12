import { useEffect, useMemo, useState } from 'react'
import { useDiagram } from './state/diagramStore.js'
import { generateJava, DEFAULT_OPTIONS } from './codegen/javaGenerator.js'
import { validateDiagram } from './codegen/validate.js'
import Toolbar from './components/Toolbar.jsx'
import Canvas from './components/Canvas.jsx'
import InspectorPanel from './components/Inspector.jsx'
import CodePanel from './components/CodePanel.jsx'

export default function App() {
  const { diagram, dispatch, checkpoint, undo, redo, canUndo, canRedo, loadSample, clear } =
    useDiagram()

  const [selection, setSelection] = useState(null)
  const [tab, setTab] = useState('properties')
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [pendingRelation, setPendingRelation] = useState(null)
  const [linkSource, setLinkSource] = useState(null)

  // The diagram is the single input; code and problems are derived from it, so
  // the moment a box changes the Java on the right changes with it.
  const files = useMemo(() => generateJava(diagram, options), [diagram, options])
  const issues = useMemo(() => validateDiagram(diagram), [diagram])
  const errorCount = issues.filter((i) => i.level === 'error').length

  const cancelLink = () => { setPendingRelation(null); setLinkSource(null) }

  const completeLink = (sourceId, targetId) => {
    if (sourceId !== targetId) {
      dispatch({ type: 'addRelation', sourceId, targetId, overrides: { kind: pendingRelation } })
    }
    cancelLink()
  }

  // Delete removes the selected element; ctrl/cmd+Z and shift+Z drive history.
  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
      if (typing) return

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo(); else undo()
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection) {
        event.preventDefault()
        dispatch({
          type: selection.type === 'class' ? 'deleteClass' : 'deleteRelation',
          id: selection.id
        })
        setSelection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, dispatch, undo, redo])

  return (
    <div className="app">
      <Toolbar
        diagram={diagram}
        dispatch={dispatch}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={undo}
        redo={redo}
        loadSample={() => { loadSample(); setSelection(null) }}
        clear={() => { clear(); setSelection(null) }}
        pendingRelation={pendingRelation}
        onPickRelation={(kind) => { setPendingRelation(kind); setLinkSource(null) }}
      />

      <main className="workspace">
        <section className="canvas-column">
          <Canvas
            diagram={diagram}
            selection={selection}
            onSelect={setSelection}
            dispatch={dispatch}
            checkpoint={checkpoint}
            pendingRelation={pendingRelation}
            linkSource={linkSource}
            onLinkSource={setLinkSource}
            onLinkComplete={completeLink}
            onCancelLink={cancelLink}
          />

          <div className={`issues${errorCount ? ' has-errors' : ''}`}>
            <h2>
              {issues.length === 0
                ? 'No problems found'
                : `${issues.length} problem${issues.length > 1 ? 's' : ''}`}
              <span className="counts">
                {diagram.classes.length} classes · {diagram.relations.length} relationships
              </span>
            </h2>
            {issues.length > 0 && (
              <ul>
                {issues.map((issue, i) => (
                  <li key={i} className={issue.level}>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => issue.classId && setSelection({ type: 'class', id: issue.classId })}
                    >
                      {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="side-panel">
          <div className="panel-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'properties'}
              className={tab === 'properties' ? 'is-active' : ''}
              onClick={() => setTab('properties')}>
              Properties
            </button>
            <button type="button" role="tab" aria-selected={tab === 'code'}
              className={tab === 'code' ? 'is-active' : ''}
              onClick={() => setTab('code')}>
              Java code <span className="badge">{files.length}</span>
            </button>
          </div>

          {tab === 'properties' ? (
            <InspectorPanel
              diagram={diagram}
              selection={selection}
              dispatch={dispatch}
              onSelect={setSelection}
            />
          ) : (
            <CodePanel
              files={files}
              options={options}
              onOptionsChange={setOptions}
              packageName={diagram.packageName}
            />
          )}
        </aside>
      </main>
    </div>
  )
}

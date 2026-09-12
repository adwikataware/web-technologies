// The generated Java, one tab per class, with the generator switches that
// change what comes out.

import { useEffect, useState } from 'react'
import { DEFAULT_OPTIONS } from '../codegen/javaGenerator.js'
import { createZip, downloadBlob, downloadText } from '../codegen/zip.js'

const SWITCHES = [
  { key: 'generateConstructors', label: 'Constructors' },
  { key: 'generateAccessors', label: 'Getters & setters' },
  { key: 'generateToString', label: 'toString()' },
  { key: 'stubInherited', label: 'Stub inherited operations' },
  { key: 'javadoc', label: 'Javadoc header' }
]

export default function CodePanel({ files, options, onOptionsChange, packageName }) {
  const [activeId, setActiveId] = useState(files[0]?.id ?? null)
  const [copied, setCopied] = useState(false)

  // Keep the selected tab valid as classes are added and removed.
  useEffect(() => {
    if (!files.length) { setActiveId(null); return }
    if (!files.some((f) => f.id === activeId)) setActiveId(files[0].id)
  }, [files, activeId])

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const active = files.find((f) => f.id === activeId) ?? files[0]

  const copy = async () => {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.code)
      setCopied(true)
    } catch {
      // Clipboard access can be refused; the textarea is still selectable.
      setCopied(false)
    }
  }

  const downloadAll = () => {
    const folder = (packageName || '').trim().replace(/\./g, '/')
    const zip = createZip(files.map((f) => ({
      name: folder ? `${folder}/${f.fileName}` : f.fileName,
      content: f.code
    })))
    downloadBlob(zip, 'uml-generated-java.zip')
  }

  if (!files.length) {
    return (
      <div className="code-panel empty-state">
        <h3>No code yet</h3>
        <p>Add a class to the diagram and its Java source appears here.</p>
      </div>
    )
  }

  return (
    <div className="code-panel">
      <div className="switches">
        {SWITCHES.map((s) => (
          <label key={s.key}>
            <input
              type="checkbox"
              checked={options[s.key] ?? DEFAULT_OPTIONS[s.key]}
              onChange={(e) => onOptionsChange({ ...options, [s.key]: e.target.checked })}
            />
            {s.label}
          </label>
        ))}
      </div>

      <div className="file-tabs" role="tablist">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === active.id}
            className={f.id === active.id ? 'is-active' : ''}
            onClick={() => setActiveId(f.id)}
          >
            {f.fileName}
          </button>
        ))}
      </div>

      <div className="code-actions">
        <button type="button" onClick={copy}>
          {copied ? 'Copied' : `Copy ${active.fileName}`}
        </button>
        <button type="button" onClick={() => downloadText(active.code, active.fileName, 'text/x-java-source')}>
          Download file
        </button>
        <button type="button" onClick={downloadAll}>
          Download all ({files.length}) as .zip
        </button>
      </div>

      <pre className="code-view"><code>{active.code}</code></pre>
    </div>
  )
}

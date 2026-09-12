// The drawing surface. Handles panning, zooming, dragging a class box around
// and the two-click gesture that draws a relationship between two boxes.

import { useCallback, useEffect, useRef, useState } from 'react'
import { NODE_WIDTH, nodeHeight, relationKind } from '../model/uml.js'
import ClassNode from './ClassNode.jsx'
import RelationLayer, { RelationMarkers } from './RelationLayer.jsx'

// Low enough that Fit can still frame a whole diagram on a phone screen.
const MIN_SCALE = 0.2
const MAX_SCALE = 2.2

export default function Canvas({
  diagram, selection, onSelect, dispatch, checkpoint,
  pendingRelation, linkSource, onLinkSource, onLinkComplete, onCancelLink
}) {
  const svgRef = useRef(null)
  const [view, setView] = useState({ scale: 1, tx: 40, ty: 20 })
  const [drag, setDrag] = useState(null)
  const [pan, setPan] = useState(null)
  const [pointer, setPointer] = useState(null)

  const toDiagram = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left - view.tx) / view.scale,
      y: (clientY - rect.top - view.ty) / view.scale
    }
  }, [view])

  /* ------------------------------------------------------------- dragging */

  const handleNodePointerDown = (event, node) => {
    event.stopPropagation()
    if (pendingRelation) return

    const point = toDiagram(event.clientX, event.clientY)
    checkpoint()
    setDrag({ id: node.id, dx: point.x - node.x, dy: point.y - node.y })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  useEffect(() => {
    if (!drag) return undefined

    const move = (event) => {
      const point = toDiagram(event.clientX, event.clientY)
      dispatch({
        type: 'moveClass',
        id: drag.id,
        x: Math.round(point.x - drag.dx),
        y: Math.round(point.y - drag.dy)
      })
    }
    const up = () => setDrag(null)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag, dispatch, toDiagram])

  /* ------------------------------------------------------------- panning */

  const handleBackgroundPointerDown = (event) => {
    if (event.target !== svgRef.current && !event.target.classList.contains('canvas-grid')) return
    setPan({ x: event.clientX - view.tx, y: event.clientY - view.ty })
    onSelect(null)
    if (pendingRelation) onCancelLink()
  }

  useEffect(() => {
    if (!pan) return undefined
    const move = (event) => {
      setView((v) => ({ ...v, tx: event.clientX - pan.x, ty: event.clientY - pan.y }))
    }
    const up = () => setPan(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [pan])

  /* --------------------------------------------------------------- zoom */

  const zoomBy = (factor, origin) => {
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      if (!origin) return { ...v, scale }
      // Keep whatever is under the cursor pinned in place.
      const k = scale / v.scale
      return {
        scale,
        tx: origin.x - (origin.x - v.tx) * k,
        ty: origin.y - (origin.y - v.ty) * k
      }
    })
  }

  const handleWheel = (event) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return
    event.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  const fitToContent = () => {
    if (!diagram.classes.length) { setView({ scale: 1, tx: 40, ty: 20 }); return }
    const rect = svgRef.current.getBoundingClientRect()
    const minX = Math.min(...diagram.classes.map((c) => c.x))
    const minY = Math.min(...diagram.classes.map((c) => c.y))
    const maxX = Math.max(...diagram.classes.map((c) => c.x + NODE_WIDTH))
    const maxY = Math.max(...diagram.classes.map((c) => c.y + nodeHeight(c)))
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min((rect.width - 60) / (maxX - minX), (rect.height - 60) / (maxY - minY)))
    )
    setView({
      scale,
      tx: 30 - minX * scale + Math.max(0, (rect.width - 60 - (maxX - minX) * scale) / 2),
      ty: 30 - minY * scale
    })
  }

  /* ------------------------------------------------------------- linking */

  const handleNodeClick = (id) => {
    if (!pendingRelation) { onSelect({ type: 'class', id }); return }
    if (!linkSource) { onLinkSource(id); return }
    onLinkComplete(linkSource, id)
  }

  useEffect(() => {
    if (!pendingRelation || !linkSource) return undefined
    const move = (event) => setPointer(toDiagram(event.clientX, event.clientY))
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [pendingRelation, linkSource, toDiagram])

  useEffect(() => {
    const key = (event) => { if (event.key === 'Escape') onCancelLink() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onCancelLink])

  const sourceNode = linkSource
    ? diagram.classes.find((c) => c.id === linkSource)
    : null

  const selectedClassId = selection?.type === 'class' ? selection.id : null
  const selectedRelationId = selection?.type === 'relation' ? selection.id : null

  return (
    <div className={`canvas-wrap${pendingRelation ? ' is-linking' : ''}`}>
      <div className="canvas-tools">
        <button type="button" onClick={() => zoomBy(1 / 1.15)} aria-label="Zoom out">−</button>
        <span className="zoom-readout">{Math.round(view.scale * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1.15)} aria-label="Zoom in">+</button>
        <button type="button" className="text-btn" onClick={fitToContent}>Fit</button>
      </div>

      {pendingRelation && (
        <div className="link-banner">
          <strong>{relationKind(pendingRelation).label}</strong>
          {linkSource
            ? ` — now click the target class (${relationKind(pendingRelation).hint})`
            : ' — click the source class'}
          <button type="button" className="text-btn" onClick={onCancelLink}>Cancel</button>
        </div>
      )}

      <svg
        ref={svgRef}
        className="canvas"
        onPointerDown={handleBackgroundPointerDown}
        onWheel={handleWheel}
        onDoubleClick={(event) => {
          if (event.target !== svgRef.current) return
          const point = toDiagram(event.clientX, event.clientY)
          dispatch({
            type: 'addClass',
            overrides: { x: Math.round(point.x - NODE_WIDTH / 2), y: Math.round(point.y - 30) }
          })
        }}
      >
        <RelationMarkers />
        <g transform={`translate(${view.tx}, ${view.ty}) scale(${view.scale})`}>
          <RelationLayer
            diagram={diagram}
            selectedId={selectedRelationId}
            onSelect={(id) => onSelect({ type: 'relation', id })}
          />

          {sourceNode && pointer && (
            <line
              className="link-preview"
              x1={sourceNode.x + NODE_WIDTH / 2}
              y1={sourceNode.y + nodeHeight(sourceNode) / 2}
              x2={pointer.x}
              y2={pointer.y}
            />
          )}

          {diagram.classes.map((node) => (
            <ClassNode
              key={node.id}
              node={node}
              selected={node.id === selectedClassId}
              linkingFrom={node.id === linkSource}
              onPointerDown={handleNodePointerDown}
              onSelect={handleNodeClick}
            />
          ))}
        </g>
      </svg>

      {!diagram.classes.length && (
        <p className="canvas-empty">
          Double-click anywhere on the canvas to drop in your first class.
        </p>
      )}
    </div>
  )
}

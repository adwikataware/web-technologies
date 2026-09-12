// One reducer holds the whole diagram, wrapped in a past/present/future stack
// so every edit is undoable. Dragging is the exception: it fires continuously,
// so the drag pushes one history entry when it starts and then updates the
// present in place.

import { useEffect, useMemo, useReducer } from 'react'
import {
  makeClass, makeAttribute, makeMethod, makeParameter, makeRelation
} from '../model/uml.js'
import { emptyDiagram, librarySample } from '../model/samples.js'

const STORAGE_KEY = 'assign6.uml.diagram'
const HISTORY_LIMIT = 50

const replaceById = (list, id, patch) =>
  list.map((item) => (item.id === id ? { ...item, ...patch } : item))

const mapClass = (state, id, fn) => ({
  ...state,
  classes: state.classes.map((c) => (c.id === id ? fn(c) : c))
})

function diagramReducer(state, action) {
  switch (action.type) {
    case 'setPackage':
      return { ...state, packageName: action.value }

    case 'addClass':
      return { ...state, classes: [...state.classes, makeClass(action.overrides)] }

    case 'updateClass':
      return { ...state, classes: replaceById(state.classes, action.id, action.patch) }

    case 'deleteClass':
      return {
        ...state,
        classes: state.classes.filter((c) => c.id !== action.id),
        relations: state.relations.filter(
          (r) => r.sourceId !== action.id && r.targetId !== action.id
        )
      }

    case 'addAttribute':
      return mapClass(state, action.id, (c) => ({
        ...c, attributes: [...c.attributes, makeAttribute(action.overrides)]
      }))

    case 'updateAttribute':
      return mapClass(state, action.id, (c) => ({
        ...c, attributes: replaceById(c.attributes, action.memberId, action.patch)
      }))

    case 'deleteAttribute':
      return mapClass(state, action.id, (c) => ({
        ...c, attributes: c.attributes.filter((a) => a.id !== action.memberId)
      }))

    case 'addMethod':
      return mapClass(state, action.id, (c) => ({
        ...c, methods: [...c.methods, makeMethod(action.overrides)]
      }))

    case 'updateMethod':
      return mapClass(state, action.id, (c) => ({
        ...c, methods: replaceById(c.methods, action.memberId, action.patch)
      }))

    case 'deleteMethod':
      return mapClass(state, action.id, (c) => ({
        ...c, methods: c.methods.filter((m) => m.id !== action.memberId)
      }))

    case 'addParameter':
      return mapClass(state, action.id, (c) => ({
        ...c,
        methods: c.methods.map((m) => (m.id === action.memberId
          ? { ...m, parameters: [...m.parameters, makeParameter()] }
          : m))
      }))

    case 'updateParameter':
      return mapClass(state, action.id, (c) => ({
        ...c,
        methods: c.methods.map((m) => (m.id === action.memberId
          ? { ...m, parameters: replaceById(m.parameters, action.paramId, action.patch) }
          : m))
      }))

    case 'deleteParameter':
      return mapClass(state, action.id, (c) => ({
        ...c,
        methods: c.methods.map((m) => (m.id === action.memberId
          ? { ...m, parameters: m.parameters.filter((p) => p.id !== action.paramId) }
          : m))
      }))

    case 'setLiterals':
      return mapClass(state, action.id, (c) => ({ ...c, literals: action.value }))

    case 'addRelation': {
      const exists = state.relations.some(
        (r) => r.sourceId === action.sourceId &&
          r.targetId === action.targetId &&
          r.kind === (action.overrides?.kind || 'association')
      )
      if (exists || action.sourceId === action.targetId) return state
      return {
        ...state,
        relations: [...state.relations, makeRelation(action.sourceId, action.targetId, action.overrides)]
      }
    }

    case 'updateRelation':
      return { ...state, relations: replaceById(state.relations, action.id, action.patch) }

    case 'deleteRelation':
      return { ...state, relations: state.relations.filter((r) => r.id !== action.id) }

    case 'load':
      return action.diagram

    default:
      return state
  }
}

// Edits that should not each land in the undo stack.
const TRANSIENT = new Set(['moveClass'])

function historyReducer(state, action) {
  if (action.type === 'undo') {
    if (!state.past.length) return state
    const previous = state.past[state.past.length - 1]
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future]
    }
  }

  if (action.type === 'redo') {
    if (!state.future.length) return state
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1)
    }
  }

  // The mouse-down that starts a drag records the position to come back to.
  if (action.type === 'checkpoint') {
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: state.present,
      future: []
    }
  }

  if (action.type === 'moveClass') {
    return {
      ...state,
      present: {
        ...state.present,
        classes: replaceById(state.present.classes, action.id, { x: action.x, y: action.y })
      }
    }
  }

  const next = diagramReducer(state.present, action)
  if (next === state.present) return state
  if (TRANSIENT.has(action.type)) return { ...state, present: next }

  return {
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: next,
    future: []
  }
}

function initialState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && Array.isArray(parsed.classes)) {
        return { past: [], present: parsed, future: [] }
      }
    }
  } catch {
    // A blocked or corrupt store just means we start from the sample.
  }
  return { past: [], present: librarySample(), future: [] }
}

export function useDiagram() {
  const [state, dispatch] = useReducer(historyReducer, undefined, initialState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present))
    } catch {
      // Autosave is a convenience; losing it must not break the editor.
    }
  }, [state.present])

  const actions = useMemo(() => ({
    dispatch,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    checkpoint: () => dispatch({ type: 'checkpoint' }),
    loadSample: () => dispatch({ type: 'load', diagram: librarySample() }),
    clear: () => dispatch({ type: 'load', diagram: emptyDiagram() })
  }), [])

  return {
    diagram: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    ...actions
  }
}

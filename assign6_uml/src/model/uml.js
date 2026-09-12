// The UML vocabulary this editor understands, plus the small factories that
// build empty nodes and relationships. Everything the canvas draws and the
// generator reads is one of the plain objects created here.

export const CLASS_KINDS = [
  { id: 'class', label: 'Class', stereotype: null },
  { id: 'abstract', label: 'Abstract Class', stereotype: '<<abstract>>' },
  { id: 'interface', label: 'Interface', stereotype: '<<interface>>' },
  { id: 'enum', label: 'Enumeration', stereotype: '<<enumeration>>' }
]

// UML visibility markers and the Java keyword each one maps to.
export const VISIBILITY = [
  { id: 'private', symbol: '-', java: 'private' },
  { id: 'public', symbol: '+', java: 'public' },
  { id: 'protected', symbol: '#', java: 'protected' },
  { id: 'package', symbol: '~', java: '' }
]

export const visibilitySymbol = (id) =>
  (VISIBILITY.find((v) => v.id === id) || VISIBILITY[0]).symbol

export const visibilityKeyword = (id) =>
  (VISIBILITY.find((v) => v.id === id) || VISIBILITY[0]).java

// Offered in the type dropdowns. Anything else can still be typed by hand,
// which is how a user references one of their own classes.
export const COMMON_TYPES = [
  'void', 'int', 'long', 'double', 'float', 'boolean', 'char',
  'String', 'Date', 'LocalDate', 'BigDecimal', 'Object'
]

export const RELATION_KINDS = [
  {
    id: 'generalization',
    label: 'Generalization',
    hint: 'child inherits parent  →  extends',
    line: 'solid',
    head: 'hollow-triangle'
  },
  {
    id: 'realization',
    label: 'Realization',
    hint: 'class fulfils interface  →  implements',
    line: 'dashed',
    head: 'hollow-triangle'
  },
  {
    id: 'composition',
    label: 'Composition',
    hint: 'whole owns part, part dies with it  →  field built by owner',
    line: 'solid',
    head: 'open-arrow',
    tail: 'filled-diamond'
  },
  {
    id: 'aggregation',
    label: 'Aggregation',
    hint: 'whole holds part, part survives  →  field injected',
    line: 'solid',
    head: 'open-arrow',
    tail: 'hollow-diamond'
  },
  {
    id: 'association',
    label: 'Association',
    hint: 'plain reference  →  field',
    line: 'solid',
    head: 'open-arrow'
  },
  {
    id: 'dependency',
    label: 'Dependency',
    hint: 'uses transiently  →  method parameter',
    line: 'dashed',
    head: 'open-arrow'
  }
]

export const relationKind = (id) =>
  RELATION_KINDS.find((r) => r.id === id) || RELATION_KINDS[4]

// Relations that put a field on the source class.
export const FIELD_RELATIONS = ['composition', 'aggregation', 'association']

export const MULTIPLICITIES = ['1', '0..1', '*', '1..*', '0..*']

export const isCollection = (multiplicity) =>
  multiplicity === '*' || multiplicity === '1..*' || multiplicity === '0..*'

let counter = 0
export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${counter++}`

// Box geometry. The canvas needs a node's height before React has drawn
// anything, so a box is measured from its row counts rather than from the DOM.
// These constants are the single source of truth for both the measurement and
// the rendering.
export const NODE_WIDTH = 230
export const ROW_HEIGHT = 19
export const COMPARTMENT_PAD = 6
export const HEADER_PLAIN = 34
export const HEADER_STEREOTYPED = 50

export const compartmentHeight = (rows) =>
  Math.max(rows, 1) * ROW_HEIGHT + COMPARTMENT_PAD * 2

export const headerHeight = (node) =>
  node.kind === 'class' ? HEADER_PLAIN : HEADER_STEREOTYPED

export function makeClass(overrides = {}) {
  return {
    id: newId('cls'),
    name: 'NewClass',
    kind: 'class',
    x: 80,
    y: 80,
    attributes: [],
    methods: [],
    literals: [],
    ...overrides
  }
}

export function makeAttribute(overrides = {}) {
  return {
    id: newId('attr'),
    name: 'field',
    type: 'String',
    visibility: 'private',
    isStatic: false,
    isFinal: false,
    ...overrides
  }
}

export function makeMethod(overrides = {}) {
  return {
    id: newId('mth'),
    name: 'operation',
    returnType: 'void',
    visibility: 'public',
    isStatic: false,
    isAbstract: false,
    parameters: [],
    ...overrides
  }
}

export function makeParameter(overrides = {}) {
  return { id: newId('par'), name: 'arg', type: 'String', ...overrides }
}

export function makeRelation(sourceId, targetId, overrides = {}) {
  return {
    id: newId('rel'),
    kind: 'association',
    sourceId,
    targetId,
    label: '',
    sourceRole: '',
    targetRole: '',
    multiplicity: '1',
    ...overrides
  }
}

export function nodeHeight(node) {
  if (node.kind === 'enum') {
    return headerHeight(node) + compartmentHeight(node.literals.length)
  }
  return headerHeight(node) +
    compartmentHeight(node.attributes.length) +
    compartmentHeight(node.methods.length)
}

export const stereotypeOf = (node) =>
  (CLASS_KINDS.find((k) => k.id === node.kind) || CLASS_KINDS[0]).stereotype

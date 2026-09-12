// Diagram -> Java. One compilation unit per class box on the canvas.
//
// The interesting part is that relationships, not just the class body, shape
// the output: generalization becomes `extends`, realization becomes
// `implements`, and composition / aggregation / association each become a
// field with a different ownership story. Abstract operations inherited from a
// parent or an interface are stubbed automatically so the emitted files
// actually compile.

import { FIELD_RELATIONS, isCollection, visibilityKeyword } from '../model/uml.js'
import {
  upperFirst, lowerFirst, pluralise, isPrimitive, defaultValue, constantInitialiser
} from './naming.js'

export const DEFAULT_OPTIONS = {
  generateConstructors: true,
  generateAccessors: true,
  generateToString: true,
  stubInherited: true,
  javadoc: true
}

const IMPORT_MAP = {
  List: 'java.util.List',
  ArrayList: 'java.util.ArrayList',
  Map: 'java.util.Map',
  HashMap: 'java.util.HashMap',
  Set: 'java.util.Set',
  Date: 'java.util.Date',
  LocalDate: 'java.time.LocalDate',
  LocalDateTime: 'java.time.LocalDateTime',
  BigDecimal: 'java.math.BigDecimal'
}

const INDENT = '    '
const PAD = INDENT + INDENT

/* ---------------------------------------------------------------- helpers */

const byId = (classes) => new Map(classes.map((c) => [c.id, c]))

const outgoing = (relations, id, kinds) =>
  relations.filter((r) => r.sourceId === id && kinds.includes(r.kind))

// Every type name mentioned inside an angle-bracketed type, so `List<Book>`
// contributes both List and Book.
const typeTokens = (type) => (type || '').split(/[<>,\s]+/).filter(Boolean)

function parentOf(node, relations, classes) {
  const rel = outgoing(relations, node.id, ['generalization'])[0]
  return rel ? byId(classes).get(rel.targetId) : null
}

function interfacesOf(node, relations, classes) {
  const map = byId(classes)
  return outgoing(relations, node.id, ['realization'])
    .map((r) => map.get(r.targetId))
    .filter(Boolean)
}

// Turns the relationships leaving a class into the fields it should carry.
function relationFields(node, relations, classes) {
  const map = byId(classes)
  return outgoing(relations, node.id, FIELD_RELATIONS).map((rel) => {
    const target = map.get(rel.targetId)
    if (!target) return null
    const many = isCollection(rel.multiplicity)
    const name = rel.targetRole
      ? rel.targetRole
      : many
        ? pluralise(lowerFirst(target.name))
        : lowerFirst(target.name)
    return {
      name,
      elementType: target.name,
      type: many ? 'List<' + target.name + '>' : target.name,
      many,
      kind: rel.kind,
      owned: rel.kind === 'composition',
      multiplicity: rel.multiplicity
    }
  }).filter(Boolean)
}

function dependenciesOf(node, relations, classes) {
  const map = byId(classes)
  return outgoing(relations, node.id, ['dependency'])
    .map((r) => map.get(r.targetId))
    .filter(Boolean)
}

const signatureOf = (m) => m.name + '(' + m.parameters.map((p) => p.type).join(',') + ')'

// The state a class initialises itself: its own instance attributes, plus the
// single-valued objects it is handed rather than builds. A composed part is
// created by the owner, so it is deliberately not a constructor argument.
function ownCtorFields(node, relations, classes) {
  return [
    ...node.attributes
      .filter((a) => !a.isStatic)
      .map((a) => ({ name: a.name, type: a.type, isFinal: a.isFinal })),
    ...relationFields(node, relations, classes)
      .filter((f) => !f.many && !f.owned)
      .map((f) => ({ name: f.name, type: f.type, isFinal: false }))
  ]
}

// Everything an ancestor's constructor needs, oldest ancestor first, so the
// child can pass it straight through to super(...).
function ancestorCtorFields(node, relations, classes, seen = new Set()) {
  const parent = parentOf(node, relations, classes)
  if (!parent || seen.has(parent.id)) return []
  seen.add(parent.id)
  return [
    ...ancestorCtorFields(parent, relations, classes, seen),
    ...ownCtorFields(parent, relations, classes)
  ]
}

// A child may legitimately repeat a name the parent already declares; the
// constructor can only carry one parameter of that name.
function dedupeByName(fields) {
  const seen = new Set()
  return fields.filter((f) => (seen.has(f.name) ? false : seen.add(f.name)))
}

// Walks up the generalization chain and across realizations, collecting
// operations the class is obliged to implement but has not declared itself.
function inheritedAbstract(node, relations, classes) {
  const map = byId(classes)
  const declared = new Set(node.methods.map(signatureOf))
  const found = new Map()
  const seen = new Set([node.id])

  const visit = (current) => {
    if (!current || seen.has(current.id)) return
    seen.add(current.id)
    const supplies = current.kind === 'interface'
      ? current.methods
      : current.methods.filter((m) => m.isAbstract)
    supplies.forEach((m) => {
      const sig = signatureOf(m)
      if (!declared.has(sig) && !found.has(sig)) found.set(sig, m)
    })
    outgoing(relations, current.id, ['generalization', 'realization'])
      .forEach((r) => visit(map.get(r.targetId)))
  }

  outgoing(relations, node.id, ['generalization', 'realization'])
    .forEach((r) => visit(map.get(r.targetId)))

  return [...found.values()]
}

/* ------------------------------------------------------------- rendering */

const params = (m) => m.parameters.map((p) => p.type + ' ' + p.name).join(', ')

function methodBody(returnType, note) {
  const lines = [PAD + '// TODO: ' + note]
  const value = defaultValue(returnType)
  if (value !== null) lines.push(PAD + 'return ' + value + ';')
  return lines
}

function renderEnum(node, ctx) {
  const out = []
  if (ctx.options.javadoc) {
    out.push('/**', ' * ' + node.name + ' - enumeration generated from the class diagram.', ' */')
  }
  out.push('public enum ' + node.name + ' {')
  const literals = node.literals.length ? node.literals : ['UNDEFINED']
  out.push(INDENT + literals.join(',\n' + INDENT))
  out.push('}')
  return out.join('\n')
}

function renderInterface(node, ctx) {
  const { relations, classes, options } = ctx
  const supers = outgoing(relations, node.id, ['generalization'])
    .map((r) => byId(classes).get(r.targetId))
    .filter(Boolean)
    .map((c) => c.name)

  const out = []
  if (options.javadoc) {
    out.push('/**', ' * ' + node.name + ' - contract generated from the class diagram.', ' */')
  }
  out.push('public interface ' + node.name +
    (supers.length ? ' extends ' + supers.join(', ') : '') + ' {')

  const body = []
  node.attributes.forEach((a) => {
    body.push(INDENT + a.type + ' ' + a.name + ' = ' + constantInitialiser(a.type) + ';')
  })
  if (node.attributes.length && node.methods.length) body.push('')
  node.methods.forEach((m, i) => {
    if (i) body.push('')
    body.push(INDENT + m.returnType + ' ' + m.name + '(' + params(m) + ');')
  })
  if (!body.length) body.push(INDENT + '// no operations declared on the diagram yet')

  out.push(body.join('\n'), '}')
  return out.join('\n')
}

function renderClass(node, ctx) {
  const { relations, classes, options } = ctx
  const parent = parentOf(node, relations, classes)
  const implemented = interfacesOf(node, relations, classes)
  const fields = relationFields(node, relations, classes)
  const dependencies = dependenciesOf(node, relations, classes)
  const isAbstract = node.kind === 'abstract'

  const out = []

  if (options.javadoc) {
    out.push('/**', ' * ' + node.name + ' - generated from the UML class diagram.')
    if (parent) out.push(' * Specialises {@link ' + parent.name + '}.')
    fields.forEach((f) => {
      if (f.kind === 'composition') {
        out.push(' * Owns its ' + f.name + ' (composition, ' + f.multiplicity + ').')
      }
      if (f.kind === 'aggregation') {
        out.push(' * Holds a reference to ' + f.name + ' (aggregation, ' + f.multiplicity + ').')
      }
    })
    dependencies.forEach((d) => {
      out.push(' * Uses {@link ' + d.name + '} transiently (dependency).')
    })
    out.push(' */')
  }

  const header = [
    'public',
    isAbstract ? 'abstract' : null,
    'class',
    node.name,
    parent ? 'extends ' + parent.name : null,
    implemented.length ? 'implements ' + implemented.map((c) => c.name).join(', ') : null
  ].filter(Boolean).join(' ')
  out.push(header + ' {')

  const body = []

  /* ---- attributes ---- */
  node.attributes.forEach((a) => {
    const parts = [
      visibilityKeyword(a.visibility),
      a.isStatic ? 'static' : null,
      a.isFinal ? 'final' : null,
      a.type,
      a.name
    ].filter(Boolean)
    const constant = a.isStatic && a.isFinal
    body.push(INDENT + parts.join(' ') +
      (constant ? ' = ' + constantInitialiser(a.type) : '') + ';')
  })

  /* ---- fields that come from relationships ---- */
  if (fields.length) {
    if (node.attributes.length) body.push('')
    fields.forEach((f) => {
      body.push(INDENT + '// ' + f.kind + ': ' + node.name + ' -> ' +
        f.elementType + ' [' + f.multiplicity + ']')
      body.push(INDENT + 'private ' + f.type + ' ' + f.name +
        (f.many ? ' = new ArrayList<>()' : '') + ';')
    })
  }

  /* ---- constructors ---- */
  const own = ownCtorFields(node, relations, classes)
  const inherited = dedupeByName(ancestorCtorFields(node, relations, classes))
  const ownNames = new Set(own.map((f) => f.name))
  // Anything the parent already takes is passed up, never re-declared here.
  const fromParent = inherited.filter((f) => !ownNames.has(f.name))
  const finals = own.filter((f) => f.isFinal)

  if (options.generateConstructors) {
    // Every class keeps a no-argument constructor so a subclass can rely on an
    // implicit super(). A final field still has to be definitely assigned, so
    // it gets a default here rather than blocking the constructor.
    body.push('', INDENT + 'public ' + node.name + '() {')
    finals.forEach((f) => body.push(PAD + 'this.' + f.name + ' = ' + constantInitialiser(f.type) + ';'))
    body.push(INDENT + '}')

    const all = [...fromParent, ...own]
    if (all.length) {
      body.push('', INDENT + 'public ' + node.name + '(' +
        all.map((f) => f.type + ' ' + f.name).join(', ') + ') {')
      if (parent && inherited.length) {
        body.push(PAD + 'super(' + inherited.map((f) => f.name).join(', ') + ');')
      }
      own.forEach((f) => body.push(PAD + 'this.' + f.name + ' = ' + f.name + ';'))
      body.push(INDENT + '}')
    }
  }

  /* ---- accessors ---- */
  if (options.generateAccessors) {
    const accessible = [
      ...node.attributes
        .filter((a) => !(a.isStatic && a.isFinal))
        .map((a) => ({ name: a.name, type: a.type, isFinal: a.isFinal })),
      ...fields.map((f) => ({ name: f.name, type: f.type, isFinal: false }))
    ]
    accessible.forEach((f) => {
      const prefix = f.type === 'boolean' ? 'is' : 'get'
      body.push('',
        INDENT + 'public ' + f.type + ' ' + prefix + upperFirst(f.name) + '() {',
        PAD + 'return ' + f.name + ';',
        INDENT + '}')
      if (!f.isFinal) {
        body.push('',
          INDENT + 'public void set' + upperFirst(f.name) + '(' + f.type + ' ' + f.name + ') {',
          PAD + 'this.' + f.name + ' = ' + f.name + ';',
          INDENT + '}')
      }
    })

    // Collections get add/remove so callers are not handed the live list.
    fields.filter((f) => f.many).forEach((f) => {
      const one = upperFirst(f.elementType)
      const arg = lowerFirst(f.elementType)
      body.push('',
        INDENT + 'public void add' + one + '(' + f.elementType + ' ' + arg + ') {',
        PAD + 'this.' + f.name + '.add(' + arg + ');',
        INDENT + '}')
      body.push('',
        INDENT + 'public void remove' + one + '(' + f.elementType + ' ' + arg + ') {',
        PAD + 'this.' + f.name + '.remove(' + arg + ');',
        INDENT + '}')
    })
  }

  /* ---- declared operations ---- */
  node.methods.forEach((m) => {
    const parts = [
      visibilityKeyword(m.visibility),
      m.isStatic ? 'static' : null,
      m.isAbstract ? 'abstract' : null,
      m.returnType,
      m.name + '(' + params(m) + ')'
    ].filter(Boolean).join(' ')
    body.push('')
    if (m.isAbstract) {
      body.push(INDENT + parts + ';')
    } else {
      body.push(INDENT + parts + ' {',
        ...methodBody(m.returnType, 'implement operation'),
        INDENT + '}')
    }
  })

  /* ---- operations inherited but not yet declared ---- */
  if (options.stubInherited && !isAbstract) {
    inheritedAbstract(node, relations, classes).forEach((m) => {
      body.push('', INDENT + '@Override',
        INDENT + 'public ' + m.returnType + ' ' + m.name + '(' + params(m) + ') {',
        ...methodBody(m.returnType, 'inherited operation ' + m.name),
        INDENT + '}')
    })
  }

  /* ---- toString ---- */
  if (options.generateToString) {
    const shown = node.attributes.filter((a) => !a.isStatic)
    const q = '"'
    const pieces = shown.length
      ? shown.map((a, i) => q + (i ? ', ' : '') + a.name + '=' + q + ' + ' + a.name).join(' + ')
      : q + q
    body.push('', INDENT + '@Override',
      INDENT + 'public String toString() {',
      PAD + 'return ' + q + node.name + '{' + q + ' + ' + pieces + ' + ' + q + '}' + q + ';',
      INDENT + '}')
  }

  if (!body.length) body.push(INDENT + '// nothing declared on the diagram yet')

  out.push(body.join('\n'), '}')
  return out.join('\n')
}

/* ------------------------------------------------------------- entry point */

function importsFor(node, ctx) {
  const used = new Set()
  const add = (t) => typeTokens(t).forEach((tok) => used.add(tok))

  node.attributes.forEach((a) => add(a.type))
  node.methods.forEach((m) => {
    add(m.returnType)
    m.parameters.forEach((p) => add(p.type))
  })
  relationFields(node, ctx.relations, ctx.classes).forEach((f) => {
    add(f.type)
    if (f.many) { used.add('List'); used.add('ArrayList') }
  })
  if (ctx.options.stubInherited && node.kind === 'class') {
    inheritedAbstract(node, ctx.relations, ctx.classes).forEach((m) => {
      add(m.returnType)
      m.parameters.forEach((p) => add(p.type))
    })
  }

  return [...used]
    .filter((t) => IMPORT_MAP[t] && !isPrimitive(t))
    .map((t) => IMPORT_MAP[t])
    .sort()
}

export function generateJava(diagram, options = DEFAULT_OPTIONS) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const ctx = { ...diagram, options: opts }

  return diagram.classes.map((node) => {
    const head = []
    if (diagram.packageName && diagram.packageName.trim()) {
      head.push('package ' + diagram.packageName.trim() + ';', '')
    }
    const imports = node.kind === 'enum' ? [] : importsFor(node, ctx)
    if (imports.length) head.push(...imports.map((i) => 'import ' + i + ';'), '')

    const body =
      node.kind === 'enum' ? renderEnum(node, ctx)
        : node.kind === 'interface' ? renderInterface(node, ctx)
          : renderClass(node, ctx)

    return {
      id: node.id,
      className: node.name,
      fileName: node.name + '.java',
      code: head.join('\n') + body + '\n'
    }
  })
}

// Checks the diagram against the rules Java will enforce anyway, so the user
// hears about a problem while looking at the picture rather than at a compiler
// error. Errors block nothing — the code is still generated — but they are
// listed under the canvas.

import { isValidIdentifier, isKeyword, lowerFirst, pluralise } from './naming.js'
import { FIELD_RELATIONS, isCollection } from '../model/uml.js'

const error = (message, classId) => ({ level: 'error', message, classId })
const warn = (message, classId) => ({ level: 'warning', message, classId })

// Follows generalization links upward looking for a loop.
function hasInheritanceCycle(startId, relations) {
  const seen = new Set()
  let current = startId
  while (current) {
    if (seen.has(current)) return true
    seen.add(current)
    const up = relations.find(
      (r) => r.kind === 'generalization' && r.sourceId === current
    )
    current = up ? up.targetId : null
  }
  return false
}

export function validateDiagram(diagram) {
  const { classes, relations } = diagram
  const issues = []
  const byId = new Map(classes.map((c) => [c.id, c]))

  /* ---- package ---- */
  const pkg = (diagram.packageName || '').trim()
  if (pkg && !/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)*$/i.test(pkg)) {
    issues.push(error(`"${pkg}" is not a valid package name.`))
  }

  /* ---- class level ---- */
  const nameCount = new Map()
  classes.forEach((c) => nameCount.set(c.name, (nameCount.get(c.name) || 0) + 1))

  classes.forEach((c) => {
    if (!isValidIdentifier(c.name)) {
      issues.push(error(
        `"${c.name || '(unnamed)'}" is not a usable Java type name${isKeyword(c.name) ? ' — it is a reserved word' : ''}.`,
        c.id
      ))
    }
    if (nameCount.get(c.name) > 1) {
      issues.push(error(`More than one class is called ${c.name}.`, c.id))
    }

    if (c.kind === 'enum') {
      if (!c.literals.length) {
        issues.push(warn(`Enumeration ${c.name} has no constants.`, c.id))
      }
      c.literals.forEach((l) => {
        if (!isValidIdentifier(l)) {
          issues.push(error(`${c.name}: "${l}" is not a usable constant name.`, c.id))
        }
      })
      return
    }

    const attrNames = new Set()
    c.attributes.forEach((a) => {
      if (!isValidIdentifier(a.name)) {
        issues.push(error(`${c.name}: "${a.name || '(unnamed)'}" is not a usable field name.`, c.id))
      }
      if (attrNames.has(a.name)) {
        issues.push(error(`${c.name}: the field ${a.name} is declared twice.`, c.id))
      }
      attrNames.add(a.name)
      if (!a.type.trim()) {
        issues.push(error(`${c.name}.${a.name} has no type.`, c.id))
      }
    })

    const signatures = new Set()
    c.methods.forEach((m) => {
      if (!isValidIdentifier(m.name)) {
        issues.push(error(`${c.name}: "${m.name || '(unnamed)'}" is not a usable method name.`, c.id))
      }
      const sig = `${m.name}(${m.parameters.map((p) => p.type).join(',')})`
      if (signatures.has(sig)) {
        issues.push(error(`${c.name}: ${sig} is declared twice.`, c.id))
      }
      signatures.add(sig)
      m.parameters.forEach((p) => {
        if (!isValidIdentifier(p.name)) {
          issues.push(error(`${c.name}.${m.name}: "${p.name}" is not a usable parameter name.`, c.id))
        }
      })
      if (m.isAbstract && c.kind === 'class') {
        issues.push(error(
          `${c.name}.${m.name} is abstract, so ${c.name} must be an abstract class or an interface.`,
          c.id
        ))
      }
    })

    // A field arriving from a relationship must not clash with a declared one.
    relations
      .filter((r) => r.sourceId === c.id && FIELD_RELATIONS.includes(r.kind))
      .forEach((r) => {
        const target = byId.get(r.targetId)
        if (!target) return
        const field = r.targetRole || (isCollection(r.multiplicity)
          ? pluralise(lowerFirst(target.name))
          : lowerFirst(target.name))
        if (attrNames.has(field)) {
          issues.push(error(
            `${c.name}: the ${r.kind} to ${target.name} would generate a field called ${field}, which already exists. Give the relationship a role name.`,
            c.id
          ))
        }
      })
  })

  /* ---- relationship level ---- */
  relations.forEach((r) => {
    const source = byId.get(r.sourceId)
    const target = byId.get(r.targetId)
    if (!source || !target) return

    if (r.kind === 'generalization') {
      const supers = relations.filter(
        (x) => x.kind === 'generalization' && x.sourceId === r.sourceId
      )
      if (supers.length > 1 && source.kind !== 'interface') {
        issues.push(error(
          `${source.name} generalises ${supers.length} classes. Java allows a single superclass — use realization for the rest.`,
          source.id
        ))
      }
      if (source.kind !== 'interface' && target.kind === 'interface') {
        issues.push(warn(
          `${source.name} generalises the interface ${target.name}. A class implements an interface, so this should be a realization.`,
          source.id
        ))
      }
      if (target.kind === 'enum') {
        issues.push(error(`${source.name} cannot extend the enumeration ${target.name}.`, source.id))
      }
      if (hasInheritanceCycle(source.id, relations)) {
        issues.push(error(`${source.name} sits in an inheritance cycle.`, source.id))
      }
    }

    if (r.kind === 'realization' && target.kind !== 'interface') {
      issues.push(error(
        `${source.name} realizes ${target.name}, but ${target.name} is not an interface.`,
        source.id
      ))
    }

    if (FIELD_RELATIONS.includes(r.kind) && source.kind === 'interface') {
      issues.push(warn(
        `${source.name} is an interface, so the ${r.kind} to ${target.name} becomes a constant rather than a field.`,
        source.id
      ))
    }

    if (FIELD_RELATIONS.includes(r.kind) && source.kind === 'enum') {
      issues.push(warn(
        `Relationships leaving the enumeration ${source.name} are not generated.`,
        source.id
      ))
    }
  })

  return issues
}

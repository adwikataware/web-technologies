// Small naming helpers shared by the generator.

export const upperFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
export const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)

// Turns a class name into a plausible collection field name: Member -> members,
// Address -> addresses, Category -> categories.
export function pluralise(word) {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`
  return `${word}s`
}

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while'
])

export const isKeyword = (word) => JAVA_KEYWORDS.has(word)

export const isValidIdentifier = (word) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(word || '') && !isKeyword(word)

const PRIMITIVES = new Set([
  'int', 'long', 'short', 'byte', 'double', 'float', 'boolean', 'char', 'void'
])

export const isPrimitive = (type) => PRIMITIVES.has(type)

// What a stubbed method should hand back so the generated file compiles.
export function defaultValue(type) {
  if (type === 'void') return null
  if (type === 'boolean') return 'false'
  if (type === 'char') return "'\0'"
  if (type === 'double' || type === 'float') return '0.0'
  if (PRIMITIVES.has(type)) return '0'
  if (type === 'String') return 'null'
  return 'null'
}

// Static final fields must be initialised where they are declared.
export function constantInitialiser(type) {
  if (type === 'boolean') return 'false'
  if (type === 'char') return "' '"
  if (type === 'double' || type === 'float') return '0.0'
  if (PRIMITIVES.has(type)) return '0'
  if (type === 'String') return '""'
  return 'null'
}

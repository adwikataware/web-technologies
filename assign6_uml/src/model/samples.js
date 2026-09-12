// A worked example the user can load with one click: a small library system
// that exercises every relationship the generator supports.

import {
  makeClass, makeAttribute, makeMethod, makeParameter, makeRelation
} from './uml.js'

export function librarySample() {
  const borrowable = makeClass({
    name: 'Borrowable', kind: 'interface', x: 40, y: 60,
    methods: [
      makeMethod({
        name: 'issueTo', returnType: 'Loan',
        parameters: [makeParameter({ name: 'member', type: 'Member' })]
      }),
      makeMethod({ name: 'returnItem', returnType: 'void' })
    ]
  })

  const item = makeClass({
    name: 'LibraryItem', kind: 'abstract', x: 360, y: 40,
    attributes: [
      makeAttribute({ name: 'itemId', type: 'String', isFinal: true }),
      makeAttribute({ name: 'title', type: 'String' }),
      makeAttribute({ name: 'available', type: 'boolean' })
    ],
    methods: [
      makeMethod({ name: 'displayInfo', returnType: 'void', isAbstract: true }),
      makeMethod({ name: 'getLoanPeriodDays', returnType: 'int', isAbstract: true })
    ]
  })

  const book = makeClass({
    name: 'Book', kind: 'class', x: 230, y: 330,
    attributes: [
      makeAttribute({ name: 'author', type: 'String' }),
      makeAttribute({ name: 'isbn', type: 'String' }),
      makeAttribute({ name: 'pages', type: 'int' })
    ],
    methods: [makeMethod({ name: 'displayInfo', returnType: 'void' })]
  })

  const dvd = makeClass({
    name: 'Dvd', kind: 'class', x: 540, y: 330,
    attributes: [
      makeAttribute({ name: 'runtimeMinutes', type: 'int' }),
      makeAttribute({ name: 'region', type: 'String' })
    ],
    methods: [makeMethod({ name: 'displayInfo', returnType: 'void' })]
  })

  const library = makeClass({
    name: 'Library', kind: 'class', x: 830, y: 40,
    attributes: [
      makeAttribute({ name: 'branchName', type: 'String' }),
      makeAttribute({ name: 'MAX_LOANS', type: 'int', visibility: 'public', isStatic: true, isFinal: true })
    ],
    methods: [
      makeMethod({
        name: 'register', returnType: 'void',
        parameters: [makeParameter({ name: 'member', type: 'Member' })]
      }),
      makeMethod({
        name: 'findByTitle', returnType: 'LibraryItem',
        parameters: [makeParameter({ name: 'title', type: 'String' })]
      })
    ]
  })

  const member = makeClass({
    name: 'Member', kind: 'class', x: 830, y: 330,
    attributes: [
      makeAttribute({ name: 'memberId', type: 'String' }),
      makeAttribute({ name: 'fullName', type: 'String' }),
      makeAttribute({ name: 'joinedOn', type: 'LocalDate' })
    ],
    methods: [makeMethod({ name: 'canBorrow', returnType: 'boolean' })]
  })

  const tier = makeClass({
    name: 'MembershipTier', kind: 'enum', x: 1130, y: 330,
    literals: ['BASIC', 'PREMIUM', 'STAFF']
  })

  const loan = makeClass({
    name: 'Loan', kind: 'class', x: 470, y: 610,
    attributes: [
      makeAttribute({ name: 'issuedOn', type: 'LocalDate' }),
      makeAttribute({ name: 'dueOn', type: 'LocalDate' })
    ],
    methods: [
      makeMethod({ name: 'isOverdue', returnType: 'boolean' }),
      makeMethod({ name: 'calculateFine', returnType: 'double' })
    ]
  })

  const classes = [borrowable, item, book, dvd, library, member, tier, loan]

  const relations = [
    makeRelation(book.id, item.id, { kind: 'generalization' }),
    makeRelation(dvd.id, item.id, { kind: 'generalization' }),
    makeRelation(book.id, borrowable.id, { kind: 'realization' }),
    makeRelation(dvd.id, borrowable.id, { kind: 'realization' }),
    makeRelation(library.id, item.id, {
      kind: 'composition', targetRole: 'catalogue', multiplicity: '*'
    }),
    makeRelation(library.id, member.id, {
      kind: 'aggregation', targetRole: 'members', multiplicity: '*'
    }),
    makeRelation(member.id, tier.id, { kind: 'association', targetRole: 'tier' }),
    makeRelation(member.id, loan.id, {
      kind: 'aggregation', targetRole: 'activeLoans', multiplicity: '*'
    }),
    makeRelation(loan.id, item.id, { kind: 'association', targetRole: 'item' }),
    makeRelation(loan.id, member.id, { kind: 'association', targetRole: 'borrower' }),
    makeRelation(library.id, loan.id, { kind: 'dependency' })
  ]

  return { packageName: 'com.vit.library', classes, relations }
}

export function emptyDiagram() {
  return { packageName: 'com.vit.app', classes: [], relations: [] }
}

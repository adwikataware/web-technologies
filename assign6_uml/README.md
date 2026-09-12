# Assignment 6 — UML Class Diagram Generator using **React**

> **Technology: a React (Vite) single page app, no backend.**
> Draw a class diagram on a canvas and the matching Java source is written as
> you draw it — one compilation unit per class, with the relationships turned
> into `extends`, `implements` and fields.

The point of the assignment is the second half: a diagram is not a picture here,
it is the *input to a code generator*. Every box, every line and every
multiplicity on the canvas changes the Java in the right-hand pane on the next
keystroke.

## Running it

```bash
cd assign6_uml
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production bundle into dist/
npm run preview      # serve the built bundle
```

There is nothing else to install — no server, no database. The diagram is kept
in `localStorage`, so a reload brings back what you were working on.

## What you can draw

| Element | Notation on the canvas | Becomes |
| ------- | ---------------------- | ------- |
| Class | plain box | `public class X` |
| Abstract class | `<<abstract>>`, italic name | `public abstract class X` |
| Interface | `<<interface>>` | `public interface X` |
| Enumeration | `<<enumeration>>` | `public enum X` |
| Attribute | `- name: Type` | field, with the visibility keyword |
| Operation | `+ name(arg: Type): Ret` | method, stubbed with a `TODO` |
| `static` member | underlined | `static` |
| `abstract` operation | italic | `abstract`, no body |

Visibility uses the standard UML markers — `+` public, `-` private,
`#` protected, `~` package — and each maps to the Java keyword.

## The six relationships

This is where the generator earns its keep. The same two boxes produce very
different code depending on which line joins them.

| Relationship | Drawn as | Generated as |
| ------------ | -------- | ------------ |
| **Generalization** | solid line, hollow triangle | `extends Parent` |
| **Realization** | dashed line, hollow triangle | `implements Contract` |
| **Composition** | solid line, filled diamond | field the owner **creates** — not a constructor argument |
| **Aggregation** | solid line, hollow diamond | field the owner is **handed** — a constructor argument |
| **Association** | solid line, open arrow | plain reference field |
| **Dependency** | dashed line, open arrow | no field; recorded in the Javadoc |

Composition and aggregation differ in the generated code exactly as they differ
in UML. A composed part dies with its owner, so the owner builds it and it never
appears in the constructor signature. An aggregated part outlives its owner, so
it is injected.

### Multiplicity

Any end marked `*`, `1..*` or `0..*` generates a collection instead of a single
reference, along with the imports and a pair of add/remove helpers:

```java
// composition: Library -> LibraryItem [*]
private List<LibraryItem> catalogue = new ArrayList<>();

public void addLibraryItem(LibraryItem libraryItem) {
    this.catalogue.add(libraryItem);
}
```

The **role name** on a relationship becomes the field name. Left blank, the
generator derives one from the target class — `Member` → `member`, and for a
many-valued end it pluralises properly (`Category` → `categories`,
`Address` → `addresses`).

## Two things the generator does that a naive one does not

**It chains constructors through the inheritance tree.** A parent with a `final`
field has no usable no-argument constructor, so a generated child that ignored
it would not compile. Each class therefore takes its ancestors' constructor
arguments and passes them up:

```java
public Book(String itemId, String title, boolean available,
            String author, String isbn, int pages) {
    super(itemId, title, available);
    this.author = author;
    this.isbn = isbn;
    this.pages = pages;
}
```

**It stubs the operations a class inherits but has not declared.** `Book`
specialises the abstract `LibraryItem` and realizes `Borrowable`. It declares
`displayInfo()` itself; the other three obligations are found by walking up the
generalization and realization links and are emitted with `@Override`:

```java
@Override
public Loan issueTo(Member member) {
    // TODO: inherited operation issueTo
    return null;
}
```

Because of these two, the output is not a sketch — it compiles.

> Verified: the eight files generated from the bundled example were compiled
> with `javac 17 -Xlint:all`. No errors, no warnings.

## Generator switches

Five checkboxes above the code decide how much is written: constructors,
getters and setters, `toString()`, the inherited-operation stubs, and the
Javadoc header. Turning them all off gives a bare skeleton; the default gives a
class you could drop into a project.

## Problems panel

Under the canvas sits a live report of everything Java would reject, so you find
out while looking at the diagram rather than at a compiler:

- two classes with the same name, or a name that is a reserved word
- a second generalization out of one class (Java has single inheritance)
- a realization pointing at something that is not an interface
- an inheritance cycle
- an `abstract` operation on a concrete class
- a relationship whose generated field name collides with a declared attribute
- duplicate fields, duplicate method signatures, invalid identifiers

Clicking a problem selects the class it belongs to.

## Getting the code out

- **Copy** the open file to the clipboard
- **Download file** for a single `.java`
- **Download all as .zip** — every class, nested in the package's folder
  structure (`com/vit/library/Book.java`). The ZIP is assembled in the browser
  by `src/codegen/zip.js`, a small stored-entry writer, so the app still has no
  dependency beyond React.
- **Export / Import JSON** round-trips the whole diagram as a file

## Working on the canvas

| Action | How |
| ------ | --- |
| Add a class | **+ Class**, or double-click empty canvas |
| Draw a relationship | pick one in the toolbar, click source, click target |
| Cancel a relationship | `Esc` |
| Move a class | drag it |
| Pan / zoom | drag the background, scroll wheel, or **Fit** |
| Delete | select, then `Delete` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` |

Dragging pushes a single history entry when it starts rather than one per
mouse-move, so undo steps back to where the box was before the drag.

## Layout of the source

```
src/
  model/
    uml.js              the UML vocabulary, factories, box geometry
    samples.js          the worked library example
  codegen/
    javaGenerator.js    diagram -> Java, the core of the assignment
    naming.js           identifiers, keywords, default values
    validate.js         the problems panel's rules
    zip.js              dependency-free ZIP writer
  state/
    diagramStore.js     reducer + undo/redo + autosave
  components/
    Toolbar.jsx         package name, add tools, relationship tools, JSON
    Canvas.jsx          pan, zoom, drag, the two-click link gesture
    ClassNode.jsx       one class box, drawn in SVG
    RelationLayer.jsx   edge geometry and the UML arrowheads
    Inspector.jsx       properties of the selected class or relationship
    CodePanel.jsx       generated files, switches, copy and download
  App.jsx               wiring; code and problems are derived from the diagram
```

The diagram is the single source of truth. `generateJava(diagram)` and
`validateDiagram(diagram)` are pure functions of it, which is why the code pane
and the problems list never go stale.

## The bundled example

**Load example** puts up a small library system that uses every relationship at
once: a `Borrowable` interface, an abstract `LibraryItem` specialised by `Book`
and `Dvd`, a `Library` that composes its catalogue and aggregates its members, a
`Loan` associated with both, a `MembershipTier` enumeration, and a dependency
from `Library` to `Loan`.

## Screenshots

| | |
| --- | --- |
| `01-editor.png` | the editor with the example loaded |
| `02-class-properties.png` | editing a class, its attributes and operations |
| `03-relationship-inspector.png` | role name and multiplicity on a composition |
| `04-drawing-relationship.png` | the two-click gesture, mid-draw |
| `05-generated-book.png` | `Book.java` — `extends`, `implements`, `super(...)` |
| `06-generated-overrides.png` | the inherited operations, stubbed |
| `07-generated-library.png` | composition and aggregation as `List<>` fields |
| `08-validation.png` | the problems panel catching a duplicate class name |
| `09-mobile-canvas.png` | canvas at 390 px |
| `10-mobile-code.png` | generated code at 390 px |

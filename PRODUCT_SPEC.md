# Product Spec — WEBNEO

## Product promise

A browser/tablet edition that preserves the actual NEO writing experience and feature set as closely as browser security and tablet interaction allow, then adds optional creative tools without making the editor noisier.

## Priority order

1. **NEO parity** — bookshelf, drafting behavior, outlining, goals, covers, import/export, backups, book assembly, shortcuts, languages, and the same low-distraction feel.
2. **Tablet-native smoothness** — software keyboard, touch selection, gestures, recovery, responsive layout, and large-manuscript performance.
3. **WEBNEO extras** — Idea Forge, Language Lens, and optional AI assistance.

When desktop NEO depends on OS/Electron capabilities that a browser cannot reproduce exactly, WEBNEO should provide the closest safe browser-native equivalent and document the difference in `PARITY.md`.

## Core experiences

### NEO writing chair
Bookshelves rather than file lists; book-like covers; low-chrome manuscript pages; chapter/scene flow; smart punctuation; deliberate spellcheck; Darlings; placeholders; notes/outlining; goals/sprints; progress chart; import/export; recovery and ownership of files.

### Idea Forge
An offline prompt generator already implemented. It remains optional and should never dominate the writing screen.

### Language Lens
Deferred until parity is achieved. It should go beyond a thesaurus into phrases, cadence, sensory wording, metaphor directions, and register changes.

### AI Co-writer
Deferred until parity is achieved. Provider-neutral and explicit accept/reject/insert only; never silently edits the manuscript.

## AI architecture

The core application must never require AI. Any AI feature must keep API credentials out of public browser code and use an explicit provider adapter / secure server-side boundary.

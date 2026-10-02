# Project Rules

1. **Parity first.** Before adding new WEBNEO-only systems, match the currently documented upstream NEO feature set or record a deliberate browser-native equivalent in `PARITY.md`.
2. The core editor must work without AI, an account, or a network connection after the PWA has loaded.
3. Writing safety outranks clever features: autosave, recoverability, backup/export paths, and migration safety come first.
4. Tablet input and on-screen keyboard behavior are first-class, not desktop afterthoughts.
5. Preserve NEO's low-distraction philosophy. Controls should recede during writing while remaining discoverable and touch-accessible.
6. Browser security/platform differences may change implementation details, but not the user's core capability unless the limitation is documented.
7. Creative-assistance features are optional and non-invasive. They may propose text but never silently overwrite manuscript text.
8. AI-generated text must use an explicit accept/reject/insert workflow.
9. Preserve attribution and license requirements for NEO and all third-party code/assets.
10. Build and review one coherent parity slice at a time, with a browser-testable checkpoint and updated `CURRENT_STATE.md` / `PARITY.md`.

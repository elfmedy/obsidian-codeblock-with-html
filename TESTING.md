# Verification

## Automated checks

Run `npm ci` and `npm run check` with Node.js 22.13+ or 24.

Ten automated tests cover:

- Chinese locales and English fallback.
- Multiple fragments and UTF-16 offsets (including emoji).
- Preserving comments, indentation, blank lines and CRLF when removing markers.
- Unclosed/empty delimiters and literal escapes.
- Multiline selection wrapping without toggle behavior.
- Fence boundaries, tilde/long fences and excluded special processors.
- Markers split across syntax token nodes, safe literal HTML rendering.
- Reapplying emphasis after asynchronous host syntax highlighting without parsing escaped literal markers twice.

TypeScript, production bundling and release asset/version validation also run. ESLint uses the official recommended Obsidian rules; the portable DOM renderer retains two non-blocking `prefer-create-el` suggestions because it intentionally uses standard, owner-document DOM constructors for standalone DOM tests. There are no lint errors.

## Desktop Sandbox verification (2026-10-06)

Tested in the existing **Obsidian Sandbox**, Obsidian 1.14.4 on Windows, using a dedicated `Code Emphasis Sandbox.md` note. Only the new plugin and this test note were added; no personal vault was used.

Verified in the actual application:

- Reading view strips valid markers, preserves syntax colors, and emphasizes code/comments identically.
- Host asynchronous syntax highlighting does not erase emphasis.
- Literal escaped markers and unmatched delimiters remain visible.
- The native Copy code button calls the clipboard with clean text, retaining comments and whitespace. The clipboard writer was temporarily intercepted during this test; the user's system clipboard was not replaced.
- A selected fragment is wrapped exactly; one Undo restores it.
- Multiline wrapping skips blank lines and one Undo restores the original text.
- Empty selections, selections outside code and selections crossing fences are rejected without edits.
- Source mode has literal markers and no added decorations; Live Preview keeps markers editable and emphasizes contents.
- The Chinese command and settings follow the app language. English/fallback translations are covered by the automated test.
- The color control updates the shared background color, persists it, and restores the default; preview and searchable setting definitions exist.
- Disabling the plugin restores source delimiters and clears its color variable; enabling/rerendering restores emphasis.

Visual Reading view was inspected through a screenshot. CLI screenshots of the settings window returned the underlying editor frame, so settings were verified through their live DOM and color controls instead.

Use short individual `obsidian ... eval code=...` calls for native testing: this installed CLI rejected the long combined regression command with an IPC JSON error. That runner error was separate from the plugin checks above.

## Remaining coverage

- No physical mobile-device test or community-directory review has been performed.
- Minimum supported app version is 1.13.0; native testing used 1.14.4.
- Editor commands and Live Preview currently support top-level fences, not fences nested inside lists or blockquotes; see README.
- Third-party code processors retain ownership; integrations beyond the documented exclusions are not certified.

## Release verification

The release workflow uses the committed dependency lockfile, runs checks, verifies the numeric tag matches the manifest, generates build provenance, and attaches `main.js`, `manifest.json`, and `styles.css`. Publishing source is distinct from creating a release or submitting a community-directory entry.

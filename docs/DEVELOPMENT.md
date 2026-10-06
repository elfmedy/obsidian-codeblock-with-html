# Development

Requires Node.js 22.13+ or 24; Python 3.10+ for migration tests.

```sh
npm ci
npm run check
python -m unittest discover -s tests -p test_migration.py
npm run dev
```

Source lives in `src/`; `main.js` is an ignored build artifact. Install all three build files into a test vault at `.obsidian/plugins/code-emphasis/`.

Live Preview uses CodeMirror decorations: valid delimiters are hidden except when the cursor or a selection intersects that fragment. Selection changes do not modify the document or add history entries. Source mode retains all delimiters. The editor currently supports top-level backtick/tilde fences, not fences nested in lists or blockquotes. Reading view processes ordinary rendered code blocks, retaining syntax token elements and reapplying emphasis after asynchronous syntax highlighting.

## Release

Update `package.json`, `manifest.json`, the lockfile and `versions.json`. Run checks, commit, then push a numeric tag matching the manifest (no `v` prefix). The release workflow builds, validates assets, generates provenance and attaches `main.js`, `manifest.json`, and `styles.css`.

Repository: https://github.com/elfmedy/code-emphasis

See [verification notes](../TESTING.md) and the [one-off migration tool](MIGRATION.md).

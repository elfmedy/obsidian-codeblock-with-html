# Migrating from 1.x / 从旧版迁移

Back up your notes before converting. Disable the old `obsidian-codeblock-with-html` plugin and install Code Emphasis. The new plugin ID is `code-emphasis`.

将 `<font color="#ff0000">内容</font>` 改为 `^^内容^^`，删除代码围栏中的 `with-html`。新版不会自动修改文章。

For a one-time bulk conversion, [`scripts/migrate-with-html.py`](../scripts/migrate-with-html.py) (Python 3.10+) provides an explicit migration outside the plugin. It handles ordinary and quoted/callout fences, keeps code/prose outside target blocks intact, preserves UTF-8 and line endings, and removes only red font tags and the `with-html` fence label. It flattens nested red ranges and recognizes a redundant opener followed by a final closing tag; other malformed spans abort for review.

```sh
# Dry-run: writes original backups, a diff and a report; does not change notes.
python scripts/migrate-with-html.py /path/to/vault --backup-dir /outside/vault/preview
# Apply: use a separate new backup directory. Save open notes first.
python scripts/migrate-with-html.py /path/to/vault --backup-dir /outside/vault/applied --apply
python -m unittest discover -s tests -p test_migration.py
```

The script refuses to overwrite an existing backup directory and checks that files have not changed since planning. It does not guess a programming language for previously unlabelled blocks. Inspect `report.json` and `changes.diff` in the backup directory. To restore, use the originals under `articles/`, first checking that no newer edits would be overwritten. Backups, vault contents and migration reports must remain private and outside this repository.


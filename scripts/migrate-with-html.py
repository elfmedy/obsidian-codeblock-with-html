"""One-off, byte-preserving migration. Dry-run by default; backups stay outside the vault."""
import argparse
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})([^\r\n]*)")
TAG = re.compile(r"<font\b[^>]*>|</font\s*>", re.I)
OPEN = re.compile(r'''<font\s+color\s*=\s*(["'])#ff0000\1\s*>''', re.I)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def convert_line(line):
    """Flatten same-color spans. Repair a redundant nested opener only at line end."""
    tokens = list(TAG.finditer(line))
    if not tokens:
        if re.search(r'</?font\b', line, re.I):
            raise ValueError('Malformed font tag')
        return line, 0, False
    depth = 0
    parts = []
    cursor = 0
    opened = closed = 0
    for token in tokens:
        parts.append(line[cursor:token.start()])
        tag = token.group()
        if tag.lower().startswith('</'):
            if depth == 0:
                raise ValueError('Unmatched closing font tag')
            depth -= 1
            closed += 1
            if depth == 0:
                parts.append('^^')
        else:
            if not OPEN.fullmatch(tag):
                raise ValueError(f'Unsupported font tag: {tag}')
            if depth == 0:
                parts.append('^^')
            depth += 1
            opened += 1
        cursor = token.end()
    repair = False
    if depth:
        # The known typo has two red openers and one final closer; retain the union.
        if depth == 1 and opened == 2 and closed == 1 and not line[cursor:].strip():
            parts.append('^^')
            repair = True
        else:
            raise ValueError('Unclosed or multiline font span: manual review required')
    parts.append(line[cursor:])
    result = ''.join(parts)
    # No prose/code may be lost: only recognized tags are removed.
    if result.replace('^^', '') != TAG.sub('', line).replace('^^', ''):
        raise AssertionError('Visible content changed')
    return result, opened, repair


def migrate(data):
    source = data.decode('utf-8')
    lines = source.splitlines(keepends=True)
    out = []
    active = None
    blocks = tags = 0
    repairs = []
    changed_lines = []
    for number, line in enumerate(lines, 1):
        result = line
        # Callouts and blockquotes retain their exact original prefix in the output.
        quote = re.match(r'^(?: {0,3}>[ \t]?)*', line).group()
        quote_depth = quote.count('>')
        match = FENCE.match(line[len(quote):])
        if active:
            fence, target, depth = active
            if match and quote_depth == depth and match[1][0] == fence[0] and len(match[1]) >= len(fence) and not match[2].strip():
                active = None
            elif target:
                result, count, repair = convert_line(line)
                tags += count
                if repair:
                    repairs.append(number)
        elif match and not (match[1][0] == '`' and '`' in match[2]):
            target = match[2].strip() == 'with-html'
            active = (match[1], target, quote_depth)
            if target:
                blocks += 1
                start = line.index('with-html', len(quote) + match.end(1))
                result = line[:start] + line[start + len('with-html'):]
        if result != line:
            changed_lines.append(number)
        out.append(result)
    if active and active[1]:
        raise ValueError('Unclosed with-html fence')
    new = ''.join(out).encode('utf-8')
    return new, {'blocks': blocks, 'font_openers': tags, 'repair_lines': repairs, 'changed_lines': changed_lines}


def atomic_write(path, data):
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '.', suffix='.migration-tmp', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('vault', type=Path)
    parser.add_argument('--backup-dir', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    vault, backup = args.vault.resolve(), args.backup_dir.resolve()
    if backup == vault or vault in backup.parents:
        raise ValueError('Backup directory must be outside the vault')
    if backup.exists():
        raise ValueError('Use a new backup directory, so older backups cannot be overwritten')
    plans, errors = [], []
    for path in sorted(vault.rglob('*.md')):
        relative = path.relative_to(vault)
        if any(part.startswith('.') for part in relative.parts) or path.is_symlink():
            continue
        if vault not in path.resolve().parents:
            raise ValueError(f'Path escapes vault: {relative}')
        before = path.read_bytes()
        if b'with-html' not in before:
            continue
        try:
            after, details = migrate(before)
            if after != before:
                # A second pass must be a no-op.
                assert migrate(after)[0] == after
                plans.append((path, relative, before, after, details))
        except (ValueError, AssertionError, UnicodeError) as error:
            errors.append({'path': str(relative), 'error': str(error)})
    if errors:
        raise ValueError(json.dumps(errors, ensure_ascii=False))
    backup.mkdir(parents=True)
    report = {'vault': str(vault), 'applied': False, 'files': [], 'blocks': 0, 'font_openers': 0}
    diffs = []
    for path, relative, before, after, details in plans:
        target = backup / 'articles' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(before)
        assert digest(target.read_bytes()) == digest(before)
        report['files'].append({'path': str(relative), 'before_sha256': digest(before), 'after_sha256': digest(after), **details})
        report['blocks'] += details['blocks']
        report['font_openers'] += details['font_openers']
        diffs.extend(difflib.unified_diff(before.decode('utf-8').splitlines(True), after.decode('utf-8').splitlines(True), fromfile=str(relative), tofile=str(relative)))
    (backup / 'changes.diff').write_text(''.join(diffs), encoding='utf-8', newline='')
    report_path = backup / 'report.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    if args.apply:
        # Check every snapshot before beginning, then again immediately before each write.
        for path, _relative, before, _after, _details in plans:
            if path.read_bytes() != before:
                raise RuntimeError(f'File changed during planning: {path}')
        for path, _relative, before, after, _details in plans:
            if path.read_bytes() != before:
                raise RuntimeError(f'File changed during migration: {path}')
            atomic_write(path, after)
            assert path.read_bytes() == after
        report['applied'] = True
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'applied': report['applied'], 'files': len(plans), 'blocks': report['blocks'], 'font_openers': report['font_openers'], 'repairs': [{'path': f['path'], 'lines': f['repair_lines']} for f in report['files'] if f['repair_lines']], 'backup': str(backup)}, ensure_ascii=False))


if __name__ == '__main__':
    main()

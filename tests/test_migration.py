import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('migration', Path(__file__).parents[1] / 'scripts/migrate-with-html.py')
migration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)


class MigrationTests(unittest.TestCase):
    def test_only_target_blocks_change_and_crlf_survives(self):
        source = b'\xef\xbb\xbfoutside <font color="#ff0000">x</font>\r\n```c\r\n<font color="#ff0000">y</font>\r\n```\r\n```with-html\r\n\t\\<font color="#FF0000">fff</font>\r\n\r\n```\r\n'
        result, info = migration.migrate(source)
        expected = source.replace(b'```with-html', b'```').replace(b'\t\\<font color="#FF0000">fff</font>', b'\t\\^^fff^^')
        self.assertEqual(result, expected)
        self.assertEqual(info['blocks'], 1)
        self.assertEqual(migration.migrate(result)[0], result)

    def test_known_redundant_opener(self):
        line = '\ttouch <font color="#ff0000">$(MAKE) # comment <font color="#ff0000">// note</font>\n'
        result, count, repair = migration.convert_line(line)
        self.assertEqual(result, '\ttouch ^^$(MAKE) # comment // note^^\n')
        self.assertEqual(count, 2)
        self.assertTrue(repair)

    def test_existing_carets_and_backslashes_survive(self):
        source = b'```with-html\n  ^ ^^^^\n\\fff\n```\n'
        self.assertEqual(migration.migrate(source)[0], source.replace(b'with-html', b''))

    def test_balanced_nested_red_ranges_flatten(self):
        line = '<font color="#ff0000">a<font color="#ff0000">b</font>c</font>'
        self.assertEqual(migration.convert_line(line)[0], '^^abc^^')

    def test_reject_ambiguous_markup(self):
        for line in ['<font color="#ff0000">missing', '</font>', '<font color="blue">x</font>', '<font color="#ff0000">a<font color="#ff0000">b</font> trailing']:
            with self.subTest(line=line), self.assertRaises(ValueError):
                migration.convert_line(line)

    def test_outer_fence_keeps_example_literal(self):
        source = b'````markdown\n```with-html\n<font color="#ff0000">example</font>\n```\n````\n'
        self.assertEqual(migration.migrate(source)[0], source)

    def test_unclosed_fence_aborts(self):
        with self.assertRaises(ValueError):
            migration.migrate(b'```with-html\ntext\n')

    def test_callout_and_nested_quotes_preserve_prefixes(self):
        source = b'> [!note]\r\n>```with-html\r\n> <font color="#ff0000">x</font>\r\n> ```\r\n\n> > ```with-html\n> > y\n> > ```\n'
        expected = source.replace(b'with-html', b'').replace(b'<font color="#ff0000">x</font>', b'^^x^^')
        self.assertEqual(migration.migrate(source)[0], expected)

    def test_quoted_literal_fence_does_not_close_outer_block(self):
        source = b'```text\n> ```with-html\n> example\n> ```\n```\n'
        self.assertEqual(migration.migrate(source)[0], source)


if __name__ == '__main__':
    unittest.main()

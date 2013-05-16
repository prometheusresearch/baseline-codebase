#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, AnyVal, MaybeVal, OneOfVal, StrVal, ChoiceVal,
        BoolVal, IntVal, UIntVal, PIntVal, SeqVal, MapVal, FileVal,
        DirectoryVal)
import unittest
import textwrap


class TestValidate(unittest.TestCase):

    def test_any(self):
        val = AnyVal()
        x = object()
        self.assertEqual(val(x), x)

    def test_maybe(self):
        val = MaybeVal(IntVal())
        self.assertEqual(val(10), 10)
        self.assertEqual(val(None), None)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer
                Got:
                    'NaN'"""),
                val, 'NaN')

    def test_oneof(self):
        val = OneOfVal(BoolVal(), IntVal())
        self.assertIs(val('1'), True)
        self.assertEqual(val('10'), 10)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Failed to match the value against any of the following:
                    Expected a Boolean value
                    Got:
                        'NaN'

                    Expected an integer
                    Got:
                        'NaN'"""),
                val, 'NaN')

    def test_str(self):
        hello = '\xd0\x9f\xd1\x80\xd0\xb8\xd0\xb2\xd0\xb5\xd1\x82'
        hello_u = hello.decode('utf-8')
        hello_cp1251 = hello_u.encode('cp1251')
        val = StrVal()
        self.assertEqual(val('Hello'), 'Hello')
        self.assertEqual(val(hello), hello)
        self.assertEqual(val(hello_u), hello)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a valid UTF-8 string
                Got:
                    '\\\\xcf\\\\xf0\\\\xe8\\\\xe2\\\\xe5\\\\xf2'"""),
                val, hello_cp1251)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a string
                Got:
                    None"""),
                val, None)
        val_ssn = StrVal('^\d\d\d-\d\d-\d\d\d\d$')
        self.assertEqual(val_ssn('123-12-1234'), '123-12-1234')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a string matching:
                    /\^\\\\d\\\\d\\\\d-\\\\d\\\\d-\\\\d\\\\d\\\\d\\\\d\$/
                Got:
                    'Hello'"""),
                val_ssn, 'Hello')

    def test_choice(self):
        val = ChoiceVal('one', 'two', 'three')
        self.assertEqual(val('two'), 'two')
        self.assertEqual(val(u'two'), 'two')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a string
                Got:
                    2"""),
                val, 2)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected one of:
                    one, two, three
                Got:
                    'five'"""),
                val, 'five')

    def test_bool(self):
        val = BoolVal()
        self.assertIs(val(False), False)
        self.assertIs(val(0), False)
        self.assertIs(val(''), False)
        self.assertIs(val('0'), False)
        self.assertIs(val('false'), False)
        self.assertIs(val(True), True)
        self.assertIs(val(1), True)
        self.assertIs(val('1'), True)
        self.assertIs(val('true'), True)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a Boolean value
                Got:
                    None"""),
                val, None)

    def test_int(self):
        val = IntVal()
        self.assertEqual(val(-10), -10)
        self.assertEqual(val(1L), 1)
        self.assertEqual(val('-10'), -10)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer
                Got:
                    None"""),
                val, None)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer
                Got:
                    'NaN'"""),
                val, 'NaN')
        self.assertRaises(Error, val, True)
        self.assertRaises(Error, val, 1.0)
        val_1to10 = IntVal(1, 10)
        val_1to = IntVal(min_bound=1)
        val_to10 = IntVal(max_bound=10)
        self.assertEqual(val_1to10(1), 1)
        self.assertEqual(val_1to10(5), 5)
        self.assertEqual(val_1to10(10), 10)
        self.assertRaises(Error, val_1to10, 0)
        self.assertRaises(Error, val_1to10, 11)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer in range:
                    \\[1..10\\]
                Got:
                    100"""),
                val_1to10, 100)
        self.assertEqual(val_1to(1), 1)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer in range:
                    \\[1..\\]
                Got:
                    0"""),
                val_1to, 0)
        self.assertEqual(val_to10(10), 10)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer in range:
                    \\[..10\\]
                Got:
                    11"""),
                val_to10, 11)
        val_pos = PIntVal()
        self.assertEqual(val_pos(1), 1)
        self.assertRaises(Error, val_pos, 0)
        val_nonneg = UIntVal()
        self.assertEqual(val_nonneg(0), 0)
        self.assertRaises(Error, val_nonneg, -1)

    def test_seq(self):
        val = SeqVal()
        self.assertEqual(val([0, False, None]), [0, False, None])
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a sequence
                Got:
                    None"""),
                val, None)
        val = SeqVal(IntVal())
        self.assertEqual(val(range(10)), range(10))
        self.assertEqual(val([]), [])
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer
                Got:
                    None
                While validating sequence item
                    #2"""),
                val, [0, None])

    def test_map(self):
        i2b = {"0": "false", "1": "true"}
        val = MapVal()
        self.assertEqual(val(i2b), i2b)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a mapping
                Got:
                    None"""),
                val, None)
        val = MapVal(IntVal(), BoolVal())
        self.assertEqual(val({}), {})
        self.assertEqual(val(i2b), {0: False, 1: True})
        val = MapVal(PIntVal(), BoolVal())
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer in range:
                    \\[1..\\]
                Got:
                    '0'
                While validating mapping key:
                    '0'"""),
                val, i2b)
        val = MapVal(IntVal(), IntVal())
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected an integer
                Got:
                    'false'
                While validating mapping value for key:
                    0"""),
                val, i2b)

    def test_file(self):
        val = FileVal()
        self.assertEqual(val('setup.py'), 'setup.py')
        self.assertEqual(val(u'setup.py'), 'setup.py')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a string
                Got:
                    None"""),
                val, None)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Cannot find file:
                    invalid.py"""),
                val, 'invalid.py')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Cannot find file:
                    test"""),
                val, 'test')

    def test_directory(self):
        val = DirectoryVal()
        self.assertEqual(val('test'), 'test')
        self.assertEqual(val(u'test'), 'test')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Expected a string
                Got:
                    None"""),
                val, None)
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Cannot find directory:
                    invalid"""),
                val, 'invalid')
        self.assertRaisesRegexp(Error, textwrap.dedent("""\
                Cannot find directory:
                    setup.py"""),
                val, 'setup.py')


if __name__ == '__main__':
    unittest.main()



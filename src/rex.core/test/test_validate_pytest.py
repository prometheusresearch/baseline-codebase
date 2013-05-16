#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, AnyVal, MaybeVal, OneOfVal, StrVal, ChoiceVal,
        BoolVal, IntVal, UIntVal, PIntVal, SeqVal, MapVal, FileVal,
        DirectoryVal)
from pytest import raises
import textwrap


def test_any():
    val = AnyVal()
    x = object()
    assert val(x) == x


def test_maybe():
    val = MaybeVal(IntVal())
    assert val(10) == 10
    assert val(None) == None
    assert str(raises(Error, val, 'NaN').value) == textwrap.dedent("""\
            Expected an integer
            Got:
                'NaN'""")


def test_oneof():
    val = OneOfVal(BoolVal(), IntVal())
    assert val('1') is True
    assert val('10') == 10
    assert str(raises(Error, val, 'NaN').value) == textwrap.dedent("""\
            Failed to match the value against any of the following:
                Expected a Boolean value
                Got:
                    'NaN'

                Expected an integer
                Got:
                    'NaN'""")


def test_str():
    hello = '\xd0\x9f\xd1\x80\xd0\xb8\xd0\xb2\xd0\xb5\xd1\x82'
    hello_u = hello.decode('utf-8')
    hello_cp1251 = hello_u.encode('cp1251')
    val = StrVal()
    assert val('Hello') == 'Hello'
    assert val(hello) == hello
    assert val(hello_u) == hello
    assert str(raises(Error, val, hello_cp1251).value) == textwrap.dedent("""\
            Expected a valid UTF-8 string
            Got:
                '\\xcf\\xf0\\xe8\\xe2\\xe5\\xf2'""")
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a string
            Got:
                None""")
    val_ssn = StrVal('^\d\d\d-\d\d-\d\d\d\d$')
    assert val_ssn('123-12-1234') == '123-12-1234'
    assert str(raises(Error, val_ssn, 'Hello').value) == textwrap.dedent("""\
            Expected a string matching:
                /^\d\d\d-\d\d-\d\d\d\d$/
            Got:
                'Hello'""")


def test_choice():
    val = ChoiceVal('one', 'two', 'three')
    assert val('two') == 'two'
    assert val(u'two') == 'two'
    assert str(raises(Error, val, 2).value) == textwrap.dedent("""\
            Expected a string
            Got:
                2""")
    assert str(raises(Error, val, 'five').value) == textwrap.dedent("""\
            Expected one of:
                one, two, three
            Got:
                'five'""")


def test_bool():
    val = BoolVal()
    assert val(False) is False
    assert val(0) is False
    assert val('') is False
    assert val('0') is False
    assert val('false') is False
    assert val(True) is True
    assert val(1) is True
    assert val('1') is True
    assert val('true') is True
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a Boolean value
            Got:
                None""")


def test_int():
    val = IntVal()
    assert val(-10) == -10
    assert val(1L) == 1
    assert val('-10') == -10
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected an integer
            Got:
                None""")
    assert str(raises(Error, val, 'NaN').value) == textwrap.dedent("""\
            Expected an integer
            Got:
                'NaN'""")
    raises(Error, val, True)
    raises(Error, val, 1.0)
    val_1to10 = IntVal(1, 10)
    val_1to = IntVal(min_bound=1)
    val_to10 = IntVal(max_bound=10)
    assert val_1to10(1) == 1
    assert val_1to10(5) == 5
    assert val_1to10(10) == 10
    raises(Error, val_1to10, 0)
    raises(Error, val_1to10, 11)
    assert str(raises(Error, val_1to10, 100).value) == textwrap.dedent("""\
            Expected an integer in range:
                [1..10]
            Got:
                100""")
    assert val_1to(1) == 1
    assert str(raises(Error, val_1to, 0).value) == textwrap.dedent("""\
            Expected an integer in range:
                [1..]
            Got:
                0""")
    assert val_to10(10) == 10
    assert str(raises(Error, val_to10, 11).value) == textwrap.dedent("""\
            Expected an integer in range:
                [..10]
            Got:
                11""")
    val_pos = PIntVal()
    assert val_pos(1) == 1
    raises(Error, val_pos, 0)
    val_nonneg = UIntVal()
    assert val_nonneg(0) == 0
    raises(Error, val_nonneg, -1)


def test_seq():
    val = SeqVal()
    assert val([0, False, None]) == [0, False, None]
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a sequence
            Got:
                None""")
    val = SeqVal(IntVal())
    assert val(range(10)) == range(10)
    assert val([]) == []
    assert str(raises(Error, val, [0, None]).value) == textwrap.dedent("""\
            Expected an integer
            Got:
                None
            While validating sequence item
                #2""")


def test_map():
    i2b = {"0": "false", "1": "true"}
    val = MapVal()
    assert val(i2b) == i2b
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a mapping
            Got:
                None""")
    val = MapVal(IntVal(), BoolVal())
    assert val({}) == {}
    assert val(i2b) == {0: False, 1: True}
    val = MapVal(PIntVal(), BoolVal())
    assert str(raises(Error, val, i2b).value) == textwrap.dedent("""\
            Expected an integer in range:
                [1..]
            Got:
                '0'
            While validating mapping key:
                '0'""")
    val = MapVal(IntVal(), IntVal())
    assert str(raises(Error, val, i2b).value) == textwrap.dedent("""\
            Expected an integer
            Got:
                'false'
            While validating mapping value for key:
                0""")


def test_file():
    val = FileVal()
    assert val('setup.py') == 'setup.py'
    assert val(u'setup.py') == 'setup.py'
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a string
            Got:
                None""")
    assert str(raises(Error, val, 'invalid.py').value) == textwrap.dedent("""\
            Cannot find file:
                invalid.py""")
    assert str(raises(Error, val, 'test').value) == textwrap.dedent("""\
            Cannot find file:
                test""")


def test_directory():
    val = DirectoryVal()
    assert val('test') == 'test'
    assert val(u'test') == 'test'
    assert str(raises(Error, val, None).value) == textwrap.dedent("""\
            Expected a string
            Got:
                None""")
    assert str(raises(Error, val, 'invalid').value) == textwrap.dedent("""\
            Cannot find directory:
                invalid""")
    assert str(raises(Error, val, 'setup.py').value) == textwrap.dedent("""\
            Cannot find directory:
                setup.py""")



#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, AnyVal, MaybeVal, OneOfVal, StrVal, ChoiceVal,
        BoolVal, IntVal, UIntVal, PIntVal, SeqVal, MapVal, FileVal,
        DirectoryVal)
from pbbt import raises


def test_any():
    print "### test_any()"
    val = AnyVal()
    x = 'X'
    print "AnyVal()('X'):", repr(val(x))


def test_maybe():
    print "### test_maybe()"
    val = MaybeVal(IntVal())
    print "MaybeVal(IntVal())(10):", val(10)
    print "MaybeVal(IntVal())(None):", val(None)
    print "MaybeVal(IntVal())('NaN') raises:"
    print raises(Error, val, 'NaN')


def test_oneof():
    print "### test_oneof()"
    val = OneOfVal(BoolVal(), IntVal())
    print "OneofVal(BoolVal(), IntVal())('1'):", repr(val('1'))
    print "OneofVal(BoolVal(), IntVal())('10'):", repr(val('10'))
    print "OneOfVal(BoolVal(), IntVal())(<invalid value>) raises:"
    print raises(Error, val, 'NaN')


def test_str():
    print "### test_str()"
    hello = '\xd0\x9f\xd1\x80\xd0\xb8\xd0\xb2\xd0\xb5\xd1\x82'
    hello_u = hello.decode('utf-8')
    hello_cp1251 = hello_u.encode('cp1251')
    val = StrVal()
    print "StrVal()('Hello'):", repr(val('Hello'))
    print "StrVal()(<UTF-8 string>):", repr(val(hello))
    print "StrVal()(<Unicode string>):", repr(val(hello_u))
    print "StrVal()(<non-UTF8 string>) raises:"
    print raises(Error, val, hello_cp1251)
    print "StrVal()(<not a string>) raises:"
    print raises(Error, val, None)
    val_ssn = StrVal('^\d\d\d-\d\d-\d\d\d\d$')
    print "StrVal(<SSN>)('123-12-1234'):", repr(val_ssn('123-12-1234'))
    print "StrVal(<SSN>)(<not a SSN>) raises:"
    print raises(Error, val_ssn, 'Hello')


def test_choice():
    print "### test_choice()"
    val = ChoiceVal('one', 'two', 'three')
    print "ChoiceVal(...)(<choice>):", repr(val('two'))
    print "ChoiceVal(...)(<choice as Unicode string>):", repr(val(u'two'))
    print "ChoiceVal(...)(<non-string>) raises:"
    print raises(Error, val, 2)
    print "ChoiceVal(...)(<not a choice>) raises:"
    print raises(Error, val, 'five')


def test_bool():
    print "### test_bool()"
    val = BoolVal()
    print "BoolVal()(False):", val(False)
    print "BoolVal()(0):", val(0)
    print "BoolVal()(''):", val('')
    print "BoolVal()('false'):", val('false')
    print "BoolVal()(True):", val(True)
    print "BoolVal()(1):", val(1)
    print "BoolVal()('1'):", val('1')
    print "BoolVal()('true'):", val('true')
    print "BoolVal()(<not a Boolean>) raises:"
    print raises(Error, val, None)


def test_int():
    print "### test_int()"
    val = IntVal()
    print "IntVal()(-10):", val(-10)
    print "IntVal()(1L):", repr(val(1L))
    print "IntVal()('-10'):", repr(val('-10'))
    print "IntVal()(<not a number>) raises:"
    print raises(Error, val, None)
    print "IntVal()(<non-numeric string>) raises:"
    print raises(Error, val, 'NaN')
    print "IntVal()(<Boolean>) raises:"
    print raises(Error, val, True)
    print "IntVal()(<float>) raises:"
    print raises(Error, val, 1.0)
    val_1to10 = IntVal(1, 10)
    val_1to = IntVal(min_bound=1)
    val_to10 = IntVal(max_bound=10)
    print "IntVal(1, 10)(1):", val_1to10(1)
    print "IntVal(1, 10)(5):", val_1to10(5)
    print "IntVal(1, 10)(10):", val_1to10(10)
    print "IntVal(1, 10)(0) raises:"
    print raises(Error, val_1to10, 0)
    print "IntVal(1, 10)(11) raises:"
    print raises(Error, val_1to10, 11)
    print "IntVal(1, None)(1):", val_1to(1)
    print "IntVal(1, None)(0) raises:"
    print raises(Error, val_1to, 0)
    print "IntVal(None, 10)(10):", val_to10(10)
    print "IntVal(None, 10)(11) raises:"
    print raises(Error, val_to10, 11)
    val_pos = PIntVal()
    print "PIntVal()(1):", val_pos(1)
    print "PIntVal()(0) raises:"
    print raises(Error, val_pos, 0)
    val_nonneg = UIntVal()
    print "UIntVal()(0):", val_nonneg(0)
    print "UIntVal()(-1) raises:"
    print raises(Error, val_nonneg, -1)


def test_seq():
    print "### test_seq()"
    val = SeqVal()
    print "SeqVal()([0, False, None]):", val([0, False, None])
    print "SeqVal()(<non-sequence>) raises:"
    print raises(Error, val, None)
    val = SeqVal(IntVal())
    print "SeqVal(IntVal())(range(10)):", val(range(10))
    print "SeqVal(IntVal())([]):", val([])
    print "SeqVal(IntVal())(<non-integer sequence>) raises:"
    print raises(Error, val, [0, None])


def test_map():
    print "### test_map()"
    i2b = {"0": "false", "1": "true"}
    val = MapVal()
    print "MapVal()(%s):" % repr(i2b), val(i2b)
    print "MapVal()(<non-mapping>) raises:"
    print raises(Error, val, None)
    val = MapVal(IntVal(), BoolVal())
    print "MapVal(IntVal(), BoolVal())({}):", val({})
    print "MapVal(IntVal(), BoolVal())(%s):" % repr(i2b), val(i2b)
    val = MapVal(PIntVal(), BoolVal())
    print "MapVal(...)(<mapping with non-conforming keys>) raises:"
    print raises(Error, val, i2b)
    val = MapVal(IntVal(), IntVal())
    print "MapVal(...)(<mapping with non-conforming values>) raises:"
    print raises(Error, val, i2b)


def test_file():
    print "### test_file()"
    val = FileVal()
    print "FileVal()('setup.py'):", repr(val('setup.py'))
    print "FileVal()(u'setup.py'):", repr(val(u'setup.py'))
    print "FileVal()(<not a string>) raises:"
    print raises(Error, val, None)
    print "FileVal()(<not an existing file>) raises:"
    print raises(Error, val, 'invalid.py')
    print "FileVal()(<not a file>) raises:"
    print raises(Error, val, 'test')


def test_directory():
    print "### test_directory()"
    val = DirectoryVal()
    print "DirectoryVal()('test'):", repr(val('test'))
    print "DirectoryVal()(u'test'):", repr(val(u'test'))
    print "DirectoryVal()(<not a string>) raises:"
    print raises(Error, val, None)
    print "DirectoryVal()(<not an existing directory>) raises:"
    print raises(Error, val, 'invalid')
    print "DirectoryVal()(<not a directory>) raises:"
    print raises(Error, val, 'setup.py')


if __name__ == '__main__':
    test_any()
    test_maybe()
    test_oneof()
    test_str()
    test_choice()
    test_bool()
    test_int()
    test_seq()
    test_map()
    test_file()
    test_directory()



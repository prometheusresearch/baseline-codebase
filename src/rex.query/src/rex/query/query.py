#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import (
        Error, guard, Validate, OnMap, OnSeq, OnField, UnionVal, RecordVal,
        MaybeVal, UIntVal, UStrVal)
import decimal
import datetime


class Syntax(object):

    __slots__ = ()


class ApplySyntax(Syntax):

    __slots__ = ('op', 'args')

    def __init__(self, op, args):
        self.op = op
        self.args = args

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__, self.op, self.args)

    def __unicode__(self):
        if not self.args:
            return self.op
        if self.op in [u'navigate'] and len(self.args) == 1 \
                and isinstance(self.args[0], LiteralSyntax) \
                and isinstance(self.args[0].val, unicode):
            return self.args[0].val
        if self.op in [u'!', u'+', u'-'] and len(self.args) == 1:
            return u"%s%s" % (self.op, self.args[0])
        if self.op in [u'.'] and len(self.args) == 2:
            return u"%s%s%s" % (self.args[0], self.op, self.args[1])
        if self.op in [
                u'=>', u'+', u'-', u'*', u'/',
                u'=', u'!=', u'>', u'>=', u'<', u'<=',
                u'&', u'|'] and len(self.args) == 2:
            return u"(%s%s%s)" % (self.args[0], self.op, self.args[1])
        head = None
        tail = self.args
        if self.op in [
                u'select', u'filter', u'group',
                u'sort', u'take', u'skip'] and len(self.args) > 1:
            head = tail[0]
            tail = tail[1:]
        chunks = []
        if head is not None:
            chunks.append(u"%s:" % head)
        chunks.append(self.op)
        if tail:
            chunks.append(u"(%s)" % u", ".join([unicode(arg) for arg in tail]))
        return u"".join(chunks)

    def __str__(self):
        return unicode(self).encode('utf-8', 'replace')


class LiteralSyntax(Syntax):

    __slots__ = ('val')

    def __init__(self, val):
        self.val = val

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.val)

    def __unicode__(self):
        if self.val is None:
            return u"null"
        if isinstance(self.val, unicode):
            return u"%r" % self.val.encode('utf-8', 'replace')
        elif isinstance(self.val, str):
            return u"%r" % self.val
        elif isinstance(self.val, bool):
            return unicode(self.val).lower()
        elif isinstance(self.val, (int, float, decimal.Decimal)):
            return unicode(self.val)
        else:
            return u"%r" % str(self.val)

    def __str__(self):
        return unicode(self).encode('utf-8', 'replace')


class Query(object):

    def __init__(self, syntax, limit=None, format=None):
        self.syntax = syntax
        self.limit = limit
        self.format = format

    def __repr__(self):
        args = ["%r" % self.syntax]
        if self.limit is not None:
            args.append("limit=%r" % self.limit)
        if self.format is not None:
            args.append("format=%r" % self.format)
        return "%s(%s)" % (self.__class__.__name__, ",".join(args))

    def __unicode__(self):
        return unicode(self.syntax)

    def __str__(self):
        return str(self.syntax)


class LiteralVal(Validate):

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, str):
                data = data.decode('utf-8', 'replace')
            if not isinstance(data, (
                        unicode, bool, int, long, float,
                        decimal.Decimal, datetime.date,
                        datetime.time, datetime.datetime)):
                raise Error("Expected a literal value")
            return LiteralSyntax(data)


class ApplySeqVal(Validate):

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if not isinstance(data, list):
                raise Error("Expected a sequence")
            if not data:
                raise Error("Expected a non-empty sequence")
        with guard("Got:", repr(data[0])):
            if not isinstance(data[0], (str, unicode)):
                raise Error("Expected operation name")
        op = data[0]
        if isinstance(op, str):
            op = op.decode('utf-8', 'replace')
        args = [QueryVal.validate_syntax(arg) for arg in data[1:]]
        return ApplySyntax(op, args)


class ApplyMapVal(Validate):

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if not isinstance(data, dict):
                raise Error("Expected a mapping")
            for key in sorted(data):
                if key not in ['op', 'args']:
                    raise Error("Expected a mapping with keys:", "op, args")
            if 'op' not in data:
                raise Error("Expected a mapping with field:", "op")
        op = data['op']
        args = data.get('args', [])
        if isinstance(op, str):
            op = op.decode('utf-8', 'replace')
        with guard("Got:", repr(op)):
            if not isinstance(op, unicode):
                raise Error("Expected operation name")
        with guard("Got:", repr(args)):
            if not isinstance(args, list):
                raise Error("Expected a sequence of arguments")
        args = [QueryVal.validate_syntax(arg) for arg in args]
        return ApplySyntax(op, args)


class QueryVal(Validate):

    validate_syntax = UnionVal(
                (OnMap, ApplyMapVal),
                (OnSeq, ApplySeqVal),
                LiteralVal)

    validate_query = UnionVal(
            (OnField('syntax'), RecordVal(
                ('syntax', validate_syntax),
                ('limit', MaybeVal(UIntVal), None),
                ('format', MaybeVal(UStrVal), None))),
            validate_syntax)

    def __call__(self, data):
        data = self.validate_query(data)
        if isinstance(data, Syntax):
            return Query(data)
        return Query(data.syntax, limit=data.limit, format=data.format)



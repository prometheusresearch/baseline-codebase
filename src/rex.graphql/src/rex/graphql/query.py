# pyre-check
"""

    rex.graphql.query
    =================

    An embedded DSL to programmatically generate and execute database queries.

    Example::

        from rex.graphql import query as q, execute

        product = execute(
            q.activity.project(
                year=q.year(q.date_occurred),
                month=q.month(q.date_occurred),
            )
            .filter(q.count(q.activity) > 0)
            .select(
                date=q.string(q.year) + "-" + q.string(q.month),
                count=q.count(q.activity),
            )
        )

    The namespace ``names`` represents names in the database space and ``funcs``
    - functions.

"""

from collections import Iterable
from datetime import date
from decimal import Decimal
from typing import Optional

from htsql.core.tr.translate import translate

from rex.query.query import Syntax, LiteralSyntax, ApplySyntax
from rex.query.bind import RexBindingState
from rex.core import Error
from rex.db import get_db

from . import desc


__all__ = ("query", "execute", "to_htsql_syntax")


def merge_args(a, b):
    if not b:
        return a
    c = {**a}
    for name, arg in b.items():
        if name in c:
            assert arg == c[name]
        c[name] = arg
    return c


class Query:

    __slots__ = ("syn", "args")

    def __init__(self, syn: Optional[Syntax], args):
        self.syn = syn
        self.args = args

    def __getattr__(self, name):
        return self.navigate(name)

    def navigate(self, name):
        if self.syn is None:
            syn = ApplySyntax("navigate", [LiteralSyntax(name)])
            return Query(syn, self.args)
        else:
            syn = ApplySyntax(
                ".", [self.syn, ApplySyntax("navigate", [LiteralSyntax(name)])]
            )
            return Query(syn, self.args)

    def filter(self, q):
        q = lift(q)
        syn = ApplySyntax("filter", [self.syn, q.syn])
        args = merge_args(self.args, q.args)
        return Query(syn, args)

    def group(self, **by):
        syns = [self.syn]
        args = self.args
        for k, v in by.items():
            v = lift(v)
            args = merge_args(args, v.args)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("group", syns)
        return Query(syn, args)

    def select(self, **what):
        syns = [self.syn]
        args = self.args
        for k, v in what.items():
            v = lift(v)
            args = merge_args(args, v.args)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("select", syns)
        return Query(syn, args)

    def __add__(self, other):
        other = lift(other)
        syn = ApplySyntax("+", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __radd__(self, other):
        other = lift(other)
        syn = ApplySyntax("+", [other.syn, self.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __sub__(self, other):
        other = lift(other)
        syn = ApplySyntax("-", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __rsub__(self, other):
        other = lift(other)
        syn = ApplySyntax("-", [other.syn, self.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __mul__(self, other):
        other = lift(other)
        syn = ApplySyntax("*", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __rmul__(self, other):
        other = lift(other)
        syn = ApplySyntax("*", [other.syn, self.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __truediv__(self, other):
        other = lift(other)
        syn = ApplySyntax("/", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __rtruediv__(self, other):
        other = lift(other)
        syn = ApplySyntax("/", [other.syn, self.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __gt__(self, other):
        other = lift(other)
        syn = ApplySyntax(">", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __ge__(self, other):
        other = lift(other)
        syn = ApplySyntax(">=", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __lt__(self, other):
        other = lift(other)
        syn = ApplySyntax("<", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __le__(self, other):
        other = lift(other)
        syn = ApplySyntax("<=", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __eq__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            args = self.args
            for o in other:
                o = lift(o)
                syns.append(o.syn)
                args = merge_args(args, o.args)
        else:
            other = lift(other)
            syns.append(other.syn)
            args = merge_args(self.args, other.args)
        syn = ApplySyntax("=", syns)
        return Query(syn, args)

    def __ne__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            args = self.args
            for o in other:
                o = lift(o)
                syns.append(o.syn)
                args = merge_args(args.args, o.args)
        else:
            other = lift(other)
            syns.append(other.syn)
            args = merge_args(self.args, other.args)
        syn = ApplySyntax("!=", syns)
        return Query(syn, args)

    def __and__(self, other):
        other = lift(other)
        syn = ApplySyntax("&", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __or__(self, other):
        other = lift(other)
        syn = ApplySyntax("|", [self.syn, other.syn])
        args = merge_args(self.args, other.args)
        return Query(syn, args)

    def __invert__(self):
        syn = ApplySyntax("!", [self.syn])
        return Query(syn, self.args)

    def take(self, limit, offset=None):
        args = [self.syn, LiteralSyntax(limit)]
        if offset is not None:
            args.append(LiteralSyntax(offset))
        syn = ApplySyntax("take", args)
        return Query(syn, self.args)

    def __str__(self):
        return str(self.syn)

    def __call__(self, *others):
        def extract_navigate(syn):
            # navigate(name) -> name
            assert isinstance(syn, ApplySyntax)
            assert syn.op == "navigate"
            assert isinstance(syn.args[0], LiteralSyntax)
            assert isinstance(syn.args[0].val, str)
            return syn.args[0].val

        if isinstance(self.syn, ApplySyntax):
            # SYNTAX: q.func(...)
            if self.syn.op == "navigate":
                name = extract_navigate(self.syn)
                others = [lift(q) for q in others]
            # SYNTAX: q.table.func(...)
            elif self.syn.op == ".":
                name = extract_navigate(self.syn.args[1])
                others = [lift(q) for q in others]
                others.insert(0, Query(self.syn.args[0], {}))
            else:
                raise Error("not a function")
        syns = []
        args = self.args
        for o in others:
            syns.append(o.syn)
            args = merge_args(args, o.args)
        syn = ApplySyntax(name, syns)
        return Query(syn, args)


def lift(v):
    if type(v) is Query:
        return v
    elif type(v) is desc.argument:
        syn = ApplySyntax("var", [LiteralSyntax(v.name)])
        return Query(syn, {v.name: v})
    elif v is None:
        return Query(LiteralSyntax(v), {})
    elif isinstance(v, (bool, int, str, float, Decimal, date)):
        return Query(LiteralSyntax(v), {})
    else:
        raise Error("Unable to create a query of value:", repr(v))


def bind(query):
    state = RexBindingState()
    binding = state(query.syn)
    binding = state.collect(binding)
    return binding


def to_htsql_syntax(query, db=None):
    if db is None:
        db = get_db()
    with db:
        binding = bind(query)
    return binding.syntax


def to_sql_syntax(query, db=None):
    if db is None:
        db = get_db()
    with db:
        binding = bind(query)
        pipe = translate(binding)
    return pipe.properties["sql"]


def execute(query, db=None):
    """ Execute query."""
    if db is None:
        db = get_db()
    with db:
        binding = bind(query)
        pipe = translate(binding)
        product = pipe()(None)
    return product


query = Query(None, {})
q = query

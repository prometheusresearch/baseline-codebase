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

from . import param


__all__ = ("query", "execute", "to_htsql_syntax")


def merge_params(a, b):
    if not b:
        return a
    c = {**a}
    for name, arg in b.items():
        if name in c:
            assert arg == c[name]
        c[name] = arg
    return c


class Query:

    __slots__ = ("syn", "params")

    def __init__(self, syn: Optional[Syntax], params):
        self.syn = syn
        self.params = params

    def __getattr__(self, name):
        return self.navigate(name)

    def navigate(self, name):
        if self.syn is None:
            syn = ApplySyntax("navigate", [LiteralSyntax(name)])
            return Query(syn, self.params)
        else:
            syn = ApplySyntax(
                ".", [self.syn, ApplySyntax("navigate", [LiteralSyntax(name)])]
            )
            return Query(syn, self.params)

    def filter(self, q):
        q = lift(q)
        syn = ApplySyntax("filter", [self.syn, q.syn])
        params = merge_params(self.params, q.params)
        return Query(syn, params)

    def group(self, **by):
        syns = [self.syn]
        params = self.params
        for k, v in by.items():
            v = lift(v)
            params = merge_params(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("group", syns)
        return Query(syn, params)

    def define(self, **what):
        base = self.syn if self.syn is not None else ApplySyntax("here", [])
        syns = [base]
        params = self.params
        for k, v in what.items():
            v = lift(v)
            params = merge_params(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("define", syns)
        return Query(syn, params)

    def let(self, name, value):
        base = self.syn if self.syn is not None else ApplySyntax("here", [])
        value = lift(value)
        params = merge_params(self.params, v.params)
        syn = ApplySyntax("let", [LiteralSyntax(name), value.syn])
        return Query(syn, params)

    def select(self, **what):
        syns = [self.syn]
        params = self.params
        for k, v in what.items():
            v = lift(v)
            params = merge_params(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("select", syns)
        return Query(syn, params)

    def matches(self, other):
        other = lift(other)
        syn = ApplySyntax("~", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __add__(self, other):
        other = lift(other)
        syn = ApplySyntax("+", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __radd__(self, other):
        other = lift(other)
        syn = ApplySyntax("+", [other.syn, self.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __sub__(self, other):
        other = lift(other)
        syn = ApplySyntax("-", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __rsub__(self, other):
        other = lift(other)
        syn = ApplySyntax("-", [other.syn, self.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __mul__(self, other):
        other = lift(other)
        syn = ApplySyntax("*", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __rmul__(self, other):
        other = lift(other)
        syn = ApplySyntax("*", [other.syn, self.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __truediv__(self, other):
        other = lift(other)
        syn = ApplySyntax("/", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __rtruediv__(self, other):
        other = lift(other)
        syn = ApplySyntax("/", [other.syn, self.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __gt__(self, other):
        other = lift(other)
        syn = ApplySyntax(">", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __ge__(self, other):
        other = lift(other)
        syn = ApplySyntax(">=", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __lt__(self, other):
        other = lift(other)
        syn = ApplySyntax("<", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __le__(self, other):
        other = lift(other)
        syn = ApplySyntax("<=", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __eq__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            params = self.params
            for o in other:
                o = lift(o)
                syns.append(o.syn)
                params = merge_params(params, o.params)
        else:
            other = lift(other)
            syns.append(other.syn)
            params = merge_params(self.params, other.params)
        syn = ApplySyntax("=", syns)
        return Query(syn, params)

    def __ne__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            params = self.params
            for o in other:
                o = lift(o)
                syns.append(o.syn)
                params = merge_params(params.params, o.params)
        else:
            other = lift(other)
            syns.append(other.syn)
            params = merge_params(self.params, other.params)
        syn = ApplySyntax("!=", syns)
        return Query(syn, params)

    def __and__(self, other):
        other = lift(other)
        syn = ApplySyntax("&", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __or__(self, other):
        other = lift(other)
        syn = ApplySyntax("|", [self.syn, other.syn])
        params = merge_params(self.params, other.params)
        return Query(syn, params)

    def __invert__(self):
        syn = ApplySyntax("!", [self.syn])
        return Query(syn, self.params)

    def take(self, limit, offset=None):
        syns = [self.syn, LiteralSyntax(limit)]
        if offset is not None:
            syns.append(LiteralSyntax(offset))
        syn = ApplySyntax("take", syns)
        return Query(syn, self.params)

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
        params = self.params
        for o in others:
            syns.append(o.syn)
            params = merge_params(params, o.params)
        syn = ApplySyntax(name, syns)
        return Query(syn, params)


def lift(v):
    if isinstance(v, Query):
        return v
    elif isinstance(v, param.Param):
        syn = ApplySyntax("var", [LiteralSyntax(v.name)])
        return Query(syn, {v.name: v})
    elif v is None:
        return Query(LiteralSyntax(v), {})
    elif isinstance(v, (bool, int, str, float, Decimal, date)):
        return Query(LiteralSyntax(v), {})
    else:
        raise Error("Unable to create a query of value:", repr(v))


def bind(query, variables=None):
    variables = variables or {}
    state = RexBindingState()
    with state.with_vars(variables):
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


def execute(query, db=None, variables=None):
    """ Execute query."""
    if db is None:
        db = get_db()
    with db:
        binding = bind(query, variables=variables)
        pipe = translate(binding)
        product = pipe()(None)
    return product


query = Query(None, {})
q = query

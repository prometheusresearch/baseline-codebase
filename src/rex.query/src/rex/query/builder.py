"""

    rex.query.builder
    =================

    An embedded DSL to programmatically generate and execute database queries.

    Example::

        from rex.query.builder import q

        product = (
            q.activity
            .select(
                year=q.year(q.date_occurred),
                month=q.month(q.date_occurred),
            )
            .filter(q.count(q.activity) > 0)
            .select(
                date=q.string(q.year) + "-" + q.string(q.month),
                count=q.count(q.activity),
            )
        ).produce()

"""

import abc
import io
import tempfile
from collections import Iterable
from datetime import date
from decimal import Decimal
from typing import Optional

from htsql.core import domain
from htsql.core.tr.translate import translate
from htsql.tweak.etl.cmd.insert import BuildExtractNode, BuildExtractTable

from rex.query.query import Syntax, LiteralSyntax, ApplySyntax
from rex.query.bind import RexBindingState
from rex.core import Error
from rex.db import RexHTSQL, HTSQLVal, get_db


__all__ = ("q", "Q")


class Param(abc.ABC):
    """ A parameter.

    Parameters are used by :func:`compute` and :func:`query` fields.

    A parameter's value can be supplied as a GraphQL argument or via some other
    means.
    """

    def __init__(self, name, type):
        self.name = name
        self.type = type

    @abc.abstractmethod
    def with_type(self, type):
        pass

    @abc.abstractmethod
    def __eq__(self, o):
        pass

    @staticmethod
    def merge(a, b):
        if not b:
            return a
        c = {**a}
        for name, arg in b.items():
            if name in c:
                assert arg == c[name]
            c[name] = arg
        return c


class Q:
    """ Query Builder API

    This class is designed to be subclassed but only adding methods is allowed.
    """

    __slots__ = ("db", "syn", "params")

    def __init__(self, db=None, syn: Optional[Syntax] = None, params=None):
        self.db = db
        self.syn = syn
        self.params = params or {}

    def __getitem__(self, name):
        return self.navigate(name)

    def __getattr__(self, name):
        return self.navigate(name)

    def navigate(self, name):
        if self.syn is None:
            syn = ApplySyntax("navigate", [LiteralSyntax(name)])
            return self.__class__(db=self.db, syn=syn, params=self.params)
        else:
            syn = ApplySyntax(
                ".", [self.syn, ApplySyntax("navigate", [LiteralSyntax(name)])]
            )
            return self.__class__(db=self.db, syn=syn, params=self.params)

    def filter(self, q):
        q = lift(q, q_cls=self.__class__)
        syn = ApplySyntax("filter", [self.syn, q.syn])
        params = Param.merge(self.params, q.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def group(self, **by):
        syns = [self.syn]
        params = self.params
        for k, v in by.items():
            v = lift(v, q_cls=self.__class__)
            params = Param.merge(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("group", syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def here(self):
        return Q(db=self.db, syn=ApplySyntax("here", []), params=self.params)

    def keep(self, **what):
        base = self.syn if self.syn is not None else ApplySyntax("here", [])
        syns = [base]
        params = self.params
        for k, v in what.items():
            v = lift(v)
            params = Param.merge(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("keep", syns)
        return Q(db=self.db, syn=syn, params=params)

    def define(self, **what):
        base = self.syn if self.syn is not None else ApplySyntax("here", [])
        syns = [base]
        params = self.params
        for k, v in what.items():
            v = lift(v, q_cls=self.__class__)
            params = Param.merge(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("define", syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def let(self, name, value):
        base = self.syn if self.syn is not None else ApplySyntax("here", [])
        value = lift(value, q_cls=self.__class__)
        params = Param.merge(self.params, v.params)
        syn = ApplySyntax("let", [LiteralSyntax(name), value.syn])
        return self.__class__(db=self.db, syn=syn, params=params)

    def select(self, **what):
        syns = [self.syn]
        params = self.params
        for k, v in what.items():
            v = lift(v, q_cls=self.__class__)
            params = Param.merge(params, v.params)
            syns.append(ApplySyntax("=>", [LiteralSyntax(k), v.syn]))
        syn = ApplySyntax("select", syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def matches(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("~", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __add__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("+", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __radd__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("+", [other.syn, self.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __sub__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("-", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __rsub__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("-", [other.syn, self.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __mul__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("*", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __rmul__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("*", [other.syn, self.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __truediv__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("/", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __rtruediv__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("/", [other.syn, self.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __gt__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax(">", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __ge__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax(">=", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __lt__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("<", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __le__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("<=", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __eq__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            params = self.params
            for o in other:
                o = lift(o, q_cls=self.__class__)
                syns.append(o.syn)
                params = Param.merge(params, o.params)
        else:
            other = lift(other, q_cls=self.__class__)
            syns.append(other.syn)
            params = Param.merge(self.params, other.params)
        syn = ApplySyntax("=", syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __ne__(self, other):
        syns = [self.syn]
        if not isinstance(other, str) and isinstance(other, Iterable):
            params = self.params
            for o in other:
                o = lift(o, q_cls=self.__class__)
                syns.append(o.syn)
                params = Param.merge(params.params, o.params)
        else:
            other = lift(other, q_cls=self.__class__)
            syns.append(other.syn)
            params = Param.merge(self.params, other.params)
        syn = ApplySyntax("!=", syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __and__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("&", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __or__(self, other):
        other = lift(other, q_cls=self.__class__)
        syn = ApplySyntax("|", [self.syn, other.syn])
        params = Param.merge(self.params, other.params)
        return self.__class__(db=self.db, syn=syn, params=params)

    def __invert__(self):
        syn = ApplySyntax("!", [self.syn])
        return self.__class__(db=self.db, syn=syn, params=self.params)

    def take(self, limit, offset=None):
        syns = [self.syn, LiteralSyntax(limit)]
        if offset is not None:
            syns.append(LiteralSyntax(offset))
        syn = ApplySyntax("take", syns)
        return self.__class__(db=self.db, syn=syn, params=self.params)

    def __str__(self):
        return str(self.syn)

    def __hash__(self):
        # It's ok to hash only syntax as self.params is only for a fast
        # access/merge.
        return hash((self.syn,))

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
                others = [lift(q, q_cls=self.__class__) for q in others]
            # SYNTAX: q.table.func(...)
            elif self.syn.op == ".":
                name = extract_navigate(self.syn.args[1])
                others = [lift(q, q_cls=self.__class__) for q in others]
                others.insert(
                    0,
                    self.__class__(
                        db=self.db, syn=self.syn.args[0], params={}
                    ),
                )
            else:
                raise Error("not a function")
        syns = []
        params = self.params
        for o in others:
            syns.append(o.syn)
            params = Param.merge(params, o.params)
        syn = ApplySyntax(name, syns)
        return self.__class__(db=self.db, syn=syn, params=params)

    def produce(self, variables=None, db=None):
        """ Execute query and return product.
        """
        db = db or self.db
        return produce(query=self, variables=variables, db=db)

    def to_copy_stream(self, variables=None, db=None, stream=None):
        """ Produce a stream with data in a format suitable for COPY."""
        db = db or self.db or get_db()
        # reconnect w/o rex_deploy extension which omits id, fk columns
        db = RexHTSQL(None, HTSQLVal.merge(db.htsql.db))

        with db:
            binding = bind(self, variables=variables)
            pipe = translate(binding, batch=True)
            product = pipe()(None)

            extract_node = BuildExtractNode.__invoke__(product.meta)
            extract_table = BuildExtractTable.__invoke__(
                extract_node.node, extract_node.arcs, with_cache=True
            )

        if extract_node.is_list:
            records = product.data
            record_domain = product.meta.domain.item_domain
        else:
            records = [product.data]
            record_domain = product.meta.domain

        if stream is None:
            stream = io.StringIO()

        def collect_copy(row):
            stream.write(
                "\t".join(
                    [
                        str(item)
                        .replace("\\", "\\\\")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t")
                        if item is not None
                        else "\\N"
                        for item in row
                    ]
                )
                + "\n"
            )

        for idx, record in enumerate(records):
            if record is None:
                continue
            try:
                collect_copy(extract_table(extract_node(record)))
            except Error as exc:
                if extract_node.is_list:
                    message = "While copying record #%s" % (idx + 1)
                else:
                    message = "While copying a record"
                quote = record_domain.dump(record)
                exc.wrap(message, quote)
                raise

        extract_node = None
        extract_table = None

        return stream

    def to_data(self, variables=None, db=None):
        """ Execute query and return data.
        """
        return self.produce(variables=variables, db=db).data


def lift(v, q_cls=Q):
    if isinstance(v, q_cls):
        return v
    if isinstance(v, Q):
        return q_cls(db=v.db, syn=v.syn, params=v.params)
    elif isinstance(v, Param):
        syn = ApplySyntax("var", [LiteralSyntax(v.name)])
        return q_cls(syn=syn, params={v.name: v})
    elif v is None:
        return q_cls(syn=LiteralSyntax(v))
    elif isinstance(v, (bool, int, str, float, Decimal, date)):
        return q_cls(syn=LiteralSyntax(v))
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


def produce(query, db=None, variables=None):
    """ Execute query."""
    if db is None:
        db = get_db()
    with db:
        binding = bind(query, variables=variables)
        pipe = translate(binding)
        product = pipe()(None)
    return product


q = Q()

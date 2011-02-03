#
# Copyright (c) 2006-2011, Prometheus Research, LLC
# Authors: Clark C. Evans <cce@clarkevans.com>,
#          Kirill Simonov <xi@resolvent.net>
#


"""
:mod:`htsql.tr.binding`
=======================

This module declares binding nodes.
"""


from ..util import maybe, listof, Clonable, Printable
from ..entity import TableEntity, ColumnEntity, Join
from ..domain import Domain, VoidDomain, BooleanDomain, TupleDomain
from .syntax import Syntax
from .signature import Signature, Bag, Formula


class Binding(Clonable, Printable):
    """
    Represents a binding node.

    This is an abstract class; see subclasses for concrete binding nodes.

    A binding tree (technically, a DAG) is an intermediate stage of the HTSQL
    translator.  A binding tree is translated from the syntax tree by the
    *binding* process.  A binding tree is translated to a code tree by the
    *encoding* process.

    The following adapters are associated with the binding process and generate
    new binding nodes::

        Bind: (Syntax, BindingState) -> Binding, ...
        Lookup: (Binding, IdentifierSyntax) -> Binding

    See :class:`htsql.tr.bind.Bind` and :class:`htsql.tr.lookup.Lookup` for
    more details.

    The following adapters are associated with the encoding process and
    convert binding nodes to code and space nodes::

        Encode: (Binding, EncodingState) -> Code
        Relate: (Binding, EncodingState) -> Space

    See :class:`htsql.tr.encode.Encode` and :class:`htsql.tr.encode.Relate`
    for more details.

    The constructor arguments:

    `domain` (:class:`htsql.domain.Domain`)
        The type of the binding node; use :class:`htsql.domain.VoidDomain`
        instance when not applicable.

    `syntax` (:class:`htsql.tr.syntax.Syntax`)
        The syntax node that generated the binding node; should be used
        for presentation or error reporting only, there is no guarantee
        that that the syntax node is semantically, or even syntaxically
        valid.

    Other attributes:

    `mark` (:class:`htsql.mark.Mark`)
        The location of the node in the original query (for error reporting).
    """

    def __init__(self, domain, syntax):
        assert isinstance(domain, Domain)
        assert isinstance(syntax, Syntax)

        self.domain = domain
        self.syntax = syntax
        self.mark = syntax.mark

    def __str__(self):
        # Display an HTSQL expression (approximately) corresponding
        # to the binding node.
        return str(self.syntax)


class QueryBinding(Binding):
    """
    Represents the whole HTSQL query.

    `root` (:class:`RootBinding`)
        The root binding associated with the query.

    `segment` (:class:`SegmentBinding` or ``None``)
        The query segment.
    """

    def __init__(self, root, segment, syntax):
        assert isinstance(root, RootBinding)
        assert isinstance(segment, maybe(SegmentBinding))
        super(QueryBinding, self).__init__(VoidDomain(), syntax)
        self.root = root
        self.segment = segment


class SegmentBinding(Binding):
    """
    Represents a segment of an HTSQL query.

    `base` (:class:`Binding`)
        The base of the segment.

    `elements` (a list of :class:`Binding`)
        The segment elements.
    """

    def __init__(self, base, elements, syntax):
        assert isinstance(base, Binding)
        assert isinstance(elements, listof(Binding))
        super(SegmentBinding, self).__init__(VoidDomain(), syntax)
        self.base = base
        self.elements = elements


class ChainBinding(Binding):
    """
    Represents a link binding node.

    Each link binding has an associated `base` parent node.  The base node
    specifies the context of the node; the meaning of the context depends
    on the concrete binding type.
    
    Chain bindings together with their bases form a subtree (or a forest)
    in the binding graph.

    Chain bindings are typically (but not always) generated by the lookup
    adapter; that is, `Lookup` applied to a base node generates a link
    binding with the given base.

    Chaing bindings are often expected to correspond to some space nodes;
    therefore they should have a non-trivial implementation of the `Relate`
    adapter.

    Constructor arguments:

    `base` (:class:`Binding`)
        The link context.
    """

    def __init__(self, base, domain, syntax):
        assert isinstance(base, Binding)
        super(ChainBinding, self).__init__(domain, syntax)
        self.base = base


class RootBinding(ChainBinding):
    """
    Represents a root link binding.

    The root binding represents a scalar context in the binding tree.
    `Lookup` over a root binding is a table lookup; `Relate` over
    a root binding produces the scalar space.

    For a root link binding, the `base` refers to the binding itself.
    """

    def __init__(self, syntax):
        # Note: `self.base is self` for the root binding.
        super(RootBinding, self).__init__(self, VoidDomain(), syntax)


class TableBinding(ChainBinding):
    """
    Represents a table link binding.

    This is an abstract class; see :class:`FreeTableBinding` and
    :class:`AttachedTableBinding` for concrete subclasses.

    A table binding represents a table context; `Lookup` over a table
    binding looks for columns and links; `Relate` over a table binding
    produces a table space.

    Note that a table binding has a special domain
    :class:`htsql.domain.TupleDomain`.

    `table` (:class:`htsql.entity.TableEntity`)
        The table which the binding is associated with.
    """

    def __init__(self, base, table, syntax):
        assert isinstance(table, TableEntity)
        super(TableBinding, self).__init__(base, TupleDomain(), syntax)
        self.table = table


class FreeTableBinding(TableBinding):
    """
    Represents a free table binding.

    A free table represents a table cross joined to its base.
    """


class AttachedTableBinding(TableBinding):
    """
    Represents an attached table binding.

    An attached table is attached to its base using a sequence of joins.

    `joins` (a list of :class:`htsql.entity.Join`)
        A sequence of joins that attach the table to its base.
    """

    def __init__(self, base, table, joins, syntax):
        assert isinstance(joins, listof(Join)) and len(joins) > 0
        super(AttachedTableBinding, self).__init__(base, table, syntax)
        self.joins = joins


class SieveBinding(ChainBinding):
    """
    Represents a sieve binding.

    A sieve applies a filter to the base binding.

    `filter` (:class:`Binding`)
        A Boolean expression that filters the base.
    """

    def __init__(self, base, filter, syntax):
        assert isinstance(filter, Binding)
        assert isinstance(filter.domain, BooleanDomain)
        super(SieveBinding, self).__init__(base, TupleDomain(), syntax)
        self.filter = filter


class SortBinding(ChainBinding):
    """
    Represents a sort table expression.

    A sort binding specifies the order of the `base` rows.  It could also
    extract a subset of the rows.

    `order` (a list of :class:`Binding`)
        The expressions by which the base rows are sorted.

    `limit` (an integer or ``None``)
        If set, indicates that only the first `limit` rows are produced
        (``None`` means no limit).

    `offset` (an integer or ``None``)
        If set, indicates that only the rows starting from `offset`-th
        are produced (``None`` means ``0``).
    """

    def __init__(self, base, order, limit, offset, syntax):
        assert isinstance(order, listof(Binding))
        assert isinstance(limit, maybe(int))
        assert isinstance(offset, maybe(int))
        super(SortBinding, self).__init__(base, base.domain, syntax)
        self.order = order
        self.limit = limit
        self.offset = offset


class ColumnBinding(ChainBinding):
    """
    Represents a table column.

    `column` (:class:`htsql.entity.ColumnEntity`)
        The column entity.

    `link` (:class:`AttachedTableBinding` or ``None``)
        If set, indicates that the binding could also represent a link
        to another table.  Any `Lookup` or `Relate` requests applied
        to the column binding are delegated to `link`.
    """

    def __init__(self, base, column, link, syntax):
        assert isinstance(column, ColumnEntity)
        assert isinstance(link, maybe(AttachedTableBinding))
        super(ColumnBinding, self).__init__(base, column.domain, syntax)
        self.column = column
        # FIXME: this is a hack to permit reparenting of a column binding.
        # It is used when `Lookup` delegates the request to a base binding
        # and then reparents the result.  Fixing this may require passing
        # the expected base together with any `Lookup` request.
        if link is not None and link.base is not base:
            link = link.clone(base=base)
        self.link = link


class QuotientBinding(ChainBinding):

    def __init__(self, base, seed, kernel, syntax):
        assert isinstance(seed, Binding)
        assert isinstance(kernel, listof(Binding))
        super(QuotientBinding, self).__init__(base, TupleDomain(), syntax)
        self.seed = seed
        self.kernel = kernel


class ComplementBinding(ChainBinding):

    def __init__(self, base, seed, syntax):
        assert isinstance(seed, Binding)
        super(ComplementBinding, self).__init__(base, seed.domain, syntax)
        self.seed = seed


class KernelBinding(ChainBinding):

    def __init__(self, base, index, domain, syntax):
        assert isinstance(index, int) and index >= 0
        super(KernelBinding, self).__init__(base, domain, syntax)
        self.index = index


class LiteralBinding(Binding):
    """
    Represents a literal value.

    `value` (valid type depends on the domain)
        The value.

    `domain` (:class:`htsql.domain.Domain`)
        The value type.
    """

    def __init__(self, value, domain, syntax):
        super(LiteralBinding, self).__init__(domain, syntax)
        self.value = value


class CastBinding(Binding):
    """
    Represents a type conversion operator.

    `base` (:class:`Binding`)
        The expression to convert.

    `domain` (:class:`htsql.domain.Domain`)
        The target domain.
    """

    def __init__(self, base, domain, syntax):
        super(CastBinding, self).__init__(domain, syntax)
        self.base = base


class FormulaBinding(Formula, Binding):
    """
    Represents a formula binding.

    A formula binding represents a function or an operator call as
    as a binding node.

    `signature` (:class:`htsql.tr.signature.Signature`)
        The signature of the formula.

    `domain` (:class:`Domain`)
        The co-domain of the formula.

    `arguments` (a dictionary)
        The arguments of the formula.

        Note that all the arguments become attributes of the node object.
    """

    def __init__(self, signature, domain, syntax, **arguments):
        assert isinstance(signature, Signature)
        # Check that the arguments match the formula signature.
        arguments = Bag(**arguments)
        assert arguments.admits(Binding, signature)
        # This will impress the arguments to the node.
        super(FormulaBinding, self).__init__(signature, arguments,
                                             domain, syntax)


class WrapperBinding(Binding):
    """
    Represents a decorating binding.

    This class has several subclasses, but could also be used directly
    when the only purpose of decorating is attaching a different syntax node.

    A decorating binding adds extra attributes to the base binding,
    but does not affect the encoding or lookup operations.

    `base` (:class:`Binding`)
        The decorated binding.
    """

    def __init__(self, base, syntax):
        super(WrapperBinding, self).__init__(base.domain, syntax)
        self.base = base


class DirectionBinding(WrapperBinding):
    """
    Represents a direction decorator (postfix ``+`` and ``-`` operators).

    `base` (:class:`Binding`)
        The decorated binding.

    `direction` (``+1`` or ``-1``).
        Indicates the direction; ``+1`` for ascending, ``-1`` for descending.
    """

    def __init__(self, base, direction, syntax):
        assert direction in [+1, -1]
        super(DirectionBinding, self).__init__(base, syntax)
        self.direction = direction


class TitleBinding(WrapperBinding):
    """
    Represents a title decorator (the ``as`` operator).

    The title decorator is used to specify the column title explicitly
    (by default, a serialized syntax node is used as the title).

    `base` (:class:`Binding`)
        The decorated binding.

    `title` (a string)
        The title.
    """

    def __init__(self, base, title, syntax):
        assert isinstance(title, str)
        super(TitleBinding, self).__init__(base, syntax)
        self.title = title


class FormatBinding(WrapperBinding):
    """
    Represents a format decorator (the ``format`` operator).

    The format decorator is used to provide hints to the renderer
    as to how display column values.  How the format is interpreted
    by the renderer depends on the renderer and the type of the column.

    `base` (:class:`Binding`)
        The decorated binding.

    `format` (a string)
        The formatting hint.
    """

    # FIXME: currently unused.

    def __init__(self, base, format, syntax):
        assert isinstance(format, str)
        super(FormatBinding, self).__init__(base, syntax)
        self.format = format



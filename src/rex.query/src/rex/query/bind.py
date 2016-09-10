#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Error
from .query import Query, ApplySyntax, LiteralSyntax
from htsql.core.domain import ListDomain
from htsql.core.syn.syntax import VoidSyntax
from htsql.core.cmd.embed import Embed
from htsql.core.tr.binding import (
        RootBinding, LiteralBinding, TableBinding, CollectBinding)
from htsql.core.tr.bind import BindingState, Select
from htsql.core.tr.lookup import lookup_attribute, unwrap


class RexBindingState(BindingState):

    def __init__(self):
        super(RexBindingState, self).__init__(RootBinding(VoidSyntax()))

    symbol_ops = {
            u'.': u'compose',
            u'+': u'add',
            u'-': u'subtract',
            u'*': u'multiply',
            u'/': u'divide',
            u'!': u'not',
            u'&': u'and',
            u'|': u'or',
            u'=': u'equal',
            u'!=': u'not_equal',
            u'<': u'less',
            u'<=': u'less_or_equal',
            u'>': u'greater',
            u'>=': u'greater_or_equal',
            u'~': u'contains',
    }

    def __call__(self, syntax):
        if isinstance(syntax, Query):
            return self.bind_query(syntax)
        elif isinstance(syntax, LiteralSyntax):
            return self.bind_literal(syntax.val)
        else:
            op = self.symbol_ops.get(syntax.op, syntax.op)
            method = getattr(self, 'bind_%s_op' % op, None)
            if method is None:
                raise Error("Got undefined operation:", syntax.op)
            return method(syntax.args)

    def bind_query(self, query):
        binding = self(query.syntax)
        binding = Select.__invoke__(binding, self)
        scope = binding
        while not isinstance(scope, RootBinding):
            if isinstance(scope, TableBinding):
                binding = CollectBinding(
                        self.scope, binding,
                        ListDomain(binding.domain), self.scope.syntax)
                break
            scope = scope.base
        return binding

    def bind_literal(self, value):
        try:
            value = Embed.__invoke__(value)
        except TypeError:
            raise Error("Got invalid literal value:", value)
        return LiteralBinding(
                self.scope, value.data, value.domain, self.scope.syntax)

    def bind_navigate_op(self, args):
        if not (len(args) == 1 and
                isinstance(args[0], LiteralSyntax) and
                isinstance(args[0].val, unicode)):
            raise Error("Expected an identifier,"
                        " got:", ", ".join(map(str, args)))
        name = args[0].val
        recipe = lookup_attribute(self.scope, name)
        if recipe is None:
            raise Error("Got unknown identifier:", name)
        binding = self.use(recipe, self.scope.syntax)
        return binding

    def bind_compose_op(self, args):
        if not (len(args) == 2):
            raise Error("Expected two arguments,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        self.push_scope(binding)
        binding = self(args[1])
        self.pop_scope()
        return binding


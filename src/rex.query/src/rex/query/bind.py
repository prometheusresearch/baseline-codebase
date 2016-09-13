#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Error, guard
from .query import Query, ApplySyntax, LiteralSyntax
from htsql.core.domain import (
        UntypedDomain, BooleanDomain, TextDomain, IntegerDomain, DecimalDomain,
        FloatDomain, DateDomain,TimeDomain, DateTimeDomain, ListDomain,
        RecordDomain)
from htsql.core.syn.syntax import VoidSyntax, IdentifierSyntax
from htsql.core.cmd.embed import Embed
from htsql.core.tr.binding import (
        RootBinding, LiteralBinding, TableBinding, ChainBinding,
        CollectBinding, SelectionBinding, SieveBinding, DefineBinding,
        SortBinding, QuotientBinding, ComplementBinding, TitleBinding,
        DirectionBinding, FormulaBinding, CastBinding, ImplicitCastBinding,
        BindingRecipe, KernelRecipe, ComplementRecipe, ClosedRecipe)
from htsql.core.tr.bind import BindingState, Select
from htsql.core.tr.lookup import lookup_attribute, unwrap, guess_tag
from htsql.core.tr.decorate import decorate
from htsql.core.tr.coerce import coerce
from htsql.core.tr.signature import IsEqualSig, IsAmongSig, CompareSig
from htsql.core.tr.fn.bind import Correlate, Comparable
from htsql.core.tr.fn.signature import (
        AddSig, SubtractSig, MultiplySig, DivideSig, ContainsSig, CastSig,
        AggregateSig, QuantifySig, ExistsSig, CountSig, MinMaxSig, SumSig,
        AvgSig)


class RexBindingState(BindingState):

    def __init__(self):
        super(RexBindingState, self).__init__(RootBinding(VoidSyntax()))

    symbol_ops = {
            u'.': u'compose',
            u'=>': u'let',
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
                if not syntax.args and \
                        lookup_attribute(self.scope, op) is not None:
                    return self.bind_navigate_op([LiteralSyntax(op)])
                raise Error("Got undefined operation:", syntax.op)
            with guard("While processing:", syntax.op):
                return method(syntax.args)

    def bind_query(self, query):
        binding = self(query.syntax)
        binding = Select.__invoke__(binding, self)
        binding = self.collect(binding)
        return binding

    def collect(self, binding, stop=None):
        scope = binding
        while not isinstance(scope, RootBinding):
            if scope is stop:
                break
            if isinstance(
                    scope, (TableBinding, QuotientBinding, ComplementBinding)):
                if not (isinstance(scope, ChainBinding) and
                        all([join.is_contracting for join in scope.joins])):
                    binding = Select.__invoke__(binding, self)
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
        syntax = IdentifierSyntax(name)
        binding = self.use(recipe, syntax)
        return binding

    def bind_compose_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        for arg in args[1:]:
            self.push_scope(binding)
            binding = self(arg)
            self.pop_scope()
        return binding

    def bind_select_op(self, args):
        if not (len(args) >= 1):
            raise Error("Expected at least one argument,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        fields = []
        self.push_scope(binding)
        for arg in args[1:]:
            field = self.collect(self(arg), binding)
            fields.append(field)
        self.pop_scope()
        domain = RecordDomain([decorate(field) for field in fields])
        return SelectionBinding(binding, fields, domain, self.scope.syntax)

    def bind_filter_op(self, args):
        if not (len(args) == 2):
            raise Error("Expected two arguments,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        self.push_scope(binding)
        predicate = self(args[1])
        self.pop_scope()
        predicate = ImplicitCastBinding(
                predicate, BooleanDomain(), predicate.syntax)
        return SieveBinding(binding, predicate, self.scope.syntax)

    def bind_define_op(self, args):
        if not (len(args) >= 1):
            raise Error("Expected at least one argument,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        for arg in args[1:]:
            self.push_scope(binding)
            definition = self(arg)
            self.pop_scope()
            tag = guess_tag(definition)
            if tag is None:
                raise Error("Expected a definition:",
                            " got:", ", ".join(map(str, args)))
            recipe = ClosedRecipe(BindingRecipe(definition))
            binding = DefineBinding(
                    binding, tag, None, recipe, self.scope.syntax)
        return binding

    def bind_sort_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        fields = []
        self.push_scope(binding)
        for arg in args[1:]:
            field = self(arg)
            fields.append(field)
        self.pop_scope()
        return SortBinding(binding, fields, None, None, self.scope.syntax)

    def bind_group_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        seed = self(args[0])
        fields = []
        self.push_scope(seed)
        for arg in args[1:]:
            field = self(arg)
            fields.append(field)
        self.pop_scope()
        quotient = QuotientBinding(
                self.scope, seed, fields, self.scope.syntax)
        binding = quotient
        name = guess_tag(seed)
        if name is not None:
            recipe = ComplementRecipe(quotient)
            recipe = ClosedRecipe(recipe)
            binding = DefineBinding(
                    binding, name, None, recipe, binding.syntax)
        for index, field in enumerate(fields):
            name = guess_tag(field)
            if name is not None:
                recipe = KernelRecipe(quotient, index)
                recipe = ClosedRecipe(recipe)
                binding = DefineBinding(
                        binding, name, None, recipe, binding.syntax)
        return binding

    def bind_let_op(self, args):
        if not (len(args) == 2 and
                isinstance(args[0], LiteralSyntax) and
                isinstance(args[0].val, unicode)):
            raise Error("Expected an identifier and an argument,"
                        " got:", ", ".join(map(str, args)))
        name = args[0].val
        binding = self(args[1])
        syntax = IdentifierSyntax(name)
        return TitleBinding(binding, syntax, syntax)

    def bind_asc_op(self, args):
        if not (len(args) == 1):
            raise Error("Expected one argument,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        return DirectionBinding(binding, +1, self.scope.syntax)

    def bind_desc_op(self, args):
        if not (len(args) == 1):
            raise Error("Expected one argument,"
                        " got:", ", ".join(map(str, args)))
        binding = self(args[0])
        return DirectionBinding(binding, -1, self.scope.syntax)

    def bind_add_op(self, args):
        return self.bind_poly(AddSig, args)

    def bind_subtract_op(self, args):
        return self.bind_poly(SubtractSig, args)

    def bind_multiply_op(self, args):
        return self.bind_poly(MultiplySig, args)

    def bind_divide_op(self, args):
        return self.bind_poly(DivideSig, args)

    def bind_contains_op(self, args):
        return self.bind_poly(ContainsSig(+1), args)

    def bind_equal_op(self, args):
        parameters = self.bind_parameters(IsAmongSig, args)
        return self.bind_among(+1, **parameters)

    def bind_not_equal_op(self, args):
        parameters = self.bind_parameters(IsAmongSig, args)
        return self.bind_among(-1, **parameters)

    bind_in_op = bind_equal_op

    bind_not_in_op = bind_not_equal_op

    def bind_less_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare(u'<', **parameters)

    def bind_less_or_equal_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare(u'<=', **parameters)

    def bind_greater_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare(u'>', **parameters)

    def bind_greater_or_equal_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare(u'>=', **parameters)

    def bind_boolean_op(self, args):
        return self.bind_cast(BooleanDomain(), args)

    def bind_text_op(self, args):
        return self.bind_cast(TextDomain(), args)

    def bind_integer_op(self, args):
        return self.bind_cast(IntegerDomain(), args)

    def bind_decimal_op(self, args):
        return self.bind_cast(DecimalDomain(), args)

    def bind_float_op(self, args):
        return self.bind_cast(FloatDomain(), args)

    def bind_date_op(self, args):
        return self.bind_cast(DateDomain(), args)

    def bind_time_op(self, args):
        return self.bind_cast(TimeDomain(), args)

    def bind_datetime_op(self, args):
        return self.bind_cast(DateTimeDomain(), args)

    def bind_exists_op(self, args):
        parameters = self.bind_parameters(ExistsSig, args)
        binding = parameters['op']
        binding = ImplicitCastBinding(
                binding, BooleanDomain(), self.scope.syntax)
        return FormulaBinding(
                self.scope, QuantifySig(+1), binding.domain,
                self.scope.syntax, plural_base=None, op=binding)

    def bind_count_op(self, args):
        parameters = self.bind_parameters(ExistsSig, args)
        binding = parameters['op']
        binding = ImplicitCastBinding(
                binding, BooleanDomain(), self.scope.syntax)
        binding = FormulaBinding(
                self.scope, CountSig(), IntegerDomain(),
                self.scope.syntax, op=binding)
        return FormulaBinding(
                self.scope, AggregateSig(), binding.domain,
                self.scope.syntax, plural_base=None, op=binding)

    def bind_min_op(self, args):
        return self.bind_poly_aggregate(MinMaxSig(+1), args)

    def bind_max_op(self, args):
        return self.bind_poly_aggregate(MinMaxSig(-1), args)

    def bind_sum_op(self, args):
        return self.bind_poly_aggregate(SumSig, args)

    def bind_mean_op(self, args):
        return self.bind_poly_aggregate(AvgSig, args)

    def bind_among(self, polarity, lop, rops):
        if not rops:
            return self.bind_among(-polarity, lop, [lop])
        domains = [lop.domain] + [rop.domain for rop in rops]
        domain = coerce(*domains)
        if domain is None:
            raise Error("Detected arguments of unexpected types")
        lop = ImplicitCastBinding(lop, domain, lop.syntax)
        rops = [ImplicitCastBinding(rop, domain, rop.syntax) for rop in rops]
        if len(rops) == 1:
            return FormulaBinding(
                    self.scope, IsEqualSig(polarity),
                    BooleanDomain(), self.scope.syntax,
                    lop=lop, rop=rops[0])
        else:
            return FormulaBinding(
                    self.scope, IsAmongSig(polarity),
                    BooleanDomain(), self.scope.syntax,
                    lop=lop, rops=rops)

    def bind_compare(self, relation, lop, rop):
        domain = coerce(lop.domain, rop.domain)
        if domain is None:
            raise Error("Detected arguments of unexpected types")
        lop = ImplicitCastBinding(lop, domain, lop.syntax)
        rop = ImplicitCastBinding(rop, domain, rop.syntax)
        is_comparable = Comparable.__invoke__(domain)
        if not is_comparable:
            raise Error("Detected non-comparable type:", domain)
        return FormulaBinding(
                self.scope, CompareSig(relation), BooleanDomain(),
                self.scope.syntax, lop=lop, rop=rop)

    def bind_poly(self, signature, args):
        if isinstance(signature, type):
            signature = signature()
        parameters = self.bind_parameters(signature, args)
        binding = FormulaBinding(
                self.scope, signature, UntypedDomain(),
                self.scope.syntax, **parameters)
        return Correlate.__invoke__(binding, self)

    def bind_poly_aggregate(self, signature, args):
        if isinstance(signature, type):
            signature = signature()
        parameters = self.bind_parameters(signature, args)
        binding = parameters['op']
        binding = FormulaBinding(
                self.scope, signature, UntypedDomain(),
                self.scope.syntax, op=binding)
        binding = Correlate.__invoke__(binding, self)
        return FormulaBinding(
                self.scope, AggregateSig(), binding.domain,
                self.scope.syntax, plural_base=None, op=binding)

    def bind_cast(self, domain, args):
        parameters = self.bind_parameters(CastSig, args)
        return CastBinding(
                domain=domain, syntax=self.scope.syntax, **parameters)

    def bind_parameters(self, signature, args):
        stack = args[:]
        parameters = {}
        for slot in signature.slots:
            value = None if slot.is_singular else []
            if not stack:
                if slot.is_mandatory:
                    raise Error("Got too few arguments:",
                                ", ".join(map(str, args)))
            else:
                if slot.is_singular:
                    value = self(stack.pop(0))
                else:
                    value = [self(arg) for arg in stack]
                    del stack[:]
            parameters[slot.name] = value
        if stack:
            raise Error("Got too many arguments:", ", ".join(map(str, args)))
        return parameters



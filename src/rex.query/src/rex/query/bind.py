#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Error, guard
from .query import Query, ApplySyntax, LiteralSyntax
from htsql.core.adapter import adapt
from htsql.core.util import to_name
from htsql.core.domain import (
        UntypedDomain, BooleanDomain, TextDomain, IntegerDomain, DecimalDomain,
        FloatDomain, DateDomain,TimeDomain, DateTimeDomain, ListDomain,
        RecordDomain, EntityDomain, IdentityDomain)
from htsql.core.syn.syntax import (
        VoidSyntax, StringSyntax, IntegerSyntax, DecimalSyntax, FloatSyntax,
        IdentifierSyntax, CollectSyntax, ComposeSyntax, SelectSyntax,
        RecordSyntax, AssignSyntax, SpecifySyntax, FunctionSyntax,
        FilterSyntax, OperatorSyntax, PrefixSyntax, DirectSyntax, GroupSyntax,
        ProjectSyntax)
from htsql.core.cmd.embed import Embed
from htsql.core.tr.binding import (
        RootBinding, LiteralBinding, TableBinding, ChainBinding,
        CollectBinding, SieveBinding, DefineBinding, IdentityBinding,
        SortBinding, QuotientBinding, ComplementBinding, ClipBinding,
        TitleBinding, DirectionBinding, FormulaBinding, CastBinding,
        ImplicitCastBinding, WrappingBinding, RerouteBinding, FreeTableRecipe,
        AttachedTableRecipe, ColumnRecipe, KernelRecipe, ComplementRecipe,
        ClosedRecipe)
from htsql.core.tr.bind import BindingState, Select, BindByRecipe
from htsql.core.tr.lookup import (
        lookup_attribute, unwrap, guess_tag, identify, expand, direct)
from htsql.core.tr.decorate import decorate
from htsql.core.tr.coerce import coerce
from htsql.core.tr.signature import (
        IsEqualSig, IsAmongSig, CompareSig, AndSig, OrSig, NotSig, IsNullSig)
from htsql.core.tr.fn.bind import Correlate, Comparable, BindAmong, BindNotAmong
from htsql.core.tr.fn.signature import (
        AddSig, SubtractSig, MultiplySig, DivideSig, ContainsSig, CastSig,
        AggregateSig, QuantifySig, ExistsSig, CountSig, MinMaxSig, SumSig,
        AvgSig, ExtractYearSig, ExtractMonthSig, ExtractDaySig, ExtractHourSig,
        ExtractMinuteSig, ExtractSecondSig)
from htsql_rex_query import (
        SelectionBinding, BindingRecipe, DefinitionRecipe, SelectSyntaxRecipe)
import decimal


class Output(object):

    __slots__  = ('binding', 'domain', 'syntax', 'optional', 'plural')

    def __init__(self, binding, optional=False, plural=False):
        self.binding = binding
        self.domain = binding.domain
        self.syntax = binding.syntax
        self.optional = optional
        self.plural = plural


class RexBindingState(BindingState):

    def __init__(self):
        super(RexBindingState, self).__init__(RootBinding(VoidSyntax()))
        self.enable_let_syntax = False
        self.enable_let_syntax_stack = []

    def push_enable_let_syntax(self, enable):
        self.enable_let_syntax_stack.append(self.enable_let_syntax)
        self.enable_let_syntax = enable

    def pop_enable_let_syntax(self):
        self.enable_let_syntax = self.enable_let_syntax_stack.pop()

    symbol_ops = {
            '.': 'compose',
            '=>': 'let',
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide',
            '!': 'not',
            '&': 'and',
            '|': 'or',
            '=': 'equal',
            '!=': 'not_equal',
            '<': 'less',
            '<=': 'less_or_equal',
            '>': 'greater',
            '>=': 'greater_or_equal',
            '~': 'contains',
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
        output = self(query.syntax)
        binding = self.collect(output)
        return binding

    def collect(self, output):
        binding = Select.__invoke__(output.binding, self)
        if output.plural:
            syntax = CollectSyntax(binding.syntax)
            binding = CollectBinding(
                    self.scope, binding,
                    ListDomain(binding.domain), syntax)
        return binding

    def bind_literal(self, value):
        try:
            value = Embed.__invoke__(value)
        except TypeError:
            raise Error("Got invalid literal value:", value)
        syntax = VoidSyntax()
        if value.data is None:
            syntax = IdentifierSyntax("null")
        elif isinstance(value.data, str):
            syntax = StringSyntax(value.data)
        elif isinstance(value.data, bool):
            syntax = IdentifierSyntax(str(value.data).lower())
        elif isinstance(value.data, int):
            syntax = IntegerSyntax(str(value))
        elif isinstance(value.data, decimal.Decimal):
            syntax = DecimalSyntax(str(value))
        elif isinstance(value.data, float):
            syntax = FloatSyntax(str(value))
        return Output(
                LiteralBinding(
                    self.scope, value.data, value.domain, syntax),
                optional=(value is None))

    def bind_here_op(self, args):
        if not (len(args) == 0):
            raise Error("Expected no arguments,"
                        " got:", ", ".join(map(str, args)))
        binding = self.scope
        if isinstance(binding, RerouteBinding):
            binding = binding.target
        return Output(binding)

    def bind_navigate_op(self, args):
        if not (len(args) == 1 and
                isinstance(args[0], LiteralSyntax) and
                isinstance(args[0].val, str)):
            raise Error("Expected an identifier,"
                        " got:", ", ".join(map(str, args)))
        name = args[0].val
        if name == 'id':
            return self.bind_id_op([])
        recipe = lookup_attribute(self.scope, name)
        if recipe is None:
            raise Error("Got unknown identifier:", name)
        syntax = IdentifierSyntax(to_name(name))
        binding = self.use(recipe, syntax)
        optional = False
        plural = False
        if isinstance(recipe, ClosedRecipe):
            recipe = recipe.recipe
        if isinstance(recipe, FreeTableRecipe):
            optional = plural = True
        elif isinstance(recipe, AttachedTableRecipe):
            for join in recipe.joins:
                if not join.is_expanding:
                    optional = True
                if not join.is_contracting:
                    plural = True
        elif isinstance(recipe, ColumnRecipe):
            optional = recipe.column.is_nullable
        elif isinstance(recipe, (BindingRecipe, DefinitionRecipe)):
            optional = recipe.optional
            plural = recipe.plural
        elif isinstance(recipe, ComplementRecipe):
            plural = True
        return Output(binding, optional=optional, plural=plural)

    def bind_compose_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        output = self(args[0])
        binding = output.binding
        optional = output.optional
        plural = output.plural
        syntax = binding.syntax
        for arg in args[1:]:
            self.push_scope(binding)
            output = self(arg)
            binding = output.binding
            optional = optional or output.optional
            plural = plural or output.plural
            syntax = ComposeSyntax(syntax, binding.syntax)
            self.pop_scope()
        binding = WrappingBinding(binding, syntax)
        return Output(binding, optional=optional, plural=plural)

    def bind_select_op(self, args):
        if not (len(args) >= 1):
            raise Error("Expected at least one argument,"
                        " got:", ", ".join(map(str, args)))
        output = self(args[0])
        recipes = []
        fields = []
        binding = output.binding
        larm = binding.syntax
        rarms = []
        for arg in args[1:]:
            self.push_scope(binding)
            selection = self(arg)
            field = self.collect(selection)
            self.pop_scope()
            fields.append(field)
            recipe = SelectSyntaxRecipe(
                    binding, arg,
                    optional=selection.optional,
                    plural=selection.plural)
            recipes.append(recipe)
            tag = guess_tag(selection.binding)
            if tag is not None:
                recipe = DefinitionRecipe(
                        binding, arg,
                        optional=selection.optional,
                        plural=selection.plural)
                recipe = ClosedRecipe(recipe)
                binding = DefineBinding(
                        binding, tag, None, recipe, binding.syntax)
            rarms.append(field.syntax)
        domain = RecordDomain([decorate(field) for field in fields])
        syntax = SelectSyntax(larm, RecordSyntax(rarms))
        return Output(
                SelectionBinding(
                    binding, recipes, fields, domain, syntax),
                optional=output.optional, plural=output.plural)

    def bind_filter_op(self, args):
        if not (len(args) == 2):
            raise Error("Expected two arguments,"
                        " got:", ", ".join(map(str, args)))
        base = self(args[0])
        if not base.plural:
            raise Error("Expected a plural expression, got:", args[0])
        self.push_scope(base.binding)
        output = self(args[1])
        if output.plural:
            raise Error("Expected a singular expression, got:", args[1])
        self.pop_scope()
        predicate = ImplicitCastBinding(
                output.binding, BooleanDomain(), output.binding.syntax)
        syntax = ComposeSyntax(
                base.binding.syntax,
                FunctionSyntax(
                    IdentifierSyntax("filter"),
                    [predicate.syntax]))
        binding = SieveBinding(base.binding, predicate, syntax)
        return Output(binding, optional=True, plural=True)

    def bind_define_op(self, args):
        if not (len(args) >= 1):
            raise Error("Expected at least one argument,"
                        " got:", ", ".join(map(str, args)))
        base = self(args[0])
        binding = base.binding
        arms = []
        for arg in args[1:]:
            self.push_scope(binding)
            definition = self(arg)
            arms.append(definition.binding.syntax)
            self.pop_scope()
            tag = guess_tag(definition.binding)
            if tag is None:
                raise Error("Expected a definition:",
                            " got:", ", ".join(map(str, args)))
            recipe = DefinitionRecipe(
                    binding, arg,
                    optional=definition.optional,
                    plural=definition.plural)
            #recipe = ClosedRecipe(recipe)
            #syntax = FunctionSyntax(IdentifierSyntax(u"define"), arms)
            #if not isinstance(base.binding.syntax, VoidSyntax):
            #    syntax = ComposeSyntax(base.binding.syntax, syntax)
            syntax = base.binding.syntax
            binding = DefineBinding(
                    binding, tag, None, recipe, syntax)
        return Output(binding, optional=base.optional, plural=base.plural)

    def bind_sort_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        base = self(args[0])
        if not base.plural:
            raise Error("Expected a plural expression, got:", args[0])
        fields = []
        self.push_scope(base.binding)
        for arg in args[1:]:
            output = self(arg)
            if output.plural:
                raise Error("Expected a singular expression, got:", arg)
            recipe = identify(output.binding)
            if recipe is not None:
                binding = self.use(
                        recipe,
                        output.binding.syntax,
                        scope=output.binding)
            else:
                binding = output.binding
            if isinstance(binding, IdentityBinding):
                stack = [binding]
                order = direct(output.binding)
                while stack:
                    binding = stack.pop()
                    if isinstance(binding, IdentityBinding):
                        stack.extend(reversed(binding.elements))
                    else:
                        if order is not None:
                            binding = DirectionBinding(
                                    binding, order, binding.syntax)
                        fields.append(binding)
            else:
                fields.append(output.binding)
        self.pop_scope()
        syntax = ComposeSyntax(
                base.binding.syntax,
                FunctionSyntax(
                    IdentifierSyntax("sort"),
                    [field.syntax for field in fields]))
        return Output(
                SortBinding(base.binding, fields, None, None, syntax),
                optional=base.optional,
                plural=base.plural)

    def bind_take_op(self, args):
        if not (len(args) == 2):
            raise Error("Expected two arguments,"
                        " got:", ", ".join(map(str, args)))
        base = self(args[0])
        if not base.plural:
            raise Error("Expected a plural expression, got:", args[0])
        if not (isinstance(args[1], LiteralSyntax) and
                isinstance(args[1].val, int)):
            raise Error("Expected an integer literal, got:", args[1])
        limit = args[1].val
        syntax = ComposeSyntax(
                base.binding.syntax,
                FunctionSyntax(
                    IdentifierSyntax("limit"),
                    [IntegerSyntax(str(limit))]))
        binding = ClipBinding(
                self.scope, base.binding, [],
                limit, None, syntax)
        if isinstance(base.binding.domain, RecordDomain):
            syntax_recipes = expand(
                    base.binding,
                    with_syntax=True, with_wild=True, with_class=True)
            if syntax_recipes is not None:
                elements = []
                recipes = []
                for syntax, recipe in syntax_recipes:
                    recipes.append(recipe)
                    element = self.use(recipe, syntax, scope=binding)
                    elements.append(element)
                fields = [decorate(element) for element in elements]
                domain = RecordDomain(fields)
                binding = SelectionBinding(
                        binding, recipes, elements, domain, binding.syntax)
        return Output(binding, optional=True, plural=base.plural)

    def bind_group_op(self, args):
        if not (len(args) >= 2):
            raise Error("Expected at least two arguments,"
                        " got:", ", ".join(map(str, args)))
        seed = self(args[0])
        if not seed.plural:
            raise Error("Expected a plural expression, got:", args[0])
        fields = []
        self.push_scope(seed.binding)
        for arg in args[1:]:
            self.push_enable_let_syntax(True)
            output = self(arg)
            self.pop_enable_let_syntax()
            if output.plural:
                raise Error("Expected a singular expression, got:", arg)
            fields.append(output.binding)
        self.pop_scope()
        syntax = GroupSyntax(
                ProjectSyntax(
                    seed.binding.syntax,
                    RecordSyntax([field.syntax for field in fields])))
        quotient = QuotientBinding(
                self.scope, seed.binding, fields, syntax)
        binding = quotient
        name = guess_tag(seed.binding)
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
        return Output(binding, optional=True, plural=True)

    def bind_let_op(self, args):
        if not (len(args) == 2 and
                isinstance(args[0], LiteralSyntax) and
                isinstance(args[0].val, str)):
            raise Error("Expected an identifier and an argument,"
                        " got:", ", ".join(map(str, args)))
        name = args[0].val
        self.push_enable_let_syntax(False)
        output = self(args[1])
        self.pop_enable_let_syntax()
        title = IdentifierSyntax(name)
        syntax = output.binding.syntax
        if self.enable_let_syntax and guess_tag(output.binding) != name:
            syntax = AssignSyntax(
                    SpecifySyntax([IdentifierSyntax(title.name)], None),
                    syntax)
        return Output(
                TitleBinding(output.binding, title, syntax),
                optional=output.optional,
                plural=output.plural)

    def bind_asc_op(self, args):
        if not (len(args) == 1):
            raise Error("Expected one argument,"
                        " got:", ", ".join(map(str, args)))
        output = self(args[0])
        syntax = DirectSyntax("+", output.binding.syntax)
        return Output(
                DirectionBinding(output.binding, +1, syntax),
                optional=output.optional, plural=output.plural)

    def bind_desc_op(self, args):
        if not (len(args) == 1):
            raise Error("Expected one argument,"
                        " got:", ", ".join(map(str, args)))
        output = self(args[0])
        syntax = DirectSyntax("-", output.binding.syntax)
        return Output(
                DirectionBinding(output.binding, -1, syntax),
                optional=output.optional, plural=output.plural)

    def bind_id_op(self, args):
        if args:
            raise Error("Expected no arguments,"
                        " got:", ", ".join(map(str, args)))
        recipe = identify(self.scope)
        if recipe is None:
            raise Error("Cannot determine identity")
        syntax = FunctionSyntax(IdentifierSyntax("id"), [])
        return Output(self.use(recipe, syntax))

    def bind_add_op(self, args):
        return self.bind_poly(AddSig, args, op='+')

    def bind_subtract_op(self, args):
        return self.bind_poly(SubtractSig, args, op='-')

    def bind_multiply_op(self, args):
        return self.bind_poly(MultiplySig, args, op='*')

    def bind_divide_op(self, args):
        return self.bind_poly(DivideSig, args, op='/')

    def bind_contains_op(self, args):
        return self.bind_poly(ContainsSig(+1), args, op='~')

    def bind_equal_op(self, args):
        parameters = self.bind_parameters(IsAmongSig, args)
        return self.bind_among(+1, **parameters)

    def bind_not_equal_op(self, args):
        parameters = self.bind_parameters(IsAmongSig, args)
        return self.bind_among(-1, **parameters)

    bind_in_op = bind_equal_op

    bind_not_in_op = bind_not_equal_op

    def bind_and_op(self, args):
        return self.bind_connective(True, AndSig, args)

    def bind_or_op(self, args):
        return self.bind_connective(False, OrSig, args)

    def bind_connective(self, zero, signature, args):
        if not args:
            return self.bind_literal(zero)
        parameters = self.bind_parameters(signature, args)
        optional = False
        plural = False
        ops = []
        syntax = None
        for output in parameters['ops']:
            op = ImplicitCastBinding(
                    output.binding, BooleanDomain(), output.binding.syntax)
            optional = optional or output.optional
            plural = plural or output.plural
            ops.append(op)
            if syntax is None:
                syntax = op.syntax
            else:
                syntax = OperatorSyntax(
                        '&' if zero else '|',
                        syntax, op.syntax)
        if len(ops) == 1:
            binding = ops[0]
        else:
            binding = FormulaBinding(
                    self.scope, signature(), BooleanDomain(), syntax, ops=ops)
        return Output(binding, optional=optional, plural=plural)

    def bind_not_op(self, args):
        parameters = self.bind_parameters(ExistsSig, args)
        output = parameters['op']
        op = ImplicitCastBinding(
                output.binding, BooleanDomain(), output.binding.syntax)
        syntax = PrefixSyntax('!', op.syntax)
        return Output(
                FormulaBinding(
                    self.scope, NotSig(), BooleanDomain(), syntax, op=op),
                optional=output.optional, plural=output.plural)

    def bind_year_op(self, args):
        return self.bind_date_extract(
                ExtractYearSig, IntegerDomain, args, fn="year")

    def bind_month_op(self, args):
        return self.bind_date_extract(
                ExtractMonthSig, IntegerDomain, args, fn="month")

    def bind_day_op(self, args):
        return self.bind_date_extract(
                ExtractDaySig, IntegerDomain, args, fn="day")

    def bind_hour_op(self, args):
        return self.bind_date_extract(
                ExtractHourSig, IntegerDomain, args, fn="hour")

    def bind_minute_op(self, args):
        return self.bind_date_extract(
                ExtractMinuteSig, IntegerDomain, args, fn="minute")

    def bind_second_op(self, args):
        return self.bind_date_extract(
                ExtractSecondSig, FloatDomain, args, fn="second")

    def bind_date_extract(self, sig, img, args, fn=None):
        parameters = self.bind_parameters(sig, args)
        output = parameters['op']
        syntax = VoidSyntax()
        if fn is not None:
            syntax = FunctionSyntax(
                    IdentifierSyntax(fn), [output.binding.syntax])
        return Output(
                FormulaBinding(
                    self.scope, sig(), img(),
                    syntax, op=output.binding),
                optional=output.optional, plural=output.plural)

    def bind_less_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare('<', **parameters)

    def bind_less_or_equal_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare('<=', **parameters)

    def bind_greater_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare('>', **parameters)

    def bind_greater_or_equal_op(self, args):
        parameters = self.bind_parameters(CompareSig, args)
        return self.bind_compare('>=', **parameters)

    def bind_boolean_op(self, args):
        return self.bind_cast(BooleanDomain(), args, fn="boolean")

    def bind_text_op(self, args):
        return self.bind_cast(TextDomain(), args, fn="text")

    def bind_integer_op(self, args):
        return self.bind_cast(IntegerDomain(), args, fn="integer")

    def bind_decimal_op(self, args):
        return self.bind_cast(DecimalDomain(), args, fn="decimal")

    def bind_float_op(self, args):
        return self.bind_cast(FloatDomain(), args, fn="float")

    def bind_date_op(self, args):
        return self.bind_cast(DateDomain(), args, fn="date")

    def bind_time_op(self, args):
        return self.bind_cast(TimeDomain(), args, fn="time")

    def bind_datetime_op(self, args):
        return self.bind_cast(DateTimeDomain(), args, fn="datetime")

    def bind_exists_op(self, args):
        parameters = self.bind_parameters(ExistsSig, args)
        output = parameters['op']
        if not output.optional:
            raise Error("Expected optional expression, got:", args[0])
        binding = ImplicitCastBinding(
                output.binding, BooleanDomain(), output.binding.syntax)
        if not output.plural:
            return Output(binding)
        syntax = FunctionSyntax(IdentifierSyntax("exists"), [binding.syntax])
        return Output(
                FormulaBinding(
                    self.scope, QuantifySig(+1), binding.domain,
                    syntax, plural_base=None, op=binding))

    def bind_count_op(self, args):
        parameters = self.bind_parameters(CountSig, args)
        output = parameters['op']
        if not output.plural:
            raise Error("Expected plural expression, got:", args[0])
        binding = ImplicitCastBinding(
                output.binding, BooleanDomain(), output.binding.syntax)
        syntax = FunctionSyntax(IdentifierSyntax("count"), [binding.syntax])
        binding = FormulaBinding(
                self.scope, CountSig(), IntegerDomain(), syntax, op=binding)
        return Output(
                FormulaBinding(
                    self.scope, AggregateSig(), binding.domain, syntax,
                    plural_base=None, op=binding))

    def bind_min_op(self, args):
        return self.bind_poly_aggregate(MinMaxSig(+1), args, fn="min")

    def bind_max_op(self, args):
        return self.bind_poly_aggregate(MinMaxSig(-1), args, fn="max")

    def bind_sum_op(self, args):
        return self.bind_poly_aggregate(SumSig, args, fn="sum")

    def bind_mean_op(self, args):
        return self.bind_poly_aggregate(AvgSig, args, fn="avg")

    def bind_among(self, polarity, lop, rops):
        if not rops:
            return self.bind_among(-polarity, lop, [lop])
        optional = lop.optional or any([rop.optional for rop in rops])
        plural = lop.plural or any([rop.plural for rop in rops])
        syntax = OperatorSyntax(
                '=' if polarity > 0 else '!=',
                lop.binding.syntax,
                RecordSyntax([rop.binding.syntax for rop in rops])
                if len(rops) != 1 else rops[0].binding.syntax)
        if isinstance(lop.domain, (EntityDomain, IdentityDomain)):
            ops = []
            for rop in rops:
                op = self.correlate_identity(
                        polarity, lop.binding, rop.binding, syntax)
                ops.append(op)
            binding = self.merge_identities(polarity, ops, syntax)
            return Output(binding, optional=optional, plural=plural)
        else:
            domains = [lop.domain] + [rop.domain for rop in rops]
            domain = coerce(*domains)
            if domain is None:
                raise Error("Detected arguments of unexpected types")
            lop = ImplicitCastBinding(lop.binding, domain, lop.syntax)
            rops = [ImplicitCastBinding(rop.binding, domain, rop.syntax)
                    for rop in rops]
        if len(rops) == 1:
            binding = FormulaBinding(
                    self.scope, IsEqualSig(polarity),
                    BooleanDomain(), syntax,
                    lop=lop, rop=rops[0])
        else:
            binding = FormulaBinding(
                    self.scope, IsAmongSig(polarity),
                    BooleanDomain(), syntax,
                    lop=lop, rops=rops)
        return Output(binding, optional=optional, plural=plural)

    def correlate_identity(self, polarity, lop, rop, syntax):
        ops = self.pair_identities(polarity, lop, rop, syntax)
        return self.merge_identities(polarity, ops, syntax)

    def merge_identities(self, polarity, ops, syntax):
        if len(ops) == 1:
            return ops[0]
        else:
            return FormulaBinding(
                    self.scope,
                    AndSig() if polarity == +1 else OrSig(),
                    BooleanDomain(), syntax, ops=ops)

    def pair_identities(self, polarity, lop, rop, syntax):
        ops = self.coerce_identities(lop, rop)
        if ops is None:
            raise Error("Cannot coerce values of types (%s, %s)"
                        " to a common type" % (lop.domain, rop.domain))
        lop, rop = ops
        if (isinstance(lop, IdentityBinding) and
                isinstance(rop, IdentityBinding)):
            if len(lop.elements) != len(rop.elements):
                raise Error("Cannot coerce values of types (%s, %s)"
                            " to a common type" % (lop.domain, rop.domain))
            pairs = []
            for lel, rel in zip(lop.elements, rop.elements):
                pairs.extend(self.pair_identities(polarity, lel, rel, syntax))
            return pairs
        elif isinstance(lop, IdentityBinding):
            if isinstance(rop.domain, UntypedDomain):
                try:
                    value = lop.domain.parse(rop.value)
                except ValueError as exc:
                    raise Error("Cannot coerce [%s] to %s:"
                                % (rop.value, lop.domain), exc)
                rop = LiteralBinding(rop.base, value, lop.domain, rop.syntax)
            if rop.domain != lop.domain:
                raise Error("Cannot coerce values of types (%s, %s)"
                            " to a common type" % (lop.domain, rop.domain))
            if rop.value is None:
                return [LiteralBinding(rop.base, None,
                                       coerce(BooleanDomain()), rop.syntax)]
            pairs = []
            for lel, rel, domain in zip(lop.elements, rop.value,
                                        lop.domain.labels):
                rel = LiteralBinding(rop.base, rel, domain, rop.syntax)
                pairs.extend(self.pair_identities(polarity, lel, rel, syntax))
            return pairs
        elif isinstance(rop, IdentityBinding):
            return self.pair_identities(polarity, rop, lop, syntax)
        else:
            domain = coerce(lop.domain, rop.domain)
            if domain is None:
                raise Error("Cannot coerce values of types (%s, %s)"
                            " to a common type" % (lop.domain, rop.domain))
            lop = ImplicitCastBinding(lop, domain, lop.syntax)
            rop = ImplicitCastBinding(rop, domain, rop.syntax)
            op = FormulaBinding(self.scope,
                                IsEqualSig(polarity),
                                coerce(BooleanDomain()),
                                syntax, lop=lop, rop=rop)
            return [op]

    def coerce_identities(self, lop, rop):
        if not any([isinstance(op.domain, (EntityDomain, IdentityDomain))
                    for op in [lop, rop]]):
            return lop, rop
        ops = []
        for op in [lop, rop]:
            if isinstance(op.domain, EntityDomain):
                recipe = identify(op)
                if recipe is None:
                    return None
                op = self.use(recipe, op.syntax, scope=op)
            elif not isinstance(op, (IdentityBinding, LiteralBinding)):
                op = (unwrap(op, IdentityBinding, is_deep=False) or
                      unwrap(op, LiteralBinding, is_deep=False))
            if op is None:
                return None
            ops.append(op)
        return ops

    def bind_compare(self, relation, lop, rop):
        domain = coerce(lop.domain, rop.domain)
        if domain is None:
            raise Error("Detected arguments of unexpected types")
        syntax = OperatorSyntax(
                relation, lop.binding.syntax, rop.binding.syntax)
        optional = lop.optional or rop.optional
        plural = lop.plural or rop.plural
        lop = ImplicitCastBinding(lop.binding, domain, lop.syntax)
        rop = ImplicitCastBinding(rop.binding, domain, rop.syntax)
        is_comparable = Comparable.__invoke__(domain)
        if not is_comparable:
            raise Error("Detected non-comparable type:", domain)
        return Output(
                FormulaBinding(
                    self.scope, CompareSig(relation), BooleanDomain(),
                    syntax, lop=lop, rop=rop),
                optional=optional, plural=plural)

    def bind_poly(self, signature, args, op=None):
        if isinstance(signature, type):
            signature = signature()
        parameters = self.bind_parameters(signature, args)
        optional = False
        plural = False
        for slot in signature.slots:
            value = parameters[slot.name]
            if value:
                if slot.is_singular:
                    optional = optional or value.optional
                    plural = plural or value.plural
                    value = value.binding
                else:
                    optional = optional or \
                            any([item.optional for item in value])
                    plural = plural or any([item.plural for item in value])
                    value = [item.binding for item in value]
                parameters[slot.name] = value
        syntax = VoidSyntax()
        if op is not None:
            syntax = OperatorSyntax(
                    op,
                    *[parameters[slot.name].syntax
                      for slot in signature.slots])
        binding = FormulaBinding(
                self.scope, signature, UntypedDomain(), syntax, **parameters)
        return Output(
                Correlate.__invoke__(binding, self),
                optional=optional, plural=plural)

    def bind_poly_aggregate(self, signature, args, fn=None):
        if isinstance(signature, type):
            signature = signature()
        parameters = self.bind_parameters(signature, args)
        output = parameters['op']
        if not output.plural:
            raise Error("Expected plural expression:", args[0])
        syntax = VoidSyntax()
        if fn is not None:
            syntax = FunctionSyntax(
                    IdentifierSyntax(fn), [output.binding.syntax])
        binding = FormulaBinding(
                self.scope, signature, UntypedDomain(),
                syntax, op=output.binding)
        binding = Correlate.__invoke__(binding, self)
        return Output(
                FormulaBinding(
                    self.scope, AggregateSig(), binding.domain,
                    syntax, plural_base=None, op=binding),
                optional=True)

    def bind_cast(self, domain, args, fn=None):
        parameters = self.bind_parameters(CastSig, args)
        base = parameters['base']
        syntax = VoidSyntax()
        if fn is not None:
            syntax = FunctionSyntax(IdentifierSyntax(fn), [base.binding.syntax])
        return Output(
                CastBinding(
                    domain=domain, syntax=syntax, base=base.binding))

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



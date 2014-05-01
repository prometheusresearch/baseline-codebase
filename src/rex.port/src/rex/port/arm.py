#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error, Extension, cached
from rex.db import get_db
from htsql.core.util import to_name, maybe, listof, tupleof
from htsql.core.error import Error as HTSQLError
from htsql.core.entity import TableEntity, ColumnEntity, DirectJoin, ReverseJoin
from htsql.core.model import HomeNode, Arc, TableArc, ChainArc, ColumnArc, SyntaxArc
from htsql.core.classify import classify
from htsql.core.domain import (UntypedDomain, BooleanDomain, RecordDomain,
        ListDomain, IdentityDomain, IntegerDomain, TextDomain, NumberDomain,
        DateDomain, TimeDomain, DateTimeDomain, EnumDomain)
from htsql.core.syn.syntax import Syntax, IdentifierSyntax, ReferenceSyntax
from htsql.core.syn.parse import parse
from htsql.core.tr.binding import (TitleBinding, SelectionBinding,
        CollectBinding, SieveBinding, ImplicitCastBinding, DecorateBinding,
        AliasBinding, LiteralBinding, DefineReferenceBinding, FormulaBinding,
        DirectionBinding, SortBinding, IdentityBinding, LocateBinding,
        ClipBinding, LiteralRecipe, ClosedRecipe)
from htsql.core.tr.signature import (IsEqualSig, IsInSig, NotSig, IsNullSig,
        CompareSig, AndSig, OrSig)
from htsql.core.tr.fn.signature import ContainsSig
from htsql.core.tr.lookup import prescribe, identify, lookup_reference
from htsql.core.tr.decorate import decorate
from htsql.tweak.etl.cmd.insert import Clarify
from webob import Response
import collections
import yaml


class ArmDumper(yaml.Dumper):

    def represent_unicode(self, data):
        return self.represent_scalar(u'tag:yaml.org,2002:str', data)

    def represent_ordered_dict(self, data):
        return self.represent_mapping(u'tag:yaml.org,2002:map', data.items(),
                                      flow_style=False)

ArmDumper.add_representer(unicode,
                          ArmDumper.represent_unicode)
ArmDumper.add_representer(collections.OrderedDict,
                          ArmDumper.represent_ordered_dict)


class Condition(Extension):

    name = None

    @classmethod
    def enabled(cls):
        return (cls.name is not None)

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            assert extension.name not in mapping, \
                    "duplicate condition: %r" % extension.name
            mapping[extension.name] = extension
        return mapping

    @classmethod
    def apply(cls, constraint, arm, binding, state):
        condition_map = cls.map_all()
        method = constraint.method or ''
        if method not in condition_map:
            raise Error("Invalid constraint:", constraint)
        condition = condition_map[method](constraint.values)
        return condition(arm, binding, state)

    def __init__(self, values):
        self.values = values

    def __call__(self, arm, binding, state):
        raise NotImplementedError()


class EqualCondition(Condition):

    name = ''

    def __call__(self, arm, binding, state):
        if not self.values:
            return binding
        if isinstance(arm, (ColumnArm, SyntaxArm)):
            values = clarify(arm.domain, self.values)
            recipe = prescribe(arm.arc, state.scope)
            base = state.use(recipe, binding.syntax)
            if len(values) == 1:
                [value] = values
                literal = LiteralBinding(state.scope, value, arm.domain,
                                         state.scope.syntax)
                condition = FormulaBinding(state.scope, IsEqualSig(+1),
                                           BooleanDomain(), state.scope.syntax,
                                           lop=base, rop=literal)
            else:
                literals = [LiteralBinding(state.scope, value, arm.domain,
                                           state.scope.syntax)
                            for value in values]
                condition = FormulaBinding(state.scope, IsInSig(+1),
                                           BooleanDomain(), state.scope.syntax,
                                           lop=base, rops=literals)
        elif isinstance(arm, (TableArm, LinkArm)):
            recipe = prescribe(arm.arc, state.scope)
            base = state.use(recipe, binding.syntax)
            conditions = []
            for value in self.values:
                condition = locate(state, base, value)
                conditions.append(condition)
            if len(conditions) == 1:
                [condition] = conditions
            else:
                condition = FormulaBinding(state.scope, OrSig,
                                           BooleanDomain(), state.scope.syntax,
                                           ops=conditions)
        else:
            raise Error("Invalid constraint:", self.name)
        binding = SieveBinding(binding, condition, binding.syntax)
        return binding


class NullCondition(Condition):

    name = 'null'

    def __call__(self, arm, binding, state):
        if not isinstance(arm, (FacetArm, ColumnArm, LinkArm, SyntaxArm)):
            raise Error("Invalid constraint:", self.name)
        [value] = clarify([BooleanDomain()], self.values)
        recipe = prescribe(arm.arc, state.scope)
        condition = state.use(recipe, binding.syntax)
        polarity = 1 if value is True else -1
        condition = FormulaBinding(state.scope, IsNullSig(polarity),
                                   BooleanDomain(),
                                   state.scope.syntax, op=condition)
        binding = SieveBinding(binding, condition, binding.syntax)
        return binding


class CompareCondition(Condition):

    name = None
    relation = None

    def __call__(self, arm, binding, state):
        if not isinstance(arm, (ColumnArm, SyntaxArm)):
            raise Error("Invalid constraint:", self.name)
        domain = arm.domain
        if not isinstance(domain, (TextDomain, NumberDomain,
                                   DateDomain, TimeDomain, DateTimeDomain)):
            raise Error("Invalid constraint:", self.name)
        [value] = clarify([domain], self.values)
        literal = LiteralBinding(state.scope, value, domain,
                                 state.scope.syntax)
        recipe = prescribe(arm.arc, state.scope)
        condition = state.use(recipe, binding.syntax)
        condition = FormulaBinding(state.scope, CompareSig(self.relation),
                                   BooleanDomain(), state.scope.syntax,
                                   lop=condition, rop=literal)
        binding = SieveBinding(binding, condition, binding.syntax)
        return binding


class LessThanCondition(CompareCondition):

    name = 'lt'
    relation = '<'


class LessOrEqualToCondition(CompareCondition):

    name = 'le'
    relation = '<='


class GreaterThanCondition(CompareCondition):

    name = 'gt'
    relation = '>'


class GreaterOrEqualToCondition(CompareCondition):

    name = 'ge'
    relation = '>='


class ContainsCondition(Condition):

    name = 'contains'

    def __call__(self, arm, binding, state):
        if not isinstance(arm, (ColumnArm, SyntaxArm)):
            raise Error("Invalid constraint:", self.name)
        domain = arm.domain
        if not isinstance(domain, TextDomain):
            raise Error("Invalid constraint:", self.name)
        [value] = clarify([domain], self.values)
        literal = LiteralBinding(state.scope, value, domain,
                                 state.scope.syntax)
        recipe = prescribe(arm.arc, state.scope)
        condition = state.use(recipe, binding.syntax)
        condition = FormulaBinding(state.scope, ContainsSig(+1),
                                   BooleanDomain(), state.scope.syntax,
                                   lop=condition, rop=literal)
        binding = SieveBinding(binding, condition, binding.syntax)
        return binding


class SortCondition(Condition):

    name = 'sort'

    def __call__(self, arm, binding, state):
        if not isinstance(arm, (ColumnArm, SyntaxArm)):
            raise Error("Invalid constraint:", self.name)
        [value] = clarify([EnumDomain([u'asc', u'desc'])], self.values)
        direction = +1 if value == u'asc' else -1
        recipe = prescribe(arm.arc, state.scope)
        condition = state.use(recipe, binding.syntax)
        condition = DirectionBinding(condition, direction, binding.syntax)
        binding = SortBinding(binding, [condition], None, None, binding.syntax)
        return binding


def locate(state, seed, value):
    recipe = identify(seed)
    if recipe is None:
        raise HTSQLError("Cannot determine identity")
    identity = state.use(recipe, seed.syntax, scope=seed)
    domain = identity.domain
    if not isinstance(value.domain, UntypedDomain):
        raise HTSQLError("Found ill-formed locator", value)
    try:
        location = domain.parse(value.data)
    except ValueError:
        raise HTSQLError("Found ill-formed locator", value)
    def convert(identity, elements):
        assert isinstance(identity, IdentityBinding)
        images = []
        for field, element in zip(identity.elements, elements):
            if isinstance(field.domain, IdentityDomain):
                images.extend(convert(field, element))
            else:
                item = LiteralBinding(state.scope, element, field.domain,
                                      seed.syntax)
                image = FormulaBinding(state.scope, IsEqualSig(+1),
                                       BooleanDomain(), state.scope.syntax,
                                       lop=field, rop=item)
                images.append(image)
        return images
    images = convert(identity, location)
    if len(images) == 1:
        return images[0]
    else:
        return FormulaBinding(state.scope, AndSig(), BooleanDomain(),
                              state.scope.syntax, ops=images)


def clarify(domains, values):
    if isinstance(values, list):
        if isinstance(domains, list):
            if len(domains) != len(values):
                raise Error("Unexpected number of arguments:",
                            "expected %s; got %s" % (len(domains), len(values)))
            return [clarify(domain, value)
                    for domain, value in zip(domains, values)]
        else:
            domain = domains
            return [clarify(domain, value) for value in values]
    else:
        domain = domains
        value = values
        convert = Clarify.__invoke__(value.domain, domain)
        if convert is None:
            raise Error("Cannot convert argument of type %s to %s:"
                        (value.domain, domain),
                        value)
        try:
            return convert(value.data)
        except ValueError, exc:
            raise Error("Failed to convert value to %s:" % domain, str(exc))


class Arm(object):

    is_plural = False

    def __init__(self, arc, arms):
        assert isinstance(arc, maybe(Arc))
        assert isinstance(arms, listof(tupleof(unicode, Arm)))
        self.arc = arc
        if arc is None:
            self.node = HomeNode()
        else:
            self.node = arc.target
        self.arms = collections.OrderedDict(arms)

    def grow(self, arms=[]):
        assert isinstance(arms, listof(tupleof(unicode, Arm)))
        return self.__class__(self.arc, self.arms.items()+arms)

    def __iter__(self):
        return iter(self.arms)

    def __getitem__(self, name):
        return self.arms[name]

    def __contains__(self, name):
        return (name in self.arms)

    def __len__(self):
        return len(self.arms)

    def get(self, name, default=None):
        return self.arms.get(name, default)

    def items(self):
        return self.arms.items()

    def to_yaml(self, dumper, name=None):
        raise NotImplementedError()

    def labels(self):
        return classify(self.node)

    def label(self, name):
        name = to_name(name)
        for label in self.labels():
            if label.name == name:
                return label
        raise Error("Unknown attribute:", name)

    def bind(self, state, constraints):
        raise NotImplementedError()

    def condition(self, binding, state, constraints):
        constraints_by_name = constraints.dispatch(self.arms)
        scope = state.scope
        if self.arc is not None:
            recipe = prescribe(self.arc, scope)
            scope = state.use(recipe, scope.syntax)
        state.push_scope(scope)
        for name, arm in self.items():
            if arm.is_plural:
                continue
            arm_constraints = constraints_by_name[name]
            binding = arm.condition(binding, state, arm_constraints)
        state.pop_scope()
        self_constraints = constraints_by_name[None]
        if self_constraints:
            binding = self.condition_self(binding, state, self_constraints)
        return binding

    def condition_self(self, binding, state, constraints):
        for constraint in constraints:
            binding = Condition.apply(constraint, self, binding, state)
        return binding


class RootArm(Arm):

    def __init__(self, arms):
        super(RootArm, self).__init__(None, arms)

    def grow(self, arms=[]):
        assert isinstance(arms, listof(tupleof(unicode, Arm)))
        return self.__class__(self.arms.items()+arms)

    def to_yaml(self, name=None):
        assert name is None
        sequence = []
        for name, arm in self.arms.items():
            sequence.append(arm.to_yaml(name))
        if len(sequence) == 0:
            return None
        elif len(sequence) == 1:
            return sequence[0]
        else:
            return sequence

    def bind(self, state, constraints):
        constraints_by_name = constraints.dispatch(self.arms)
        binding = DecorateBinding(state.scope, state.scope.syntax)
        binding = self.condition(binding, state, constraints)
        state.push_scope(binding)
        elements = []
        for name, arm in self.items():
            element = arm.bind(state, constraints_by_name[name])
            element = TitleBinding(element, IdentifierSyntax(name),
                                   element.syntax)
            elements.append(element)
        state.pop_scope()
        fields = [decorate(element) for element in elements]
        domain = RecordDomain(fields)
        binding = SelectionBinding(binding, elements, domain, binding.syntax)
        return binding


class TableArm(Arm):

    def __init__(self, arc, arms, mask, filters):
        assert isinstance(arc, (TableArc, ChainArc))
        assert isinstance(mask, maybe(Mask))
        assert isinstance(filters, listof(tupleof(unicode, Filter)))
        super(TableArm, self).__init__(arc, arms)
        self.table = arc.target.table
        self.mask = mask
        self.filters = collections.OrderedDict(filters)

    def grow(self, arms=[], mask=None, filters=[]):
        assert isinstance(arms, listof(tupleof(unicode, Arm)))
        assert isinstance(mask, maybe(Mask))
        assert isinstance(filters, listof(tupleof(unicode, Filter)))
        arms = self.arms.items()+arms
        mask = self.mask.merge(mask) if self.mask is not None else mask
        filters = self.filters.items()+filters
        return self.__class__(self.arc, arms, mask, filters)

    def to_yaml(self, name):
        mapping = collections.OrderedDict()
        mapping['entity'] = name
        if self.mask:
            mapping['mask'] = self.mask.to_yaml()
        filters = []
        for name, filter in self.filters.items():
            filters.append(filter.to_yaml(name))
        if filters:
            mapping['filters'] = filters
        select = []
        with_ = []
        for name, arm in self.arms.items():
            if isinstance(arm, (ColumnArm, LinkArm)):
                select.append(name)
            else:
                with_.append(arm.to_yaml(name))
        mapping['select'] = select
        if with_:
            mapping['with'] = with_
        return mapping

    def bind(self, state, constraints):
        constraints_by_name = constraints.dispatch(self.arms)
        recipe = prescribe(self.arc, state.scope)
        binding = state.use(recipe, state.scope.syntax)
        if self.is_plural:
            binding = self.condition(binding, state, constraints)
        state.push_scope(binding)
        elements = []
        recipe = identify(binding)
        element = state.use(recipe, state.scope.syntax)
        element = TitleBinding(element, IdentifierSyntax(u'id'), element.syntax)
        elements.append(element)
        for name, arm in self.items():
            element = arm.bind(state, constraints_by_name[name])
            element = TitleBinding(element, IdentifierSyntax(name),
                                   element.syntax)
            elements.append(element)
        fields = [decorate(element) for element in elements]
        domain = RecordDomain(fields)
        binding = SelectionBinding(state.scope, elements, domain,
                                   state.scope.syntax)
        state.pop_scope()
        return binding

    def condition_self(self, binding, state, constraints):
        limit = None
        offset = None
        for constraint in constraints:
            if constraint.method in self.filters:
                filter = self.filters[constraint.method]
                binding = self.condition_filter(binding, state, filter,
                                                constraint.values)
                continue
            if constraint.method == 'top':
                [limit] = clarify([IntegerDomain()], constraint.values)
                continue
            if constraint.method == 'skip':
                [offset] = clarify([IntegerDomain()], constraint.values)
                continue
            binding = Condition.apply(constraint, self, binding, state)
        if limit is not None or offset is not None:
            binding = ClipBinding(state.scope, binding, [], limit, offset,
                                  binding.syntax)
        return binding

    def condition_filter(self, binding, state, filter, values):
        if len(filter.parameters) != len(values):
            raise Error("Unexpected number of arguments:",
                        "expected %s; got %s"
                        % (len(filter.parameters), len(values)))
        recipe = prescribe(self.arc, state.scope)
        scope = state.use(recipe, state.scope.syntax)
        for parameter, value in zip(filter.parameters, values):
            recipe = LiteralRecipe(value.data, value.domain)
            scope = DefineReferenceBinding(scope, parameter, recipe,
                                           scope.syntax)
        condition = state.bind(filter.syntax, scope=scope)
        condition = ImplicitCastBinding(condition, BooleanDomain(),
                                        condition.syntax)
        binding = SieveBinding(binding, condition, binding.syntax)
        return binding


class TrunkArm(TableArm):

    is_plural = True

    def __init__(self, table, arms, mask, filters):
        assert isinstance(table, (TableArc, TableEntity))
        arc = table if isinstance(table, TableArc) else TableArc(table)
        super(TrunkArm, self).__init__(arc, arms, mask, filters)

    def bind(self, state, constraints):
        binding = super(TrunkArm, self).bind(state, constraints)
        domain = ListDomain(binding.domain)
        return CollectBinding(state.scope, binding, domain, binding.syntax)


class BranchArm(TableArm):

    is_plural = True

    def __init__(self, join, arms, mask, filters):
        assert (isinstance(join, ChainArc) or
                isinstance(join, ReverseJoin) and not join.is_contracting)
        arc = join if isinstance(join, ChainArc) \
              else ChainArc(join.origin, [join])
        super(BranchArm, self).__init__(arc, arms, mask, filters)

    def bind(self, state, constraints):
        binding = super(BranchArm, self).bind(state, constraints)
        domain = ListDomain(binding.domain)
        return CollectBinding(state.scope, binding, domain, binding.syntax)


class FacetArm(TableArm):

    def __init__(self, join, arms, mask, filters):
        assert (isinstance(join, ChainArc) or
                isinstance(join, ReverseJoin) and join.is_contracting)
        arc = join if isinstance(join, ChainArc) \
              else ChainArc(join.origin, [join])
        super(FacetArm, self).__init__(arc, arms, mask, filters)


class ColumnArm(Arm):

    def __init__(self, column):
        assert isinstance(column, ColumnEntity)
        super(ColumnArm, self).__init__(ColumnArc(column.table, column), [])
        self.column = column
        self.domain = column.domain

    def grow(self):
        return self

    def bind(self, state, constraints):
        recipe = prescribe(self.arc, state.scope)
        return state.use(recipe, state.scope.syntax)

    def _condition(self, binding, state, constraints):
        constraints_by_name = constraints.dispatch(self.arms)
        for constraint in constraints_by_name[None]:
            value = constraint.argument
            if constraint.operator is None:
                if not isinstance(value, unicode):
                    value = self.domain.dump(value)
                value = self.domain.parse(value)
                recipe = prescribe(self.arc, binding)
                lop = state.use(recipe, binding.syntax, scope=binding)
                rop = LiteralBinding(binding, value, self.domain, binding.syntax)
                filter = FormulaBinding(binding, IsEqualSig(+1), BooleanDomain(),
                                        binding.syntax, lop=lop, rop=rop)
            elif constraint.operator == u'null':
                if isinstance(argument, unicode):
                    try:
                        value = BooleanDomain.parse(value)
                    except ValueError:
                        raise Error("Invalid constraint:", constraint)
                if not isinstance(value, bool):
                    raise Error("Invalid constraint:", constraint)
                recipe = prescribe(self.arc, binding)
                filter = state.use(recipe, binding.syntax, scope=binding)
                polarity = 1 if value is True else -1
                filter = FormulaBinding(binding, IsNullSig(polarity),
                                        BooleanDomain(),
                                        binding.syntax, op=filter)
            else:
                raise Error("Invalid constraint:", constraint)
            binding = SieveBinding(binding, filter, binding.syntax)
        return binding


class LinkArm(Arm):

    def __init__(self, join):
        assert isinstance(join, DirectJoin)
        super(LinkArm, self).__init__(ChainArc(join.origin, [join]), [])
        self.join = join

    def grow(self):
        return self

    def bind(self, state, constraints):
        recipe = prescribe(self.arc, state.scope)
        binding = state.use(recipe, state.scope.syntax)
        recipe = identify(binding)
        return state.use(recipe, state.scope.syntax, scope=binding)

    def _condition(self, binding, state, constraints):
        constraints_by_name = constraints.dispatch(self.arms)
        for constraint in constraints_by_name[None]:
            if constraint.operator is None:
                recipe = prescribe(self.arc, binding)
                seed = state.use(recipe, binding.syntax, scope=binding)
                state.push_scope(binding)
                filter = locate(state, seed, constraint.argument)
                state.pop_scope()
                filter = ImplicitCastBinding(filter, BooleanDomain(), filter.syntax)
            elif constraint.operator == u'null':
                argument = constraint.argument
                if isinstance(argument, unicode):
                    try:
                        argument = BooleanDomain.parse(argument)
                    except ValueError:
                        raise Error("Invalid constraint:", constraint)
                if not isinstance(argument, bool):
                    raise Error("Invalid constraint:", constraint)
                recipe = prescribe(self.arc, binding)
                filter = state.use(recipe, binding.syntax, scope=binding)
                filter = ImplicitCastBinding(filter, BooleanDomain(), filter.syntax)
                if argument:
                    filter = FormulaBinding(binding, NotSig(), BooleanDomain(),
                                            binding.syntax, op=filter)
            else:
                raise Error("Invalid constraint:", constraint)
            binding = SieveBinding(binding, filter, binding.syntax)
        return binding


class SyntaxArm(Arm):

    def __init__(self, origin, syntax, domain):
        super(SyntaxArm, self).__init__(SyntaxArc(origin, None, syntax), [])
        self.syntax = syntax
        self.domain = domain

    def grow(self):
        return self

    def to_yaml(self, name):
        mapping = collections.OrderedDict()
        mapping['calculation'] = name
        mapping['expression'] = str(self.syntax)
        return mapping

    def bind(self, state, constraints):
        recipe = prescribe(self.arc, state.scope)
        return state.use(recipe, state.scope.syntax)


class Mask(object):

    def __init__(self, syntax):
        assert isinstance(syntax, Syntax)
        self.syntax = syntax

    def merge(self, syntax):
        assert isinstance(syntax, maybe(Syntax))
        if syntax is None:
            return syntax
        return Mask(OperatorSyntax(u'&', self.syntax, syntax))

    def to_yaml(self):
        return str(self.syntax)


class Filter(object):

    def __init__(self, parameters, syntax):
        assert isinstance(parameters, listof(unicode))
        assert isinstance(syntax, Syntax)
        self.parameters = parameters
        self.syntax = syntax

    def to_yaml(self, name):
        return u"%s(%s) := %s" % (name, u", ".join(u'$'+parameter
                                                   for parameter in self.parameters), self.syntax)



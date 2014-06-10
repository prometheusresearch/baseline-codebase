#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error, Extension, cached
from rex.db import get_db
from htsql.core.util import to_name, maybe, listof, tupleof
from htsql.core.error import Error as HTSQLError
from htsql.core.entity import TableEntity, ColumnEntity, DirectJoin, ReverseJoin
from htsql.core.model import HomeNode, Arc, TableArc, ChainArc, ColumnArc, SyntaxArc
from htsql.core.classify import classify, localize
from htsql.core.domain import (UntypedDomain, BooleanDomain, RecordDomain,
        ListDomain, IdentityDomain, IntegerDomain, TextDomain, NumberDomain,
        DateDomain, TimeDomain, DateTimeDomain, EnumDomain, Value)
from htsql.core.cmd.embed import Embed
from htsql.core.syn.syntax import (Syntax, VoidSyntax, IdentifierSyntax,
        ReferenceSyntax)
from htsql.core.syn.parse import parse
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (RootBinding, TitleBinding, SelectionBinding,
        CollectBinding, SieveBinding, ImplicitCastBinding, DecorateBinding,
        AliasBinding, LiteralBinding, DefineReferenceBinding, FormulaBinding,
        DirectionBinding, SortBinding, IdentityBinding, LocateBinding,
        ClipBinding, LiteralRecipe, ClosedRecipe)
from htsql.core.tr.signature import (IsEqualSig, IsInSig, NotSig, IsNullSig,
        CompareSig, AndSig, OrSig)
from htsql.core.tr.fn.signature import ContainsSig
from htsql.core.tr.lookup import prescribe, identify, lookup_reference
from htsql.core.tr.decorate import decorate
from htsql.core.tr.translate import translate
from htsql.tweak.etl.cmd.insert import (Clarify, BuildExtractTable,
        BuildExecuteInsert, BuildResolveIdentity)
from htsql.tweak.etl.cmd.merge import BuildResolveKey, BuildExecuteUpdate
from htsql.tweak.etl.cmd.delete import BuildExecuteDelete
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
                condition = FormulaBinding(state.scope, OrSig(),
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


def get_id_domain(node):
    identity_arcs = localize(node)
    if identity_arcs is None:
        raise Error("Expected a table with identity:", node)
    def chain(arcs):
        fields = []
        for arc in arcs:
            identity_arcs = localize(arc.target)
            if identity_arcs:
                field = chain(identity_arc)
            else:
                field = arc.column.domain
            fields.append(field)
        return IdentityDomain(fields)
    return chain(identity_arcs)


def locate(state, seed, value):
    recipe = identify(seed)
    if recipe is None:
        raise HTSQLError("Cannot determine identity")
    identity = state.use(recipe, seed.syntax, scope=seed)
    domain = identity.domain
    if value.domain == domain:
        location = value.data
    else:
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


class Missing(object):

    def __repr__(self):
        return "MISSING"


MISSING = Missing()


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

    def adapt(self, data):
        if data is None:
            return tuple(arm.adapt(None) for arm in self.arms.values())
        if isinstance(data, dict):
            record = []
            for name, arm in self.items():
                if name in data:
                    field = arm.adapt(data[name])
                else:
                    field = MISSING
                record.append(field)
            return tuple(record)
        if isinstance(data, tuple) and len(data) == len(self.arms):
            return tuple(arm.adapt(item) for arm, item in zip(self.arms, data))
        raise Error("Invalid input:", data)

    def flatten(self, data):
        result = []
        for arm, item in zip(self.arms.values(), data):
            result.extend(arm.flatten(item))
        return result

    def pair(self, old, new):
        result = []
        for (old_arc, old_records), (new_arc, new_records) in zip(old, new):
            assert old_arc is new_arc
            arc = old_arc
            old_record_by_id = {}
            for record in old_records:
                record_id = record[0]
                if record_id is None or record_id is MISSING:
                    raise Error("Old record must have an id:", record)
                if record_id in old_record_by_id:
                    raise Error("Duplicate record id:", record_id)
                old_record_by_id[record_id] = record
            new_record_by_id = {}
            for record in new_records:
                record_id = record[0]
                if record_id is None or record_id is MISSING:
                    continue
                if record_id in new_record_by_id:
                    raise Error("Duplicate record id:", record_id)
                if record_id not in old_record_by_id:
                    old_record_by_id[record_id] = (record_id,) + \
                                                  (MISSING,)*(len(record)-1)
                new_record_by_id[record_id] = record
            pairs = []
            for record in old_records:
                record_id = record[0]
                if record_id not in new_record_by_id:
                    pairs.append((record, None))
            for record in new_records:
                record_id = record[0]
                if record_id is not None and record_id is not MISSING:
                    old_record = old_record_by_id[record_id]
                    pairs.append((old_record, record))
            for record in new_records:
                record_id = record[0]
                if record_id is None or record_id is MISSING:
                    pairs.append((None, record))
            result.append((arc, pairs))
        return result

    def restore(self, difference):
        restored_difference = []
        for node, pairs in difference:
            restored_pairs = []
            columns = []
            for label in classify(node):
                arc = label.arc
                if not (isinstance(arc, ColumnArc) or
                        (isinstance(arc, ChainArc) and len(arc.joins) == 1 and
                         arc.joins[0].is_direct)):
                    continue
                columns.append(arc)
            used = set()
            ids = []
            for old, new in pairs:
                if old is not None:
                    ids.append(old[0])
                for record in (old, new):
                    if record is None:
                        continue
                    for item, column in zip(record[1:], columns):
                        if item is not MISSING:
                            used.add(column)
            if ids:
                state = BindingState(RootBinding(VoidSyntax()))
                recipe = prescribe(TableArc(node.table), state.scope)
                binding = state.use(recipe, state.scope.syntax)
                recipe = identify(binding)
                identity = state.use(recipe, binding.syntax, scope=binding)
                domain = identity.domain
                conditions = []
                for id in ids:
                    value = Value(domain, id)
                    condition = locate(state, binding, value)
                    conditions.append(condition)
                if len(conditions) == 1:
                    [condition] = conditions
                else:
                    condition = FormulaBinding(state.scope, OrSig(),
                                               BooleanDomain(),
                                               state.scope.syntax,
                                               ops=conditions)
                binding = SieveBinding(binding, condition, binding.syntax)
                state.push_scope(binding)
                elements = [identity]
                for column in columns:
                    if column not in used:
                        continue
                    recipe = prescribe(column, state.scope)
                    element = state.use(recipe, state.scope.syntax)
                    if isinstance(column, ChainArc):
                        recipe = identify(element)
                        element = state.use(recipe, state.scope.syntax,
                                            scope=element)
                    elements.append(element)
                fields = [decorate(element) for element in elements]
                domain = RecordDomain(fields)
                binding = SelectionBinding(state.scope, elements, domain,
                                           state.scope.syntax)
                state.pop_scope()
                domain = ListDomain(binding.domain)
                binding = CollectBinding(state.scope, binding, domain,
                                         binding.syntax)
                pipe = translate(binding)
                product = pipe()(None)
                record_by_id = {}
                for record in product:
                    record_by_id[record[0]] = record
            else:
                record_by_id = {}
            for old, new in pairs:
                if old is None:
                    restored_pairs.append((old, new))
                    continue
                if old[0] not in record_by_id:
                    raise Error("Missing record:", old)
                record = record_by_id[old[0]]
                restored_old = [old[0]]
                idx = 0
                for column, field in zip(columns, old[1:]):
                    if column in used:
                        idx += 1
                        real_field = record[idx]
                        if field is MISSING:
                            field = real_field
                        else:
                            if field != real_field:
                                raise Error("Unexpected value:", old)
                    restored_old.append(field)
                restored_pairs.append((restored_old, new))
            restored_difference.append((node, restored_pairs))
        return restored_difference

    def patch(self, difference):
        changes = []
        for node, pairs in difference:
            arcs = []
            for label in classify(node):
                arc = label.arc
                if not (isinstance(arc, ColumnArc) or
                        (isinstance(arc, ChainArc) and len(arc.joins) == 1 and
                         arc.joins[0].is_direct)):
                    continue
                arcs.append(arc)
            ids = []
            for old, new in pairs:
                if old is None:
                    id = self.patch_insert(node, arcs, new)
                    ids.append(id)
                elif new is None:
                    self.patch_delete(node, arcs, old[0])
                else:
                    record = [old[0]]
                    for old_item, new_item in zip(old[1:], new[1:]):
                        if (old_item is not MISSING and new_item is not MISSING
                                and old_item != new_item):
                            item = new_item
                        else:
                            item = MISSING
                        record.append(item)
                    id = self.patch_update(node, arcs, record)
                    ids.append(id)
            changes.append((node, ids))
        return changes

    def patch_insert(self, node, arcs, record):
        active_arcs = []
        active_items = []
        for arc, item in zip(arcs, record[1:]):
            if item is not MISSING:
                active_arcs.append(arc)
                active_items.append(item)
        extract_table = BuildExtractTable.__invoke__(
                node, active_arcs)
        execute_insert = BuildExecuteInsert.__invoke__(
                extract_table.table, extract_table.columns)
        resolve_identity = BuildResolveIdentity.__invoke__(
                execute_insert.table, execute_insert.output_columns,
                is_list=False)
        row = resolve_identity(
                execute_insert(
                    extract_table(
                        active_items)))
        return row

    def patch_update(self, node, arcs, record):
        active_arcs = []
        active_items = []
        for arc, item in zip(arcs, record[1:]):
            if item is not MISSING:
                active_arcs.append(arc)
                active_items.append(item)
        key_id = record[0]
        resolve_key = BuildResolveKey.__invoke__(
                node, active_arcs)
        extract_table = BuildExtractTable.__invoke__(
                node, active_arcs)
        execute_update = BuildExecuteUpdate.__invoke__(
                extract_table.table, extract_table.columns)
        resolve_identity = BuildResolveIdentity.__invoke__(
                execute_update.table, execute_update.output_columns,
                is_list=False)
        row = resolve_identity(
                execute_update(
                    resolve_key(key_id),
                    extract_table(
                        active_items)))
        return row

    def patch_delete(self, node, arcs, key_id):
        resolve_key = BuildResolveKey.__invoke__(
                node, [])
        execute_delete = BuildExecuteDelete.__invoke__(
                node.table)
        execute_delete(
                resolve_key(
                    key_id))

    def restrict(self, changes):
        from .query import Constraint, ConstraintSet
        ids_by_node = {}
        for node, ids in changes:
            ids_by_node[node] = ids
        constraints = []
        for name, arm in self.items():
            ids = ids_by_node.get(arm.node)
            if ids:
                state = BindingState(RootBinding(VoidSyntax()))
                recipe = prescribe(TableArc(arm.node.table), state.scope)
                binding = state.use(recipe, state.scope.syntax)
                recipe = identify(binding)
                identity = state.use(recipe, binding.syntax, scope=binding)
                values = [Value(identity.domain, id) for id in ids]
                constraint = Constraint((name,), None, values)
            else:
                value = Value(IntegerDomain(), 0)
                constraint = Constraint((name,), u'top', [value])
            constraints.append(constraint)
        return ConstraintSet(0, constraints)


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

    def adapt(self, data):
        if data is None:
            return None
        id_value = MISSING
        record = []
        if isinstance(data, dict):
            if 'id' in data:
                id_value = data['id']
            record = []
            for name, arm in self.items():
                if name in data:
                    field = arm.adapt(data[name])
                else:
                    field = MISSING
                record.append(field)
        elif isinstance(data, tuple) and len(data) == len(self.arms)+1:
            id_value = data[0]
            record = tuple(arm.adapt(item)
                           for arm, item in zip(self.arms.values(), data[1:]))
        else:
            raise Error("Invalid input:", data)
        if id_value is None:
            id_value = MISSING
        if id_value is not MISSING:
            id_domain = get_id_domain(self.node)
            id_value = Embed.__invoke__(id_value)
            id_value = clarify(id_domain, id_value)
        return (id_value,)+tuple(record)

    def flatten(self, data):
        record = [data[0]]
        index_by_arc = dict((arm.arc, index)
                            for index, arm in enumerate(self.arms.values()))
        for label in classify(self.node):
            arc = label.arc
            if not (isinstance(arc, ColumnArc) or
                    (isinstance(arc, ChainArc) and len(arc.joins) == 1 and
                     arc.joins[0].is_direct)):
                continue
            if arc in index_by_arc:
                index = index_by_arc[arc]
                value = data[index+1]
            else:
                value = MISSING
            record.append(value)
        return record


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

    def adapt(self, data):
        if data is None:
            return []
        if isinstance(data, list):
            return [super(TrunkArm, self).adapt(item)
                    for item in data]
        return [super(TrunkArm, self).adapt(data)]

    def flatten(self, data):
        return [(self.node, [super(TrunkArm, self).flatten(item)
                             for item in data])]


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

    def adapt(self, data):
        value = Embed.__invoke__(data)
        return clarify(self.domain, value)


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

    def adapt(self, data):
        value = Embed.__invoke__(data)
        state = BindingState(RootBinding(VoidSyntax()))
        recipe = prescribe(TableArc(self.node.table), state.scope)
        binding = state.use(recipe, state.scope.syntax)
        recipe = identify(binding)
        identity = state.use(recipe, binding.syntax, scope=binding)
        domain = identity.domain
        return clarify(domain, value)


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



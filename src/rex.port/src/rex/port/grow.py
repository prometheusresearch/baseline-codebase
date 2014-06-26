#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import (Validate, UStrVal, ProxyVal, SeqVal, OneOrSeqVal,
        RecordVal, UnionVal, OnScalar, OnField, Error)
from rex.db import get_db
from .arm import (TrunkArm, BranchArm, FacetArm, ColumnArm, LinkArm, SyntaxArm,
        Filter, Mask)
from htsql.core.error import Error as HTSQLError
from htsql.core.model import (HomeNode, TableNode, TableArc, ChainArc,
        ColumnArc)
from htsql.core.classify import classify
from htsql.core.syn.syntax import (Syntax, VoidSyntax, IdentifierSyntax,
        AssignSyntax, FilterSyntax, ComposeSyntax, ReferenceSyntax)
from htsql.core.syn.parse import parse
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import RootBinding
from htsql.core.tr.lookup import prescribe
import fnmatch


def as_path(syntax):
    path = []
    while (isinstance(syntax, ComposeSyntax) and
           isinstance(syntax.rarm, IdentifierSyntax)):
        path.insert(0, syntax.rarm.name)
        syntax = syntax.larm
    if not isinstance(syntax, IdentifierSyntax):
        return None
    path.insert(0, syntax.name)
    return path


def as_name(syntax):
    path = as_path(syntax)
    if path is None:
        return None
    name = path[-1]
    path = path[:-1]
    return (name, path)


def as_entity(syntax):
    mask = None
    if isinstance(syntax, FilterSyntax):
        mask = syntax.rarm
        syntax = syntax.larm
    name_path = as_name(syntax)
    if name_path is None:
        return None
    name, path = name_path
    return (name, path, mask)


def as_filter(syntax):
    if not isinstance(syntax, AssignSyntax):
        return None
    expression = syntax.rarm
    syntax = syntax.larm
    if not (len(syntax.larms) == 1 and
            isinstance(syntax.larms[0], IdentifierSyntax)):
        return None
    name = syntax.larms[0].name
    if not (syntax.rarms is not None and
            all(isinstance(rarm, ReferenceSyntax)
                for rarm in syntax.rarms)):
        return None
    parameters = [rarm.name for rarm in syntax.rarms]
    return (name, parameters, expression)


def as_calculation(syntax):
    if not isinstance(syntax, AssignSyntax):
        return None
    expression = syntax.rarm
    syntax = syntax.larm
    if syntax.rarms is not None:
        return None
    if not all(isinstance(larm, IdentifierSyntax)
               for larm in syntax.larms):
        return None
    path = [larm.name for larm in syntax.larms]
    name = path[-1]
    path = path[:-1]
    return (name, path, expression)


class OnSyntax(OnScalar):

    def __call__(self, data):
        return (isinstance(data, Syntax) or
                super(OnSyntax, self).__call__(data))


class SyntaxVal(UStrVal):

    def __call__(self, data):
        if isinstance(data, Syntax):
            return data
        data = super(SyntaxVal, self).__call__(data)
        try:
            syntax = parse(data)
        except HTSQLError, exc:
            raise Error("Failed to parse an HTSQL expression:", str(exc))
        return syntax


class GrowVal(Validate):

    validate = ProxyVal()

    validate_entity = RecordVal(
            ('entity', SyntaxVal),
            ('at', SyntaxVal, None),
            ('mask', SyntaxVal, None),
            ('filters', SeqVal(SyntaxVal), None),
            ('select', OneOrSeqVal(UStrVal(r'[\w*]+')), None),
            ('deselect', OneOrSeqVal(UStrVal(r'[\w*]+')), None),
            ('with', SeqVal(validate), None))
    entity_record_type = validate_entity.record_type
    entity_variant = (OnField('entity'), validate_entity)

    validate_calculation = RecordVal(
            ('calculation', SyntaxVal),
            ('at', SyntaxVal, None),
            ('expression', SyntaxVal, None))
    calculation_record_type = validate_calculation.record_type
    calculation_variant = (OnField('calculation'), validate_calculation)

    validate_scalar = SyntaxVal()
    scalar_variant = (OnSyntax, validate_scalar)

    validate.set(OneOrSeqVal(UnionVal(
            entity_variant, calculation_variant, scalar_variant)))

    def __call__(self, data):
        with get_db():
            return self.validate(data)

    def construct(self, loader, node):
        with get_db():
            return self.validate.construct(loader, node)


class Grow(object):

    @classmethod
    def parse(cls, stream):
        if isinstance(stream, (str, unicode)) or hasattr(stream, 'read'):
            spec = GrowVal.validate.parse(stream)
        else:
            spec = GrowVal.validate(stream)
        if isinstance(spec, list):
            return GrowSequence([cls.build(item) for item in spec])
        else:
            return cls.build(spec)

    @classmethod
    def build(cls, spec):
        if isinstance(spec, Syntax):
            name_path_mask = as_entity(spec)
            if name_path_mask is not None:
                name, path, mask = name_path_mask
                return GrowEntity(name, path, mask)
            name_path_expression = as_calculation(spec)
            if name_path_expression is not None:
                name, path, expression = name_path_expression
                return GrowCalculation(name, path, expression)
            raise Error("Expected an HTSQL expression of the form:",
                        "<name> OR <name>. ... .<name> OR <name> := <expr>") \
                  .wrap("Got:", spec)
        elif isinstance(spec, GrowVal.entity_record_type):
            name_path_mask = as_entity(spec.entity)
            if name_path_mask is None:
                raise Error("Expected an HTSQL expression of the form:",
                            "<name> OR <name>. ... .<name> OR <name>?<mask>") \
                      .wrap("Got:", spec.entity)
            name, path, mask = name_path_mask
            if spec.at is not None:
                at_path = as_path(spec.at)
                if at_path is None:
                    raise Error("Expected an HTSQL expression of the form:",
                                "<name> or <name>. ... .<name>") \
                          .wrap("Got:", spec.at)
                path = at_path+path
            if spec.mask is not None:
                if mask is not None:
                    raise Error("Got duplicate mask:", spec.mask)
                mask = spec.mask
            filters = []
            if spec.filters:
                for syntax in spec.filters:
                    name_parameters_expression = as_filter(syntax)
                    if name_parameters_expression is None:
                        raise Error("Expected an HTSQL expression of the form:",
                                    "<name>($<param>, ...) := <expr>") \
                              .wrap("Got:", syntax)
                    filter_name, parameters, expression = name_parameters_expression
                    filters.append((filter_name, parameters, expression))
            select_patterns = [u'*']
            if spec.select is not None:
                select_patterns = spec.select \
                        if isinstance(spec.select, list) else [spec.select]
            deselect_patterns = []
            if spec.deselect is not None:
                deselect_patterns = spec.deselect \
                        if isinstance(spec.deselect, list) else [spec.deselect]
            related = []
            if spec.with_:
                related = [Grow.build(with_spec) for with_spec in spec.with_]
            return GrowEntity(name, path, mask, filters,
                              select_patterns, deselect_patterns, related)
        elif isinstance(spec, GrowVal.calculation_record_type):
            name_path_expression = as_calculation(spec.calculation)
            name_path = as_name(spec.calculation)
            if name_path_expression is not None:
                if spec.expression:
                    raise Error("Got duplicate expression:", spec.expression)
                name, path, expression = name_path_expression
            elif name_path is not None:
                if not spec.expression:
                    raise Error("Missing expression")
                name, path = name_path
                expression = spec.expression
            if spec.at is not None:
                at_path = as_path(spec.at)
                if at_path is None:
                    raise Error("Expected an HTSQL expression of the form:",
                                "<name> or <name>. ... .<name>") \
                          .wrap("Got:", spec.at)
                path = at_path+path
            return GrowCalculation(name, path, expression)

    def __call__(self, parent):
        raise NotImplementedError()


class GrowSequence(Grow):

    def __init__(self, sequence):
        self.sequence = sequence

    def __call__(self, parent):
        for grow in self.sequence:
            parent = grow(parent)
        return parent


class GrowEntity(Grow):

    def __init__(self, name, path=(), mask=None, filters=[],
                 select_patterns=[u'*'], deselect_patterns=[], related=[]):
        self.name = name
        self.path = path
        self.mask = mask
        self.filters = filters
        self.select_patterns = select_patterns
        self.deselect_patterns = deselect_patterns
        self.related = related

    def __call__(self, parent):
        chain = []
        for name in self.path:
            if name not in parent:
                raise Error("Invalid path:", u".".join(self.path))
            chain.append(parent)
            parent = parent[name]
        if self.name in parent:
            raise Error("Duplicate attribute:", self.name)
        label = parent.label(self.name)
        if label is None:
            raise Error("Unknown attribute:", self.name)
        arm_arc = label.arc
        if isinstance(arm_arc, TableArc):
            arm_class = TrunkArm
        elif (isinstance(arm_arc, ChainArc) and len(arm_arc.joins) == 1 and
                arm_arc.joins[0].is_reverse):
            [join] = arm_arc.joins
            if join.is_contracting:
                arm_class = FacetArm
            else:
                arm_class = BranchArm
        else:
            raise Error("Not an entity:", self.name)
        arms = []
        for label in classify(arm_arc.target):
            if not any(fnmatch.fnmatchcase(label.name, pattern)
                       for pattern in self.select_patterns):
                continue
            if any(fnmatch.fnmatchcase(label.name, pattern)
                   for pattern in self.deselect_patterns):
                continue
            arc = label.arc
            if isinstance(arc, ColumnArc) and arc.link is not None:
                arc = arc.link
            if isinstance(arc, ChainArc) and arc.reverse() == arm_arc:
                continue
            if isinstance(arc, ColumnArc):
                arms.append((label.name, ColumnArm(arc.column)))
            elif (isinstance(arc, ChainArc) and len(arc.joins) == 1 and
                    arc.joins[0].is_direct):
                [join] = arc.joins
                arms.append((label.name, LinkArm(join)))
        mask = None
        if self.mask is not None:
            mask = Mask(self.mask)
        filters = [(name, Filter(parameters, expression))
                   for name, parameters, expression in self.filters]
        arm = arm_class(arm_arc, arms, mask, filters)
        if self.related:
            for grow in self.related:
                arm = grow(arm)
        parent = parent.grow(arms=[(self.name, arm)])
        for arm, name in reversed(zip(chain, self.path)):
            parent = arm.grow(arms=[(name, parent)])
        return parent


class GrowCalculation(Grow):

    def __init__(self, name, path, syntax):
        self.name = name
        self.path = path
        self.syntax = syntax

    def __call__(self, parent):
        chain = []
        for name in self.path:
            if name not in parent:
                raise Error("Invalid path:", u".".join(self.path))
            chain.append(parent)
            parent = parent[name]
        if not isinstance(parent.node, (HomeNode, TableNode)):
            raise Error("Cannot add a calculation to a non-entity arm")
        state = BindingState(RootBinding(VoidSyntax()))
        if isinstance(parent.node, TableNode):
            recipe = prescribe(parent.arc, state.scope)
            binding = state.use(recipe, state.scope.syntax)
            state.push_scope(binding)
        binding = state.bind(self.syntax)
        domain = binding.domain
        parent = parent.grow(arms=[
            (self.name, SyntaxArm(parent.node, self.syntax, domain))])
        for arm, name in reversed(zip(chain, self.path)):
            parent = arm.grow(arms=[(name, parent)])
        return parent



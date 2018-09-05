#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import (Validate, AnyVal, UStrVal, ProxyVal, SeqVal, OneOrSeqVal,
        RecordVal, UnionVal, OnScalar, OnField, Location, set_location, locate,
        Error, guard)
from rex.db import get_db
from .arm import (RootArm, TableArm, TrunkArm, BranchArm, FacetArm, JoinArm,
        ColumnArm, LinkArm, SyntaxArm, Filter, Mask)
from htsql.core.error import Error as HTSQLError
from htsql.core.model import (HomeNode, TableNode, TableArc, ChainArc,
        ColumnArc, SyntaxArc)
from htsql.core.classify import classify
from htsql.core.domain import (Value, UntypedDomain, IntegerDomain,
        FloatDomain, DecimalDomain, BooleanDomain)
from htsql.core.syn.syntax import (Syntax, VoidSyntax, IdentifierSyntax,
        ReferenceSyntax, AssignSyntax, FilterSyntax, ComposeSyntax,
        ReferenceSyntax, IntegerSyntax, DecimalSyntax, FloatSyntax,
        StringSyntax)
from htsql.core.syn.parse import parse
from htsql.core.cmd.embed import Embed
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (RootBinding, LiteralRecipe,
        DefineReferenceBinding)
from htsql.core.tr.lookup import prescribe
import fnmatch


def as_path(syntax):
    # Parses:
    #   <name>. ... .<name> -> [<name>, ..., <name>]
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
    # Parses:
    #   <path>.<name> -> (<name>, <path>)
    path = as_path(syntax)
    if path is None:
        return None
    name = path[-1]
    path = path[:-1]
    return (name, path)


def as_entity(syntax):
    # Parses:
    #   <path>.<name>?<mask> -> (<name>, <path>, <mask>)
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
    # Parses:
    #   <name>($<parameter>, ...) := <expression>
    #       -> (name, [<parameter>, ...], <expression>)
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
    # Parses:
    #   <path>.<name> := <expression> -> (<name>, <path>, <expression>)
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


def as_reference(syntax):
    # Parses:
    #   <name> OR $<name>
    if isinstance(syntax, ReferenceSyntax):
        syntax = syntax.identifier
    if not isinstance(syntax, IdentifierSyntax):
        return None
    return syntax.name


def as_value(syntax):
    # Parses a literal value.
    if isinstance(syntax, IntegerSyntax):
        value = syntax.value
        domain = IntegerDomain()
    elif isinstance(syntax, DecimalSyntax):
        value = syntax.value
        domain = DecimalDomain()
    elif isinstance(syntax, FloatSyntax):
        value = syntax.value
        domain = FloatDomain()
    elif isinstance(syntax, StringSyntax):
        value = syntax.text
        domain = UntypedDomain()
    elif isinstance(syntax, IdentifierSyntax) and syntax.name == 'null':
        value = None
        domain = UntypedDomain()
    elif isinstance(syntax, IdentifierSyntax) and syntax.name == 'true':
        value = True
        domain = UntypedDomain()
    elif isinstance(syntax, IdentifierSyntax) and syntax.name == 'false':
        value = False
        domain = UntypedDomain()
    else:
        return None
    return Value(domain, value)


def as_parameter(syntax):
    # Parses:
    #   <name> := <value> OR $<name> := <value>
    if not isinstance(syntax, AssignSyntax):
        return None
    value = as_value(syntax.rarm)
    if value is None:
        return None
    syntax = syntax.larm
    if syntax.rarms is not None:
        return None
    if len(syntax.larms) != 1:
        return None
    name = as_reference(syntax.larms[0])
    return (name, value)


class OnSyntax(OnScalar):
    # Tests if the input is scalar, accepts `Syntax` instances.

    def __call__(self, data):
        return (isinstance(data, Syntax) or
                super(OnSyntax, self).__call__(data))


class SyntaxVal(UStrVal):
    # Verifies if the input is a valid HTSQL expression.

    def __call__(self, data):
        if isinstance(data, Syntax):
            return data
        data = super(SyntaxVal, self).__call__(data)
        try:
            with get_db():
                syntax = parse(data)
        except HTSQLError as exc:
            raise Error("Failed to parse an HTSQL expression:", str(exc))
        return syntax

    def construct(self, loader, node):
        syntax = super(SyntaxVal, self).construct(loader, node)
        location = Location.from_node(node)
        set_location(syntax, location)
        return syntax


class GrowVal(Validate):
    """
    Validates port builder structure.
    """

    # Validator of the port structure.
    validate = ProxyVal()

    # Validator for a entity builder.
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

    # Validator for a calculation builder.
    validate_calculation = RecordVal(
            ('calculation', SyntaxVal),
            ('at', SyntaxVal, None),
            ('expression', SyntaxVal, None))
    calculation_record_type = validate_calculation.record_type
    calculation_variant = (OnField('calculation'), validate_calculation)

    # Validator for parameter definition.
    validate_parameter = RecordVal(
            ('parameter', SyntaxVal),
            ('default', AnyVal, None))
    parameter_record_type = validate_parameter.record_type
    parameter_variant = (OnField('parameter'), validate_parameter)

    # Validator for a scalar HTSQL expression.
    validate_scalar = SyntaxVal()
    scalar_variant = (OnSyntax, validate_scalar)

    validate.set(OneOrSeqVal(UnionVal(
            entity_variant, calculation_variant, parameter_variant,
            scalar_variant)))

    def __call__(self, data):
        return self.validate(data)

    def construct(self, loader, node):
        return self.validate.construct(loader, node)


class Grow:
    # Grows a port arm.

    @classmethod
    def parse(cls, stream):
        # Parses a YAML stream or a Python structure, returns a port builder.
        validate = GrowVal()
        if isinstance(stream, str) or hasattr(stream, 'read'):
            spec = validate.parse(stream)
        else:
            spec = validate(stream)
        if isinstance(spec, list):
            return GrowSequence([cls.build(item) for item in spec])
        else:
            return cls.build(spec)

    @classmethod
    def build(cls, spec):
        # Converts a raw record supplied by the validator to a `Grow` instance.
        if isinstance(spec, Syntax):
            # An HTSQL expression could be either a shorthand for an entity.
            name_path_mask = as_entity(spec)
            if name_path_mask is not None:
                name, path, mask = name_path_mask
                grow = GrowEntity(name, path, mask)
                set_location(grow, spec)
                return grow
            # Or a calculation builder.
            name_path_expression = as_calculation(spec)
            if name_path_expression is not None:
                name, path, expression = name_path_expression
                grow = GrowCalculation(name, path, expression)
                set_location(grow, spec)
                return grow
            # Or a parameter builder.
            name_value = as_parameter(spec)
            if name_value is not None:
                name, value = name_value
                grow = GrowParameter(name, value)
                set_location(grow, spec)
                return grow
            name = as_reference(spec)
            if name is not None:
                grow = GrowParameter(name)
                set_location(grow, spec)
                return grow
            raise Error("Expected an HTSQL expression of the form:",
                        "<name> OR <name>. ... .<name> OR <name> := <expr>"
                        " OR $<name> OR $<name> := <val>") \
                  .wrap("Got:", spec) \
                  .wrap("While parsing:", locate(spec) or spec)

        elif isinstance(spec, GrowVal.entity_record_type):
            # An entity builder record.
            with guard("While parsing:", locate(spec) or spec):
                # Process `entity: <path>.<name>?<mask>`.
                name_path_mask = as_entity(spec.entity)
                if name_path_mask is None:
                    raise Error("Expected an HTSQL expression of the form:",
                                "<name> OR <name>. ... .<name>"
                                " OR <name>?<mask>") \
                          .wrap("Got:", spec.entity) \
                          .wrap("While processing field:", 'entity')
                name, path, mask = name_path_mask
                # Process `at: <path>`.
                if spec.at is not None:
                    at_path = as_path(spec.at)
                    if at_path is None:
                        raise Error("Expected an HTSQL expression of the form:",
                                    "<name> OR <name>. ... .<name>") \
                              .wrap("Got:", spec.at) \
                              .wrap("While processing field:", 'at')
                    path = at_path+path
                # Process `mask: <mask>`.
                if spec.mask is not None:
                    if mask is not None:
                        raise Error("Got entity mask specified twice:", mask) \
                              .wrap("And:", spec.mask)
                    mask = spec.mask
                # Process `filters: [<name>(...) := <expr>, ...]`.
                filters = []
                for syntax in spec.filters or []:
                    name_parameters_expression = as_filter(syntax)
                    if name_parameters_expression is None:
                        raise Error("Expected an HTSQL expression of the form:",
                                    "<name>($<param>, ...) := <expr>") \
                              .wrap("Got:", syntax) \
                              .wrap("While processing field:", 'filters')
                    filters.append(name_parameters_expression)
                # Process `select: [<name>, ...]`.
                select_patterns = ['*']
                if spec.select is not None:
                    select_patterns = spec.select \
                            if isinstance(spec.select, list) \
                            else [spec.select]
                # Process `deselect: [<name>, ...]`.
                deselect_patterns = []
                if spec.deselect is not None:
                    deselect_patterns = spec.deselect \
                            if isinstance(spec.deselect, list) \
                            else [spec.deselect]
            # Process `with: [<spec>, ...]`.
            related = []
            if spec.with_:
                related = [Grow.build(with_spec) for with_spec in spec.with_]
            grow = GrowEntity(name, path, mask, filters,
                              select_patterns, deselect_patterns, related)
            set_location(grow, spec)
            return grow

        elif isinstance(spec, GrowVal.calculation_record_type):
            # Builder for a calculated expression.
            with guard("While parsing:", locate(spec) or spec):
                # Process `calculation: <path>.<name>`
                # or `calculation: <path>.<name> := <expression>`.
                name_path_expression = as_calculation(spec.calculation)
                name_path = as_name(spec.calculation)
                if name_path_expression is not None:
                    if spec.expression:
                        raise Error("Got calculation expression"
                                    " specified twice:", spec.calculation) \
                              .wrap("And:", spec.expression)
                    name, path, expression = name_path_expression
                elif name_path is not None:
                    if not spec.expression:
                        raise Error("Got missing calculation expression")
                    name, path = name_path
                    expression = spec.expression
                else:
                    raise Error("Expected an HTSQL expression of the form:",
                                "<name> OR <name>. ... .<name>"
                                " OR <name> := <expr>") \
                          .wrap("Got:", spec.calculation) \
                          .wrap("While processing field:", 'calculation')
                # Process `at: <path>`.
                if spec.at is not None:
                    at_path = as_path(spec.at)
                    if at_path is None:
                        raise Error("Expected an HTSQL expression of the form:",
                                    "<name> OR <name>. ... .<name>") \
                              .wrap("Got:", spec.at) \
                              .wrap("While processing field:", 'at')
                    path = at_path+path
            grow = GrowCalculation(name, path, expression)
            set_location(grow, spec)
            return grow

        elif isinstance(spec, GrowVal.parameter_record_type):
            # Builder for parameter definition.
            with guard("While parsing:", locate(spec) or spec):
                # Process `parameter: <name>` or
                # `parameter: $<name>` or `parameter: $<name> := <val>`.
                name = as_reference(spec.parameter)
                name_value = as_parameter(spec.parameter)
                if name is not None:
                    value = Value(UntypedDomain(), None)
                    if spec.default is not None:
                        try:
                            value = Embed.__invoke__(spec.default)
                        except (TypeError, ValueError) as exc:
                            raise Error("Got invalid default value:", exc) \
                                  .wrap("While processing field:", 'default')
                elif name_value is not None:
                    name, value = name_value
                    if spec.default is not None:
                        raise Error("Got default value"
                                    " specified twice:", spec.parameter) \
                              .wrap("And:", spec.default)
                else:
                    raise Error("Expected an HTSQL expression of the form:",
                                "<name> OR $<name> OR $<name> := <val>") \
                          .wrap("Got:", spec.parameter) \
                          .wrap("While processing field:", 'parameter')
            grow = GrowParameter(name, value)
            set_location(grow, spec)
            return grow

        else:
            # Not reachable.
            raise NotImplementedError()

    def __call__(self, parent):
        # Takes an arm, returns an amended arm with a subtree added.
        raise NotImplementedError()


class GrowSequence(Grow):
    # Grows a sequence of arms.

    def __init__(self, sequence):
        self.sequence = sequence

    def __call__(self, parent):
        for grow in self.sequence:
            parent = grow(parent)
        return parent


class GrowEntity(Grow):
    # Grows an entity arm.

    def __init__(self, name, path, mask=None, filters=[],
                 select_patterns=['*'], deselect_patterns=[], related=[]):
        # The name of the entity (table or link).
        self.name = name
        # Path to the parent.
        self.path = path
        # Unconditional filter expression.
        self.mask = mask
        # Conditional filters.
        self.filters = filters
        # Columns and links to include.
        self.select_patterns = select_patterns
        # Columns and links to exclude.
        self.deselect_patterns = deselect_patterns
        # Other builders to run.
        self.related = related

    def __call__(self, parent):
        try:
            # Follow the path over the arm tree.
            chain = []
            for name in self.path:
                if name not in parent:
                    raise Error("Unable to find arm:", name) \
                          .wrap("While following path:", ".".join(self.path))
                chain.append(parent)
                parent = parent[name]
            # Find the attribute on the parent arm and verify if it is indeed
            # an entity.
            label = parent.label(self.name)
            if label is None:
                raise Error("Got unknown entity:", self.name)
            arm_arc = label.arc
            if isinstance(arm_arc, TableArc):
                arm_class = TrunkArm
            elif (isinstance(arm_arc, ChainArc) and
                  len(arm_arc.joins) == 1 and
                  arm_arc.joins[0].is_reverse):
                [join] = arm_arc.joins
                if join.is_contracting:
                    arm_class = FacetArm
                else:
                    arm_class = BranchArm
            elif (isinstance(arm_arc, ChainArc) and
                  len(arm_arc.joins) == 1 and
                  arm_arc.joins[0].is_direct):
                [join] = arm_arc.joins
                arm_class = JoinArm
            else:
                raise Error("Got unknown entity:", self.name)
            # Find columns and links.
            arms = []
            calculations = []
            for label in classify(arm_arc.target):
                if not any(fnmatch.fnmatchcase(label.name, pattern) and
                           (pattern != '*' or label.is_public)
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
                elif isinstance(arc, SyntaxArc) and arc.parameters is None:
                    calculation = GrowCalculation(label.name, (), arc.syntax)
                    calculations.append(calculation)
            # Entity mask.
            mask = Mask(self.mask) if self.mask is not None else None
            # Conditional filters.
            filters = [(name, Filter(parameters, expression))
                       for name, parameters, expression in self.filters]
            # Create the arm object.
            if self.name in parent:
                raise Error("Got entity that has already been added:",
                            self.name)
            arm = arm_class(arm_arc, arms, mask, filters, parent.parameters)
        except Error as error:
            location = locate(self)
            if location is not None:
                error.wrap("While applying:", location)
            raise
        # Apply nested builders.
        for grow in self.related + calculations:
            arm = grow(arm)
        # Rebuild the chain of parents.
        parent = parent.grow(arms=[(self.name, arm)])
        for arm, name in reversed(list(zip(chain, self.path))):
            parent = arm.grow(arms=[(name, parent)])
        return parent


class GrowCalculation(Grow):
    # Grows a calculation arm.

    def __init__(self, name, path, syntax):
        # The name of the attribute.
        self.name = name
        # Path to the parent.
        self.path = path
        # HTSQL expression.
        self.syntax = syntax

    def __call__(self, parent):
        try:
            # Follow the path over the arm tree.
            chain = []
            for name in self.path:
                if name not in parent:
                    raise Error("Unable to find arm:", name) \
                          .wrap("While following path:", ".".join(self.path))
                chain.append(parent)
                parent = parent[name]
            if not isinstance(parent, (RootArm, TableArm)):
                raise Error("Unable to add calculation to a non-entity")
            # Verify that the expression is well-formed and determine
            # its domain.
            try:
                state = BindingState(RootBinding(VoidSyntax()))
                # We have to supply $USER and other variables.
                recipe = LiteralRecipe(None, UntypedDomain())
                scope = DefineReferenceBinding(state.scope, "USER", recipe,
                        state.scope.syntax)
                for name, value in sorted(parent.parameters.items()):
                    recipe = LiteralRecipe(value.data, value.domain)
                    scope = DefineReferenceBinding(
                            scope, name, recipe, scope.syntax)
                state.push_scope(scope)
                if isinstance(parent.node, TableNode):
                    recipe = prescribe(parent.arc, state.scope)
                    binding = state.use(recipe, state.scope.syntax)
                    state.push_scope(binding)
                binding = state.bind(self.syntax)
                domain = binding.domain
            except HTSQLError as exc:
                raise Error("Failed to compile an HTSQL expression:", str(exc))
            # Create the arm object.
            if self.name in parent:
                raise Error("Got calculation that has already been added:",
                            self.name)
            arm = SyntaxArm(parent.node, self.syntax, domain)
        except Error as error:
            location = locate(self)
            if location is not None:
                error.wrap("While applying:", location)
            raise
        # Rebuild the chain of parents.
        parent = parent.grow(arms=[(self.name, arm)])
        for arm, name in reversed(list(zip(chain, self.path))):
            parent = arm.grow(arms=[(name, parent)])
        return parent


class GrowParameter(Grow):
    # Add a parameter.

    def __init__(self, name, default=None):
        # The name of the parameter.
        self.name = name
        # Default value.
        if default is None:
            default = Value(UntypedDomain(), default)
        self.default = default

    def __call__(self, parent):
        try:
            # We expect a root node.
            if not isinstance(parent, RootArm):
                raise Error("Unable to add parameter to a non-root arm")
            if self.name in parent.parameters:
                raise Error("Got duplicate parameter:", self.name)
        except Error as error:
            location = locate(self)
            if location is not None:
                error.wrap("While applying:", location)
            raise
        return parent.grow(parameters={self.name: self.default})



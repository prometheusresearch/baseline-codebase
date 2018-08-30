#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension, cached, Error, guard
from .arm import (TableArm, TrunkArm, BranchArm, FacetArm, JoinArm, ColumnArm,
        LinkArm, SyntaxArm)
from .constraint import ConstraintSet, reserved_parameters
from htsql.core.util import to_name
from htsql.core.error import Error as HTSQLError
from htsql.core.domain import (UntypedDomain, BooleanDomain, NumberDomain,
        IntegerDomain, TextDomain, EnumDomain, DateDomain, TimeDomain,
        DateTimeDomain, IdentityDomain)
from htsql.core.cmd.embed import Embed
from htsql.core.tr.lookup import prescribe, identify, lookup_reference
from htsql.core.tr.binding import (LiteralBinding, IdentityBinding,
        ImplicitCastBinding, SieveBinding, FormulaBinding, DirectionBinding,
        SortBinding, DefineReferenceBinding, ClipBinding, LiteralRecipe)
from htsql.core.tr.signature import (IsEqualSig, IsInSig, NotSig, IsNullSig,
        CompareSig, AndSig, OrSig)
from htsql.core.tr.fn.signature import ContainsSig
from htsql.tweak.etl.cmd.insert import Clarify


def embed(values):
    # Converts raw values to `Value` instances.
    try:
        return [Embed.__invoke__(value) for value in values]
    except TypeError as exc:
        raise Error("Cannot recognize value:", str(exc))


def clarify(domains, values):
    # Casts input values to the respective domains.
    if isinstance(values, list):
        if isinstance(domains, list):
            # Cast:
            #   ([domain1, ...], [value1, ...]) -> [domain1(value1), ...]
            if len(domains) != len(values):
                raise Error("Got unexpected number of values:",
                            "expected %s; got %s" % (len(domains), len(values)))
            return [clarify(domain, value)
                    for domain, value in zip(domains, values)]
        else:
            # Cast:
            #   (domain, [value1, ...]) -> [domain(value1), ...]
            domain = domains
            return [clarify(domain, value) for value in values]
    else:
        # Cast:
        #   (domain, value) -> domain(value)
        domain = domains
        value = values
        convert = Clarify.__invoke__(value.domain, domain)
        if convert is None:
            raise Error("Cannot convert value of type %s to %s:"
                        % (value.domain, domain),
                        value)
        try:
            return convert(value.data)
        except ValueError as exc:
            raise Error("Failed to convert value to %s:" % domain, str(exc))


def locate(state, scope, value):
    # Generates:
    #   `scope.id()=value`

    # Prepare the left operand.
    recipe = identify(scope)
    assert recipe is not None
    identity = state.use(recipe, scope.syntax, scope=scope)
    domain = identity.domain
    lops = identity.elements
    # Prepare the right operand.
    if value.domain == domain:
        rops = value.data
    elif isinstance(value.domain, UntypedDomain):
        try:
            rops = domain.parse(value.data)
        except ValueError:
            raise Error("Failed to convert value to %s:" % domain, value)
    else:
        raise Error("Failed to convert value of type %s to %s:"
                    % (value.domain, domain), value)

    # If value is not provided, always return `False`.
    if rops is None:
        return LiteralBinding(state.scope, False, BooleanDomain(),
                              scope.syntax)

    # Generate `lops=rops`, where `lops` is an `IdentityBinding.fields`
    # and `rops` is an `IdentityDomain` value.
    def match(lops, rops):
        images = []
        for lop, rop in zip(lops, rops):
            if isinstance(lop.domain, IdentityDomain):
                images.extend(match(lop.elements, rop))
            else:
                rop = LiteralBinding(state.scope, rop, lop.domain,
                        scope.syntax)
                image = FormulaBinding(state.scope, IsEqualSig(+1),
                        BooleanDomain(), state.scope.syntax,
                        lop=lop, rop=rop)
                images.append(image)
        return images
    images = match(lops, rops)
    if len(images) == 1:
        return images[0]
    else:
        return FormulaBinding(state.scope, AndSig(), BooleanDomain(),
                state.scope.syntax, ops=images)


def ensure(arm, ArmClass):
    # Verifies if `arm` is an instance of one of the Arm classes.
    if not isinstance(arm, ArmClass):
        if isinstance(ArmClass, tuple):
            expected = ", ".join(cls.kind for cls in ArmClass[:-1]) \
                       + " or " + ArmClass[-1].kind
        else:
            expected = ArmClass.kind
        raise Error("Got unexpected arm type:",
                    "expected %s; got %s" % (expected, arm.kind))


class Condition(Extension):
    """
    Implements a constraint operator.
    """

    # Operator name.
    operator = None
    # The operator to use when the operator is not specified.
    default_operator = 'eq'
    # Expected arm types.
    kind = None

    @classmethod
    def enabled(cls):
        return (cls.operator is not None)

    @classmethod
    @cached
    def map_all(cls):
        # Generates a mapping:
        #   operator -> `Constraint` subclass.
        mapping = {}
        for extension in cls.all():
            assert extension.operator not in mapping, \
                    "duplicate condition: %r" % extension.operator
            mapping[extension.operator] = extension
        return mapping

    @classmethod
    def apply(cls, arm, state, constraint, binding, scope):
        # Applies the given constraint to the binding.
        condition_map = cls.map_all()
        with guard("While applying constraint:", constraint):
            operator = constraint.operator or cls.default_operator
            if operator not in condition_map:
                raise Error("Got unknown constraint operator:", operator)
            arguments = embed(constraint.arguments)
            condition = condition_map[operator](arm, state, arguments)
            if condition.kind:
                ensure(arm, condition.kind)
            return condition(binding, scope)

    def __init__(self, arm, state, arguments):
        self.arm = arm
        self.state = state
        self.arguments = arguments

    def __call__(self, binding, scope):
        # `binding` is a `Binding` object to wrap; `scope` is the arm scope;
        # `self.state.scope` is the scope of the parent arm.
        raise NotImplementedError()


class ReferenceCondition(object):
    # Implements a reference definition.

    @classmethod
    def apply(cls, arm, state, constraint, binding, scope):
        with guard("While applying constraint:", constraint):
            operator = constraint.operator
            if not (to_name(operator) in arm.parameters or
                    operator in reserved_parameters):
                raise Error("Got unknown parameter:", operator)
            arguments = embed(constraint.arguments)
            condition = cls(arm, state, operator, arguments)
            return condition(binding, scope)

    @classmethod
    def apply_missing(cls, arm, state, binding, scope):
        for name in sorted(arm.parameters)+reserved_parameters:
            name = to_name(name)
            if lookup_reference(binding, name) is not None:
                continue
            arguments = embed([arm.parameters.get(name)])
            condition = cls(arm, state, name, arguments)
            binding = condition(binding, scope)
        return binding

    def __init__(self, arm, state, name, arguments):
        self.arm = arm
        self.state = state
        self.name = name
        self.arguments = arguments

    def __call__(self, binding, scope):
        if len(self.arguments) != 1:
            raise Error("Got unexpected number of arguments:",
                        "expected 1; got %s" % len(self.arguments))
        [argument] = self.arguments
        recipe = LiteralRecipe(argument.data, argument.domain)
        binding = DefineReferenceBinding(binding, self.name, recipe,
                binding.syntax)
        return binding


class FilterCondition(object):
    # Implements a conditional filter expression on an entity arm.

    @classmethod
    def apply(cls, arm, state, constraint, binding, scope):
        with guard("While applying constraint:", constraint):
            arguments = embed(constraint.arguments)
            condition = cls(arm, state, constraint.operator, arguments)
            return condition(binding, scope)

    def __init__(self, arm, state, name, arguments):
        self.arm = arm
        self.state = state
        self.name = name
        self.arguments = arguments
        self.filter = arm.filters[name]
        self.syntax = self.filter.syntax
        self.parameters = self.filter.parameters

    def __call__(self, binding, scope):
        # Check the number of arguments.
        if len(self.parameters) != len(self.arguments):
            raise Error("Got unexpected number of arguments:",
                        "expected %s; got %s"
                        % (len(self.parameters), len(self.arguments)))
        # Add the formal parameters to the current scope.
        for parameter, argument in zip(self.parameters, self.arguments):
            recipe = LiteralRecipe(argument.data, argument.domain)
            scope = DefineReferenceBinding(scope, parameter,
                    recipe, scope.syntax)
        # Try the compile the filter expression.
        try:
            condition = self.state.bind(self.syntax, scope=scope)
        except HTSQLError:
            raise Error("Failed to compile filter:", self.name)
        # Wrap the given `binding`.
        condition = ImplicitCastBinding(condition,
                BooleanDomain(), condition.syntax)
        binding = SieveBinding(binding, condition,
                binding.syntax)
        return binding


class TopSkipCondition(object):
    # Takes a slice of a plural entity.

    @classmethod
    def apply(cls, arm, state, top_constraint, skip_constraint, binding, scope):
        constraints = []
        top_arguments = skip_arguments = None
        if top_constraint is not None:
            constraints.append(top_constraint)
            top_arguments = top_constraint.arguments
        if skip_constraint is not None:
            constraints.append(skip_constraint)
            skip_arguments = skip_constraint.arguments
        constraints = ConstraintSet(0, constraints)
        with guard("While applying constraint:", constraints):
            if top_arguments is not None:
                top_arguments = embed(top_arguments)
            if skip_arguments is not None:
                skip_arguments = embed(skip_arguments)
            condition = cls(top_arguments, skip_arguments, arm, state)
            ensure(arm, (TrunkArm, BranchArm))
            return condition(binding, scope)

    def __init__(self, top_arguments, skip_arguments, arm, state):
        self.top_arguments = top_arguments
        self.skip_arguments = skip_arguments
        self.arm = arm
        self.state = state

    def __call__(self, binding, scope):
        limit = offset = None
        if self.top_arguments is not None:
            [limit] = clarify([IntegerDomain()], self.top_arguments)
            if limit < 0:
                raise Error("Expected non-negative integer; got:", limit)
        if self.skip_arguments is not None:
            [offset] = clarify([IntegerDomain()], self.skip_arguments)
            if offset < 0:
                raise Error("Expected non-negative integer; got:", offset)
        binding = ClipBinding(self.state.scope, binding, [], limit, offset,
                binding.syntax)
        return binding


class EqualCondition(Condition):
    # Implements `=` condition.

    operator = 'eq'
    kind = (TableArm, ColumnArm, LinkArm, SyntaxArm)

    def __call__(self, binding, scope):
        # With no arguments, it is unconditional `False` expression.
        if not self.arguments:
            condition = LiteralBinding(self.state.scope, False, BooleanDomain(),
                    self.state.scope.syntax)

        # On tables, links, generate `scope.id()=arguments`.
        elif isinstance(self.arm, (TableArm, LinkArm)):
            conditions = [locate(self.state, scope, argument)
                          for argument in self.arguments]
            if len(conditions) == 1:
                [condition] = conditions
            else:
                condition = FormulaBinding(self.state.scope, OrSig(),
                        BooleanDomain(), self.state.scope.syntax,
                        ops=conditions)

        # On columns and calculated fields, generate `scope=arguments`.
        else:
            arguments = clarify(self.arm.domain, self.arguments)
            literals = [LiteralBinding(self.state.scope, argument,
                                       self.arm.domain, self.state.scope.syntax)
                        for argument in arguments]
            if len(literals) == 1:
                [literal] = literals
                condition = FormulaBinding(self.state.scope, IsEqualSig(+1),
                        BooleanDomain(), self.state.scope.syntax,
                        lop=scope, rop=literal)
            else:
                condition = FormulaBinding(self.state.scope, IsInSig(+1),
                        BooleanDomain(), self.state.scope.syntax,
                        lop=scope, rops=literals)

        return SieveBinding(binding, condition, binding.syntax)


class NullCondition(Condition):
    # Implements `is_null`.

    operator = 'null'
    kind = (FacetArm, JoinArm, ColumnArm, LinkArm, SyntaxArm)

    def __call__(self, binding, scope):
        if not self.arguments:
            argument = True
        else:
            [argument] = clarify([BooleanDomain()], self.arguments)
        if isinstance(self.arm, (TableArm, LinkArm)):
            condition = ImplicitCastBinding(scope,
                    BooleanDomain(), scope.syntax)
            if argument:
                condition = FormulaBinding(self.state.scope, NotSig(),
                        BooleanDomain(), scope.syntax, op=condition)
        else:
            polarity = 1 if argument is True else -1
            condition = FormulaBinding(self.state.scope, IsNullSig(polarity),
                    BooleanDomain(), self.state.scope.syntax, op=scope)
        return SieveBinding(binding, condition, binding.syntax)


class CompareCondition(Condition):
    # Implements `<`, `<=`, `>`, `>=`.

    operator = None
    relation = None
    kind = (ColumnArm, SyntaxArm)

    def __call__(self, binding, scope):
        domain = self.arm.domain
        if not isinstance(domain, (TextDomain, NumberDomain,
                                   DateDomain, TimeDomain, DateTimeDomain)):
            raise Error("Got unsupported %s type:" % self.arm.kind,
                        "expected text, number, date, time or datetime; "
                        "got %s" % domain)
        [argument] = clarify([domain], self.arguments)
        literal = LiteralBinding(self.state.scope, argument, domain,
                self.state.scope.syntax)
        condition = FormulaBinding(self.state.scope, CompareSig(self.relation),
                BooleanDomain(), self.state.scope.syntax,
                lop=scope, rop=literal)
        return SieveBinding(binding, condition, binding.syntax)


class LessThanCondition(CompareCondition):

    operator = 'lt'
    relation = '<'


class LessOrEqualToCondition(CompareCondition):

    operator = 'le'
    relation = '<='


class GreaterThanCondition(CompareCondition):

    operator = 'gt'
    relation = '>'


class GreaterOrEqualToCondition(CompareCondition):

    operator = 'ge'
    relation = '>='


class ContainsCondition(Condition):
    # Implements `~`.

    operator = 'contains'
    kind = (ColumnArm, SyntaxArm)

    def __call__(self, binding, scope):
        domain = self.arm.domain
        if not isinstance(domain, TextDomain):
            raise Error("Got unsupported %s type:" % self.arm.kind,
                        "expected text; got %s" % domain)
        [argument] = clarify([domain], self.arguments)
        literal = LiteralBinding(self.state.scope, argument, domain,
                self.state.scope.syntax)
        condition = FormulaBinding(self.state.scope, ContainsSig(+1),
                BooleanDomain(), self.state.scope.syntax,
                lop=scope, rop=literal)
        return SieveBinding(binding, condition, binding.syntax)


class SortCondition(Condition):
    # Implements `.sort()`.

    operator = 'sort'
    kind = (ColumnArm, SyntaxArm)

    def __call__(self, binding, scope):
        [argument] = clarify([EnumDomain(['asc', 'desc'])], self.arguments)
        direction = +1 if argument == 'asc' else -1
        condition = DirectionBinding(scope, direction, scope.syntax)
        return SortBinding(binding, [condition], None, None, binding.syntax)



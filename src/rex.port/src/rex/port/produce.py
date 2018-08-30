#
# Copyright (c) 2014, Prometheus Research, LLC
#


from .arm import RootArm, TableArm, LinkArm
from .condition import (Condition, FilterCondition, TopSkipCondition,
        ReferenceCondition)
from htsql.core.domain import Product, BooleanDomain, RecordDomain, ListDomain
from htsql.core.syn.syntax import (Syntax, VoidSyntax, IdentifierSyntax,
        StringSyntax)
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (RootBinding, AliasBinding, TitleBinding,
        SelectionBinding, CollectBinding, SieveBinding, ImplicitCastBinding,
        WrappingBinding)
from htsql.core.tr.lookup import prescribe, identify, guess_header
from htsql.core.tr.decorate import decorate
from htsql.core.tr.translate import translate
from htsql.core.fmt.accept import Accept


class Bind(object):
    # Translates a port arm to an HTSQL `Binding` object.

    def __init__(self, arm, state, constraints):
        # A node in the port tree.
        self.arm = arm
        # HTSQL binding state.
        self.state = state
        # Set of constraints at the given node.
        self.constraints = constraints
        # Constraints partitioned by subnodes.
        self.constraints_by_name = constraints.partition(arm)

    def __call__(self):
        # Generates a `Binding` object and applies constraints.

        # Generate a bare `Binding` object from the arm.
        binding = self.use()
        # For trunk and branch arms, apply constraints rooted at the arm.
        # For the root, define parameters.
        if isinstance(self.arm, RootArm) or self.arm.is_plural:
            binding = self.condition(binding)
        # Bind nested arms.
        binding = self.select(binding)
        # Trunk and branch arms are wrapped in a segment.
        if self.arm.is_plural:
            binding = CollectBinding(self.state.scope, binding,
                    ListDomain(binding.domain), binding.syntax)
        return binding

    def use(self):
        # Generates a `Binding` object from the arm.
        binding = self.state.scope
        # No-op for root arm.
        if isinstance(self.arm, RootArm):
            return binding
        # Bare binding from the arm.
        recipe = prescribe(self.arm.arc, binding)
        binding = self.state.use(recipe, binding.syntax)
        # Unmask the title for calculated nodes.
        if isinstance(binding, AliasBinding):
            base = binding
            while isinstance(base, WrappingBinding):
                if isinstance(base, TitleBinding):
                    binding = base
                    break
                base = base.base
        if isinstance(self.arm, TableArm):
            # For tables, apply the unconditional filter.
            if self.arm.mask is not None:
                condition = self.state.bind(self.arm.mask.syntax, scope=binding)
                condition = ImplicitCastBinding(condition, BooleanDomain(),
                        condition.syntax)
                binding = SieveBinding(binding, condition, binding.syntax)
        return binding

    def condition(self, binding, scope=None):
        # Applies constraints.  The scope of the arm is given when
        # it is different from the binding.
        scope = scope or binding

        # For the root node, define references.
        if isinstance(self.arm, RootArm):
            for constraint in self.constraints_by_name[None]:
                binding = ReferenceCondition.apply(self.arm, self.state,
                        constraint, binding, scope)
            binding = ReferenceCondition.apply_missing(self.arm, self.state,
                    binding, scope)
            return binding

        # Apply constraints for nested columns, links and facet tables.
        self.state.push_scope(scope)
        for name, arm in list(self.arm.arms.items()):
            if arm.is_plural:
                continue
            bind = Bind(arm, self.state, self.constraints_by_name[name])
            binding = bind.condition(binding, bind.use())
        self.state.pop_scope()

        # `:top` and `:skip` need special treatment.
        top_constraint = None
        skip_constraint = None

        # Apply arm's own constraints.
        for constraint in self.constraints_by_name[None]:
            # Handle custom table filters.
            if (isinstance(self.arm, TableArm) and
                    constraint.operator in self.arm.filters):
                binding = FilterCondition.apply(self.arm, self.state,
                        constraint, binding, scope)
            # Store `:top` and `:skip` to be applied last.
            elif constraint.operator == 'top':
                top_constraint = constraint
            elif constraint.operator == 'skip':
                skip_constraint = constraint
            # Handle regular constraints.
            else:
                binding = Condition.apply(self.arm, self.state,
                        constraint, binding, scope)

        # Apply `:top` and `:skip`.
        if top_constraint is not None or skip_constraint is not None:
            binding = TopSkipCondition.apply(self.arm, self.state,
                    top_constraint, skip_constraint, binding, scope)
        return binding

    def select(self, binding):
        # Binds nested arms.
        if not isinstance(self.arm, (RootArm, LinkArm, TableArm)):
            return binding
        recipe = identify(binding)
        # For links, return `.id()`.
        if isinstance(self.arm, LinkArm):
            header = guess_header(binding)
            binding = self.state.use(recipe, binding.syntax, scope=binding)
            if header:
                binding = TitleBinding(binding, StringSyntax(header),
                        binding.syntax)
            return binding
        self.state.push_scope(binding)
        elements = []
        # For tables, add `id := id()`.
        if recipe is not None:
            element = self.state.use(recipe, binding.syntax)
            element = AliasBinding(element, IdentifierSyntax('id'))
            elements.append(element)
        # Bind nested arms.
        for name, arm in list(self.arm.items()):
            bind = Bind(arm, self.state, self.constraints_by_name[name])
            element = bind()
            header = guess_header(element)
            element = AliasBinding(element, IdentifierSyntax(name))
            if header:
                element = TitleBinding(element, StringSyntax(header),
                        element.syntax)
            elements.append(element)
        # Create a selector expression.
        fields = [decorate(element) for element in elements]
        binding = SelectionBinding(binding, elements,
                RecordDomain(fields), binding.syntax)
        self.state.pop_scope()
        return binding


def compile(tree, constraints):
    # Generates a query execution pipeline.
    state = BindingState(RootBinding(VoidSyntax()))
    bind = Bind(tree, state, constraints)
    pipe = translate(bind())
    return pipe


def format(constraints):
    # Extracts :FORMAT parameter.
    arguments = constraints.get(((), 'FORMAT_'))
    if (arguments is not None and len(arguments) == 1 and
            isinstance(arguments[0], str)):
        content_type = arguments[0]
        return Accept.__invoke__(content_type)
    return None


def produce(tree, constraints):
    # Given a port tree and a set of constraints, produces an HTSQL output.
    pipe = compile(tree, constraints)
    product = pipe()(None)
    product.format = format(constraints)
    return product


def describe(tree, constraints):
    # Given a port tree and a set of constraints, produces output metadata.
    pipe = compile(tree, constraints)
    return Product(pipe.meta, None, format=format(constraints))



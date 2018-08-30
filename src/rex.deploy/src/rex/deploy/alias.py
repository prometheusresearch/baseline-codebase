#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, MaybeVal
from rex.db import parse_htsql
from .fact import Fact, LabelVal, SyntaxVal, AliasVal, AliasSpec
from .model import model
from htsql.core.error import Error as HTSQLError
from htsql.core.domain import UntypedDomain
from htsql.core.syn.syntax import Syntax, VoidSyntax
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (
        RootBinding, LiteralRecipe, DefineReferenceBinding)
from htsql.core.tr.lookup import lookup_attribute
import collections


class AliasFact(Fact):
    """
    Describes a calculated field.

    `table_label`: ``unicode``
        Table name.
    `label`: ``unicode``
        The name of the field.
    `parameters`: [``unicode``]
        List of parameter names.
    `body`: ``Syntax``
        Calculated expression.
    `is_present`: ``bool``
        Indicates whether the field exists.
    """

    fields = [
            ('alias', AliasVal),
            ('of', LabelVal, None),
            ('parameters', MaybeVal(SeqVal(LabelVal)), None),
            ('expression', SyntaxVal(), None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['expression']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        table_label = spec.alias.table_label
        if spec.of is not None:
            if table_label is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
            table_label = spec.of
        if table_label is None:
            raise Error("Got missing table name")
        label = spec.alias.label
        parameters = spec.alias.parameters
        if spec.parameters is not None:
            if parameters is not None and spec.parameters != parameters:
                raise Error("Got mismatched table parameters:",
                            ", ".join((str(parameters), str(spec.parameters))))
            parameters = spec.parameters
        is_present = spec.present
        body = spec.alias.body
        if spec.expression is not None:
            if body is not None:
                raise Error("Got mismatched alias expression:",
                            ", ".join((str(body), str(spec.expression))))
            body = spec.expression
        if is_present:
            if body is None:
                raise Error("Got missing clause:", "expression")
        return cls(
                table_label, label, parameters=parameters, body=body,
                is_present=is_present)

    def __init__(self, table_label, label, parameters=None, body=None,
                 is_present=True):
        assert isinstance(table_label, str) and len(table_label) > 0
        assert isinstance(label, str) and len(label) > 0
        assert (parameters is None or (
                    isinstance(parameters, list) and
                    all(isinstance(parameter, str)
                        for parameter in parameters)))
        if isinstance(body, str):
            body = parse_htsql(body)
        if is_present:
            assert isinstance(body, Syntax)
        else:
            assert body is None
        self.table_label = table_label
        self.label = label
        self.parameters = parameters
        self.body = body
        self.is_present = is_present

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.parameters is not None:
            args.append(repr(self.parameters))
        if self.body is not None:
            args.append("body=%r" % str(self.body))
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        mapping['alias'] = self.label
        if full:
            mapping['of'] = self.table_label
        if self.parameters is not None:
            mapping['parameters'] = self.parameters
        if self.body is not None:
            mapping['expression'] = str(self.body)
        if self.is_present is False:
            mapping['present'] = self.is_present
        return mapping

    def __call__(self, driver):
        schema = model(driver)
        table = schema.table(self.table_label)
        if not table:
            if self.is_present:
                raise Error("Discovered missing table:", self.table_label)
            return
        if self.is_present:
            table.enable_alias(self.label, self.parameters, self.body)
            if driver.is_locked:
                # Validate the expression.
                try:
                    with driver.get_htsql():
                        state = BindingState(RootBinding(VoidSyntax()))
                        null_recipe = LiteralRecipe(None, UntypedDomain())
                        scope = DefineReferenceBinding(
                                state.scope, "USER", null_recipe,
                                state.scope.syntax)
                        if self.parameters:
                            for parameter in self.parameters:
                                scope = DefineReferenceBinding(
                                        scope, parameter, null_recipe,
                                        scope.syntax)
                        state.push_scope(scope)
                        recipe = lookup_attribute(scope, self.table_label)
                        binding = state.use(recipe, state.scope.syntax)
                        state.push_scope(binding)
                        binding = state.bind(self.body)
                except HTSQLError as exc:
                    raise Error("Failed to compile HTSQL expression:", str(exc))
        else:
            table.disable_alias(self.label, self.parameters)



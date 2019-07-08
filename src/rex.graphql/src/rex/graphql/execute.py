"""

    rex.graphql.execute
    ===================

    Execute GraphQL queries against schemas.

    Based on code from ``graphql`` package.

    :copyright: 2016 GraphQL Python
    :copyright: 2019-present Prometheus Research, LLC

"""

import sys
import json
import typing
import traceback
import typing as t
from collections import Iterable, OrderedDict, Mapping

from htsql.core.tr.bind import BindingState, Select
from htsql.core.tr.translate import translate
from htsql.core.tr.decorate import decorate
from htsql.core.tr import binding
from htsql.core.syn import syntax
from htsql.core import domain

from graphql import language, error

from rex.logging import get_logger
from rex.core import get_sentry
from rex.query.query import ApplySyntax, LiteralSyntax
from rex.db import get_db
from rex.query.bind import RexBindingState
from .schema import Schema
from .input_coercion import (
    coerce_input_value,
    coerce_input_node,
    undefined,
    are_types_compatible,
)
from . import model, desc, introspection
from .query import q


logger = get_logger("rex.graphql.execute")


class VariableValue:
    __slots__ = ("type", "value", "node")

    def __init__(self, type, value, node):
        self.type = type
        self.value = value
        self.node = node

    def __str__(self):
        return f"VariableValue(type={self.type}, value={self.value!r})"


class ExecutionInfo:
    __slots__ = (
        "field_name",
        "field_nodes",
        "return_type",
        "parent_type",
        "schema",
        "fragments",
        "root_value",
        "operation",
        "variable_values",
        "context",
        "path",
    )

    def __init__(
        self,
        field_name: str,
        field_nodes: typing.List[language.ast.Field],
        return_type: model.Type,
        parent_type: model.ObjectType,
        schema: Schema,
        fragments: typing.Dict,
        root_value: typing.Optional[typing.Any],
        operation,
        variable_values: typing.Dict,
        context: typing.Optional[typing.Any],
        path: typing.List[str],
    ):
        # type: (...) -> None
        self.field_name = field_name
        self.field_nodes = field_nodes
        self.return_type = return_type
        self.parent_type = parent_type
        self.schema = schema
        self.fragments = fragments
        self.root_value = root_value
        self.operation = operation
        self.variable_values = variable_values
        self.context = context
        self.path = path or []


class Result:
    """ Result of a GraphQL query execution.

    :attribute data: Produced data. Set to ``None`` if result is invalid.
    :attribute errors: Errors collected during query execution.
    :attribute invalid: If result is invalid.
    """

    __slots__ = ("data", "errors", "invalid")

    def __init__(self, data=None, errors=None, invalid=False):
        self.data = data
        self.errors = errors

        if invalid:
            assert data is None

        self.invalid = invalid

    def __eq__(self, other):
        return self is other or (
            isinstance(other, Result)
            and self.data == other.data
            and self.errors == other.errors
            and self.invalid == other.invalid
        )

    def to_dict(self):
        response = {}
        if self.errors:
            response["errors"] = [error.format_error(e) for e in self.errors]

        if not self.invalid:
            response["data"] = self.data

        return response


class ExecutionContext:
    """ ExecutionContext object is passed through the whole execution pipeline.
    """

    def __init__(
        self,
        schema: Schema,
        document_node: language.ast.Document,
        root_value: typing.Any,
        context_value: typing.Any,
        variable_values: typing.Dict[str, typing.Any],
        operation_name: typing.Optional[str],
    ):
        operation = None
        fragments = {}

        for definition in document_node.definitions:
            if isinstance(definition, language.ast.OperationDefinition):
                if not operation_name and operation:
                    raise error.GraphQLError(
                        "Must provide operation name if query contains"
                        " multiple operations."
                    )

                if (
                    not operation_name
                    or definition.name
                    and definition.name.value == operation_name
                ):
                    operation = definition

            elif isinstance(definition, language.ast.FragmentDefinition):
                fragments[definition.name.value] = definition

            else:
                definition_name = definition.__class__.__name__
                raise error.GraphQLError(
                    f"GraphQL cannot execute a request containing"
                    f" a {definition_name}.",
                    definition,
                )

        if not operation:
            if operation_name:
                raise error.GraphQLError(
                    f'Unknown operation named "{operation_name}"'
                )

            else:
                raise error.GraphQLError("Must provide an operation.")

        variable_values = get_variable_values(
            schema, operation.variable_definitions or [], variable_values
        )

        self.schema = schema
        self.fragments = fragments
        self.root_value = root_value
        self.operation = operation
        self.variable_values = variable_values
        self.errors = []
        self.context_value = context_value
        self._arguments_cache = {}
        self._subfields_cache = {}

    def get_param_values(
        self, parent, field: model.Field, field_node: language.ast.Field
    ):
        k = field, field_node
        if k not in self._arguments_cache:
            self._arguments_cache[k] = get_param_values(
                self,
                parent,
                field.params,
                field_node.arguments,
                self.variable_values,
            )

        return self._arguments_cache[k]

    def raise_error(self, msg, exc_info=None):
        if exc_info is not None:
            type, value, tb = exc_info
            exception = traceback.format_exception(type, value, tb)
            logger.error("".join(exception))
        # TODO: collect errors instead
        # self.errors.append(error.GraphQLError(msg))
        raise error.GraphQLError(msg)

    def get_sub_fields(self, return_type, field_nodes):
        # type: (GraphQLObjectType, List[Field]) -> DefaultOrderedDict
        k = return_type, tuple(field_nodes)
        if k not in self._subfields_cache:
            subfield_nodes = {}
            for field_node in field_nodes:
                selection_set = field_node.selection_set
                if selection_set:
                    subfield_nodes = collect_fields(
                        self, return_type, selection_set, subfield_nodes
                    )
            self._subfields_cache[k] = subfield_nodes
        return self._subfields_cache[k]


def collect_fields(
    ctx: ExecutionContext,
    runtime_type: model.Type,
    selection_set,  # type: SelectionSet
    fields: typing.Dict,
):
    for selection in selection_set.selections:
        directives = selection.directives

        if isinstance(selection, language.ast.Field):
            # TODO:
            # if not should_include_node(ctx, directives):
            #     continue

            if selection.alias:
                name = selection.alias.value
            else:
                name = selection.name.value

            if name in fields:
                fields[name].append(selection)
            else:
                fields[name] = [selection]

        elif isinstance(selection, language.ast.InlineFragment):
            # TODO:
            # if not should_include_node(
            #     ctx, directives
            # ) or not does_fragment_condition_match(ctx, selection, runtime_type):
            #     continue

            collect_fields(ctx, runtime_type, selection.selection_set, fields)

        elif isinstance(selection, language.ast.FragmentSpread):
            frag_name = selection.name.value

            # TODO:
            # if frag_name in prev_fragment_names or not should_include_node(
            #     ctx, directives
            # ):
            #     continue

            # prev_fragment_names.add(frag_name)
            fragment = ctx.fragments[frag_name]
            frag_directives = fragment.directives

            # TODO:
            # if (
            #     not fragment
            #     or not should_include_node(ctx, frag_directives)
            #     or not does_fragment_condition_match(
            #         ctx, fragment, runtime_type
            #     )
            # ):
            #     continue

            collect_fields(ctx, runtime_type, fragment.selection_set, fields)

    return fields


def get_param_values(
    ctx: ExecutionContext,
    parent: t.Any,
    params: t.Dict[str, desc.Param],
    arg_nodes: t.List[language.ast.Argument],
    variables: t.Optional[t.Dict[str, t.Any]] = None,
) -> t.Dict[str, t.Any]:
    if not params:
        return {}

    if not arg_nodes:
        arg_node = []

    arg_node_map = {arg.name.value: arg for arg in arg_nodes}
    result = {}

    for name, param in params.items():
        if isinstance(param, desc.Argument):
            arg_type = param.type
            arg_name = param.out_name or name
            arg_node = arg_node_map.get(name)
            if name not in arg_node_map:
                if param.default_value is not None:
                    result[arg_name] = param.default_value
                elif isinstance(arg_type, model.NonNullType):
                    raise error.GraphQLError(
                        f'Argument "{name}" of required type {arg_type}"'
                        f" was not provided.",
                        nodes=arg_nodes,
                    )
            elif isinstance(arg_node.value, language.ast.Variable):
                variable_name = arg_node.value.name.value
                if variables and variable_name in variables:
                    variable = variables[variable_name]
                    if not are_types_compatible(
                        var_type=variable.type, loc_type=arg_type
                    ):
                        raise error.GraphQLError(
                            f'Variable "${variable_name} : {variable.type}" is attempted'
                            f' to be used as a value of incompatible type "{arg_type}"',
                            nodes=[arg_node, variable.node],
                        )
                    result[arg_name] = variable.value
                elif param.default_value is not None:
                    result[arg_name] = param.default_value
                elif isinstance(arg_type, model.NonNullType):
                    raise error.GraphQLError(
                        f'Argument "{name} : {arg_type}"'
                        f' (supplied by "${variable_name}" variable)'
                        f" was not provided",
                        nodes=arg_nodes,
                    )
            else:
                value = coerce_input_node(
                    arg_type,
                    arg_node.value,
                    variables=variables,
                    message=f'Argument "{arg_name} : {arg_type}"',
                )
                if value is None:
                    if param.default_value is not None:
                        value = param.default_value
                        result[arg_name] = value
                else:
                    result[arg_name] = value
        elif isinstance(param, desc.ComputedParam):
            try:
                param_value = param.compute(parent, ctx.context_value)
            except Exception as err:
                get_sentry().captureException()
                ctx.raise_error(
                    msg=f"Error while computing param {param.name}",
                    exc_info=sys.exc_info(),
                )
            if param.type is not None:
                message = f'Parameter "{param.name}" got invalid value:'
                param_value = coerce_input_value(
                    param.type, param_value, message=message, nodes=[]
                )
            result[param.name] = param_value

    # Check for extra args
    extra_args = []
    for name in arg_node_map:
        if not isinstance(params.get(name), desc.Argument):
            extra_args.append(name)
    if extra_args:
        names = ", ".join(f'"{name}"' for name in extra_args)
        raise error.GraphQLError(
            f"The following arguments: {names} are not allowed for this field",
            nodes=arg_nodes,
        )

    return result


def get_variable_values(schema: Schema, definition_nodes, inputs):
    """ Extract variables values.

    Prepares an object map of variables of the correct type based on the
    provided variable definitions and arbitrary input.

    If the input cannot be parsed to match the variable definitions or there are
    unused inputs, a :class:`GraphQLError` will be thrown.
    """

    if inputs is None:
        inputs = {}

    inputs_seen = set()

    values = {}
    for def_node in definition_nodes:
        var_name = def_node.variable.name.value
        var_type = type_from_node(schema, def_node.type)

        inputs_seen.add(var_name)
        value = inputs.get(var_name, undefined)

        if not model.is_input_type(var_type):
            var_type = language.printer.print_ast(def_node.type)
            raise error.GraphQLError(
                f'Variable "${var_name} : {var_type}"'
                f" is invalid as {var_type} cannot be used as a variable type.",
                nodes=[def_node],
            )

        if value is undefined or value is None:
            if def_node.default_value is not None:
                var_value = coerce_input_node(
                    var_type,
                    def_node.default_value,
                    variables=None,
                    message=(
                        f'Variable "${var_name} : {var_type}" has'
                        f" invalid default value"
                    ),
                )
                values[var_name] = VariableValue(
                    value=var_value, type=var_type, node=def_node
                )
            elif isinstance(var_type, model.NonNullType):
                raise error.GraphQLError(
                    f'Variable "${var_name} : {var_type}" was'
                    f" not provided.",
                    nodes=[def_node],
                )
        else:
            var_value = coerce_input_value(
                var_type,
                value,
                message=f'Variable "${var_name} : {var_type}" got invalid value',
                nodes=[def_node],
            )
            values[var_name] = VariableValue(
                value=var_value, type=var_type, node=def_node
            )

    # Check for unexpected inputs.
    inputs_all = set(inputs)
    if inputs_all - inputs_seen:
        names = ", ".join(f'"{name}"' for name in inputs_all)
        raise error.GraphQLError(f"Unexpected variables: {names}")

    return values


def type_from_node(schema, type_node):
    if isinstance(type_node, language.ast.ListType):
        inner_type = type_from_node(schema, type_node.type)
        if not inner_type:
            return None
        return model.ListType(inner_type)

    elif isinstance(type_node, language.ast.NonNullType):
        inner_type = type_from_node(schema, type_node.type)
        if not inner_type:
            return None
        return model.NonNullType(inner_type)

    elif isinstance(type_node, language.ast.NamedType):
        return schema.get(type_node.name.value)

    raise Exception(
        "Unexpected type kind: {type_kind}".format(type_kind=type_node)
    )


def execute_fields(
    ctx: ExecutionContext,
    parent_type: model.Type,
    parent: None,
    fields: typing.Dict,
    path: typing.List,
    info: None,
) -> typing.Dict[str, typing.Any]:
    result = OrderedDict()

    for name, field_nodes in fields.items():
        field_result = execute_field(
            ctx=ctx,
            parent_type=parent_type,
            parent=parent,
            field_nodes=field_nodes,
            path=path + [name],
            parent_info=info,
        )
        if field_result is undefined:
            continue

        result[name] = field_result

    return result


def execute_field(
    ctx: ExecutionContext,
    parent_type: model.Type,
    parent: typing.Any,
    field_nodes: typing.List[language.ast.Field],
    path: typing.List[typing.Union[int, str]],
    parent_info: None,
) -> typing.Any:
    res = resolve_field(
        ctx=ctx,
        parent_type=parent_type,
        parent=parent,
        field_nodes=field_nodes,
        path=path,
        parent_info=parent_info,
    )
    if res is undefined:
        return undefined
    result, info, return_type = res
    return complete_value(ctx, return_type, field_nodes, info, path, result)


def complete_data(
    ctx: ExecutionContext,
    return_type: model.Type,
    entity_type: model.RecordType,
    field_nodes,
    info,
    path,
    data,
):
    # First unwrap the NonNull check.
    if isinstance(return_type, model.NonNullType):
        if data is None:
            raise error.GraphQLError(
                f"Cannot return null for non-nullable field {info.parent_type.name}.{info.field_name}.",
                nodes=field_nodes,
                path=path,
            )
        return complete_data(
            ctx=ctx,
            entity_type=entity_type,
            return_type=return_type.type,
            field_nodes=field_nodes,
            info=info,
            path=path,
            data=data,
        )

    # Now it's safe to return None b/c the return_type is not NonNull.
    if data is None:
        return None

    if isinstance(return_type, model.ListType):
        result = []
        for item in data:
            result.append(
                complete_data(
                    ctx=ctx,
                    entity_type=entity_type,
                    return_type=return_type.type,
                    field_nodes=field_nodes,
                    info=info,
                    path=path,
                    data=item,
                )
            )
        return result

    if isinstance(return_type, model.RecordType):
        subfield_nodes = ctx.get_sub_fields(return_type, field_nodes)
        result = OrderedDict()
        computed_fields = []
        # Process query subfields first, collect computed for later processing.
        for name, field_nodes in subfield_nodes.items():
            field_node = field_nodes[0]
            field_name = field_node.name.value
            field_def = return_type.fields.get(field_name)
            if isinstance(field_def, model.QueryField):
                item = getattr(data, name)
                result[name] = complete_value(
                    ctx=ctx,
                    return_type=field_def.type,
                    field_nodes=field_nodes,
                    info=info,
                    path=path + [name],
                    result=item,
                )
            elif isinstance(field_def, model.ComputedField):
                computed_fields.append((name, field_nodes, field_def))
            else:
                assert False, f"unknown field: {field_def!r}"
        # Now process computed subfields.
        for (name, field_nodes, field_def) in computed_fields:
            result[name] = execute_field(
                ctx=ctx,
                parent_type=return_type,
                parent=data.__id__,  # TODO: pass only data from query here
                field_nodes=field_nodes,
                path=path + [name],
                parent_info=info,
            )
        return result

    assert isinstance(return_type, (model.ScalarType, model.EnumType))

    return complete_value(
        ctx=ctx,
        return_type=return_type,
        field_nodes=field_nodes,
        info=info,
        path=path,
        result=data,
    )


def complete_value(
    ctx: ExecutionContext,
    return_type: model.Type,
    field_nodes: typing.List[language.ast.Field],
    info: None,
    path: typing.List[typing.Union[int, str]],
    result: typing.Any,
) -> typing.Any:

    # Handle exceptions first
    if isinstance(result, Exception):
        raise error.GraphQLLocatedError(
            field_nodes, original_error=result, path=path
        )

    # Now check if we are dealing with entity type
    entity_type = model.find_named_type(return_type)
    if isinstance(entity_type, model.RecordType):
        # TODO: assert isinstance(product, htsql.Product)
        return complete_data(
            ctx=ctx,
            entity_type=entity_type,
            return_type=return_type,
            field_nodes=field_nodes,
            info=info,
            path=path,
            data=result,
        )

    if isinstance(return_type, model.NonNullType):
        completed = complete_value(
            ctx=ctx,
            return_type=return_type.type,
            field_nodes=field_nodes,
            info=info,
            path=path,
            result=result,
        )
        if completed is None:
            raise error.GraphQLError(
                f"Cannot return null for non-nullable field"
                f" {info.parent_type.name}.{info.field_name}",
                nodes=field_nodes,
                path=path,
            )
        return completed

    # If result is null-like, return null.
    if result is None:
        return None

    # If field type is List, complete each item in the list with the inner type
    if isinstance(return_type, model.ListType):
        assert isinstance(result, Iterable), (
            f"User Error: expected iterable, but did not find one "
            + f"for field {info.parent_type.name}.{info.field_name}."
        )

        item_type = return_type.type
        completed_results = []

        index = 0
        for item in result:
            completed_item = complete_value(
                ctx=ctx,
                return_type=item_type,
                field_nodes=field_nodes,
                info=info,
                path=path + [index],
                result=item,
            )
            completed_results.append(completed_item)
            index += 1

        return completed_results

    # If field type is Scalar or Enum, serialize to a valid value, returning
    # null if coercion is not possible.
    if isinstance(return_type, (model.ScalarType, model.EnumType)):
        assert hasattr(
            return_type, "serialize"
        ), f"Missing serialize method on type {return_type}"
        serialized_result = return_type.serialize(result)

        if serialized_result is None:
            raise error.GraphQLError(
                f'Expected a value of type "{return_type}" but received: {result}',
                path=path,
            )
        return serialized_result

    # TODO:
    # if isinstance(
    #     return_type, (type.GraphQLInterfaceType, type.GraphQLUnionType)
    # ):
    #     raise NotImplementedError(
    #         "found GraphQLInterfaceType or GraphQLUnionType"
    #     )

    if isinstance(return_type, model.ObjectType):
        # TODO:
        # if return_type.is_type_of and not return_type.is_type_of(result, info):
        #     raise graphql.error.GraphQLError(
        #         'Expected value of type "{}" but got: {}.'.format(
        #             return_type, type(result).__name__
        #         ),
        #         field_nodes,
        #     )

        # Collect sub-fields to execute to complete this value.
        subfield_nodes = ctx.get_sub_fields(return_type, field_nodes)
        return execute_fields(
            ctx=ctx,
            parent_type=return_type,
            parent=result,
            fields=subfield_nodes,
            path=path,
            info=info,
        )

    assert False, 'Cannot complete value of unexpected type "{}".'.format(
        return_type
    )


def resolve_field(
    ctx: ExecutionContext,
    parent_type: model.ObjectType,
    parent: typing.Any,
    field_nodes: typing.List[language.ast.Field],
    path: typing.List[typing.Union[int, str]],
    parent_info: None,
) -> typing.Any:
    field_node = field_nodes[0]
    field_name = field_node.name.value

    field_def = parent_type.fields.get(field_name)
    if not field_def:
        raise error.GraphQLError(
            f"Unknown field '{field_name}'", nodes=field_nodes
        )

    return_type = field_def.type

    # The resolve function's optional third argument is a context value that is
    # provided to every resolve function within an execution. It is commonly
    # used to represent an authenticated user, or request-specific caches.
    context = ctx.context_value

    # The resolve function's optional third argument is a collection of
    # information about the current execution state.
    info = ExecutionInfo(
        field_name=field_name,
        field_nodes=field_nodes,
        return_type=return_type,
        parent_type=parent_type,
        schema=ctx.schema,
        fragments=ctx.fragments,
        root_value=ctx.root_value,
        operation=ctx.operation,
        variable_values=ctx.variable_values,
        context=context,
        path=path + [field_name],
    )

    if isinstance(field_def, model.ComputedField):
        # Build a dict of arguments from the field.arguments AST, using the
        # variables scope to fulfill any variable references.
        params = ctx.get_param_values(parent, field_def, field_node)
        resolve_fn = field_def.resolver
        try:
            result = resolve_fn(parent, info, params)
        except Exception as err:
            get_sentry().captureException()
            ctx.raise_error(
                msg=f"Error while executing {parent_type.name}.{field_name}",
                exc_info=sys.exc_info(),
            )
    elif isinstance(field_def, model.QueryField):
        result = execute_query_field(ctx, parent, field_def, field_nodes)
    else:
        assert False, f"unknown field type"

    return result, info, return_type


def execute_query_field(ctx, parent, field: model.QueryField, field_nodes):
    state = RexBindingState()
    binding = bind_query_field(state, ctx, parent, field, field_nodes)
    pipe = translate(binding)
    product = pipe()(None)
    return product.data


def bind_query_field(state, ctx, parent, field: model.QueryField, field_nodes):
    field_node = field_nodes[0]
    params = ctx.get_param_values(parent, field, field_node)

    # Bind GraphQL arguments
    vars = {}
    for name, arg in field.params.items():
        if name not in params:
            # It's ok since we validated arguments above
            continue
        arg_type = model.find_named_type(arg.type)
        assert arg_type is not None
        assert arg_type.bind_value is not None, f"{arg_type!r}"
        vars[name] = arg_type.bind_value(state, params[name])

    # Initial query
    query = field.descriptor.query
    if query.syn is None:
        query = q.define(__self__=q.here()).__self__

    # Apply pagination
    if field.descriptor.paginate:
        assert "limit" in params, "'limit' is not configured"
        assert "offset" in params, "'offset' is not configured"
        query = query.take(params["limit"], params["offset"])

    # Apply filters
    for filter in field.descriptor.filters:
        query = filter.apply(query, params)

    # Apply sort
    if field.descriptor.sort:
        query = query.sort(*field.descriptor.sort)

    with state.with_vars(vars):
        output = state(query.syn)
    entity_type = model.find_named_type(field.type)

    # It's not an entity, so just return
    if not isinstance(entity_type, model.RecordType):
        b = Select.__invoke__(output.binding, state)
        if field.plural:
            return binding.CollectBinding(
                state.scope,
                b,
                domain.ListDomain(b.domain),
                syntax.CollectSyntax(b.syntax),
            )
        else:
            return b

    # Descent to subfields
    subfield_nodes = ctx.get_sub_fields(entity_type, field_nodes)
    elements = []
    state.push_scope(output.binding)
    has_computed_field = False
    for name, subfield_nodes in subfield_nodes.items():
        field_name = subfield_nodes[0].name.value
        subfield = entity_type.fields.get(field_name)
        if subfield is None:
            raise error.GraphQLError(
                f"Unknown field '{field_name}'", nodes=subfield_nodes
            )
        if not isinstance(subfield, model.QueryField):
            has_computed_field = True
            continue

        element = bind_query_field(
            state, ctx, parent, subfield, subfield_nodes
        )
        element = binding.AliasBinding(element, syntax.IdentifierSyntax(name))
        elements.append(element)

    # inject `__id__ := id()` which we pass to computed fields as parent
    if has_computed_field:
        id_element = state(q.id.syn).binding
        id_element = binding.AliasBinding(
            id_element, syntax.IdentifierSyntax("__id__")
        )
        elements.append(id_element)

    # Create a selection
    b = binding.SelectionBinding(
        output.binding,
        elements,
        domain.RecordDomain([decorate(element) for element in elements]),
        syntax.SelectSyntax(
            output.binding.syntax,
            syntax.RecordSyntax([el.syntax for el in elements]),
        ),
    )
    state.pop_scope()
    b = Select.__invoke__(b, state)
    if field.plural:
        return binding.CollectBinding(
            state.scope,
            b,
            domain.ListDomain(b.domain),
            syntax.CollectSyntax(b.syntax),
        )
    else:
        return b


def execute_exn(schema, query: str, variables=None, context=None, db=None):
    document_node = language.parser.parse(query)

    ctx = ExecutionContext(
        schema=schema,
        document_node=document_node,
        root_value=None,
        context_value=context or {},
        variable_values=variables or {},
        operation_name=None,
    )
    operation = ctx.operation

    if operation.operation == "mutation":
        root_type = schema.mutation_type
    elif operation.operation == "query":
        root_type = schema.query_type
    elif operation.operation == "subscription":
        # TODO: support subscriptions
        raise NotImplementedError("GraphQL subscriptions are not supported")

    fields = collect_fields(
        ctx=ctx,
        runtime_type=root_type,
        selection_set=operation.selection_set,
        fields={},
    )

    if db is None:
        db = get_db()

    with db:
        data = execute_fields(
            ctx=ctx,
            parent_type=root_type,
            parent=ctx.root_value,
            fields=fields,
            path=[],
            info=None,
        )

    return data


def execute(
    schema: Schema,
    query: str,
    variables: t.Dict[str, t.Any] = None,
    context: t.Any = None,
    db=None,
) -> Result:
    """ Execute GraphQL query.

    This function shouldn't raise but instead return a :class:`Result` with
    either produced data or collected errors.

    :param schema: GraphQL schema
    :param query: GraphQL query
    :param variables: Variable values
    :param context:
        Context value. This is an artbitrary value which can be accessed from
        any point of computed and query fields. Use this to pass generally
        available data such as current user id.
    """
    try:
        data = execute_exn(
            schema=schema,
            query=query,
            variables=variables,
            context=context,
            db=db,
        )
        return Result(data=data)
    except error.GraphQLError as err:
        return Result(errors=[err], invalid=True)

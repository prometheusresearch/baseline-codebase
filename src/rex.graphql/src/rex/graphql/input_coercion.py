"""

    rex.graphql.input_coercion
    ==========================

    GraphQL Input Coercion

    :copyright: 2019-present Prometheus Research, LLC

"""

from collections import Iterable

from graphql import language, error
from . import model

__all__ = ("coerce_input_value", "coerce_input_node", "undefined")


def coerce_input_value(type, value, message=None, nodes=None):
    value, errors = coerce_input_value_impl(type, value)
    if errors:
        message = message or "Input"
        errors = "\n".join(errors)
        raise error.GraphQLError(message=f"{message}:\n{errors}", nodes=nodes)
    return value


def coerce_input_value_impl(type, value):
    # 3.12 NonNull: Input Coercion
    if isinstance(type, model.NonNullType):
        if value is None:
            return value, [f"Expected a value but got null"]
        return coerce_input_value_impl(type.type, value)

    if value is None:
        return None, []

    # 3.11 List: Input Coercion
    if isinstance(type, model.ListType):
        if not isinstance(value, str) and isinstance(value, Iterable):
            items = []
            errors = []
            for idx, item in enumerate(value):
                item, item_errors = coerce_input_value_impl(type.type, item)
                errors.extend(
                    [f"- At index {idx}: {err}" for err in item_errors]
                )
                items.append(item)
            return items, errors
        else:
            item, item_errors = coerce_input_value_impl(type.type, value)
            return [item], item_errors

    # 3.10 InputObjectType: Input Coercion
    if isinstance(type, model.InputObjectType):
        obj = {}
        errors = []
        for field_name, field in type.fields.items():
            field_out_name = field.out_name or field_name
            field_value = value.get(field_name, undefined)

            if field_value is undefined:
                if field.default_value is not None:
                    obj[field_out_name] = field.default_value
                elif isinstance(field.type, model.NonNullType):
                    errors.append(
                        f'Field "{type.name}.{field_name}": missing value'
                    )
                    continue
                else:
                    continue
            elif field_value is None:
                if isinstance(field.type, model.NonNullType):
                    errors.append(
                        f'Field "{type.name}.{field_name}": value could not be null'
                    )
                    continue
                else:
                    obj[field_out_name] = None
            else:
                field_value, field_errors = coerce_input_value_impl(
                    field.type, field_value
                )
                errors.extend(field_errors)
                obj[field_out_name] = field_value

        if type.descriptor.parse is not None:
            obj = type.descriptor.parse(obj)

        return obj, errors

    assert model.is_input_type(type), f"{type} is not an input type"

    try:
        coerced = type.coerce_value(value)
    except ValueError:
        return value, [f'Expected "{type}".']
    if coerced is None:
        return value, [f'Expected "{type}".']
    else:
        return coerced, []


def coerce_input_node(type, node, variables=None, message=None):
    value, errors = coerce_input_node_impl(type, node, variables)
    if errors:
        message = message or "Input"
        errors = "\n".join(errors)
        raise error.GraphQLError(message=f"{message}:\n{errors}", nodes=[node])
    return value


def coerce_input_node_impl(type, node, variables):
    # 3.12 NonNull: Input Coercion
    if isinstance(type, model.NonNullType):
        value, errors = coerce_input_node_impl(type.type, node, variables)
        if value is None:
            return None, [f"Expected a value but got null"]
        else:
            return value, errors

    if node is None:
        return None, []

    if isinstance(node, language.ast.Variable):
        variable_name = node.name.value
        if not variables or variable_name not in variables:
            return None, []
        variable = variables[variable_name]
        if not are_types_compatible(var_type=variable.type, loc_type=type):
            err = (
                f'Variable "${variable_name} : {variable.type}" is attempted'
                f' to be used as a value of incompatible type "{type}"'
            )
            return variable.value, [err]
        return variable.value, []

    if isinstance(type, model.ListType):
        if isinstance(node, language.ast.ListValue):
            errors = []
            items = []
            for idx, item_node in enumerate(node.values):
                item, item_errors = coerce_input_node_impl(
                    type.type, item_node, variables
                )
                errors.extend(
                    [f"- At index {idx}: {err}" for err in item_errors]
                )
                items.append(item)
            return items, errors
        else:
            # Lift to an one-element list
            item, errors = coerce_input_node_impl(type.type, node, variables)
            return [item], errors

    if isinstance(type, model.InputObjectType):
        if not isinstance(node, language.ast.ObjectValue):
            return {}, [f"Expected an object"]

        field_nodes = {
            field_node.name.value: field_node for field_node in node.fields
        }

        obj = {}
        errors = []
        for field_name, field in type.fields.items():
            field_out_name = field.out_name or field_name

            if field_name not in field_nodes:
                if field.default_value is not None:
                    obj[field_out_name] = field.default_value
                elif isinstance(field.type, model.NonNullType):
                    errors.append(f'Missing field "{type.name}.{field_name}"')
                continue

            field_node = field_nodes[field_name]
            field_value, field_errors = coerce_input_node_impl(
                field.type, field_node.value, variables
            )
            errors.extend(field_errors)
            obj[field_out_name] = field_value

        if type.descriptor.parse is not None:
            obj = type.descriptor.parse(obj)

        return obj, errors

    assert model.is_input_type(type)

    try:
        coerced = type.parse_literal(node)
    except ValueError:
        return None, [f'Expected "{type}".']
    if coerced is None:
        return None, [f'Expected "{type}".']
    else:
        return coerced, []


def are_types_compatible(var_type, loc_type):
    """
    1. If locationType is a non‐null type:
        a. If variableType is NOT a non‐null type, return false.
        b. Let nullableLocationType be the unwrapped nullable type of
           locationType.
        c. Let nullableVariableType be the unwrapped nullable type of
            variableType.
        d. Return AreTypesCompatible(nullableVariableType, nullableLocationType).
    2. Otherwise, if variableType is a non‐null type:
        a. Let nullableVariableType be the nullable type of variableType.
        b. Return AreTypesCompatible(nullableVariableType, locationType).
    3. Otherwise, if locationType is a list type:
        a. If variableType is NOT a list type, return false.
        b. Let itemLocationType be the unwrapped item type of locationType.
        c. Let itemVariableType be the unwrapped item type of variableType.
        d. Return AreTypesCompatible(itemVariableType, itemLocationType).
    4. Otherwise, if variableType is a list type, return false.
    5. Return true if variableType and locationType are identical, otherwise
       false.
    """
    if isinstance(loc_type, model.NonNullType):
        if not isinstance(var_type, model.NonNullType):
            return False
        return are_types_compatible(var_type.type, loc_type.type)
    elif isinstance(var_type, model.NonNullType):
        return are_types_compatible(var_type.type, loc_type)
    elif isinstance(loc_type, model.ListType):
        if not isinstance(var_type, model.ListType):
            return False
        return are_types_compatible(var_type.type, loc_type.type)
    elif isinstance(var_type, model.ListType):
        return False
    else:
        return var_type == loc_type


class undefined(object):
    def __repr__(self):
        return "undefined"


undefined = undefined()

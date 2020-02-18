"""

    rex.graphql
    ===========

    :copyright: 2019-present Prometheus Research, LLC

"""

__all__ = (
    "schema",
    "Schema",
    "SchemaConfig",
    # Abstract Base Classes
    "Type",
    "Field",
    "Param",
    # Types: Types for Computed Fields
    "Object",
    "List",
    "NonNull",
    "scalar",
    "entity_id",
    "InputObject",
    "InputObjectField",
    # Types: Types for Computed Fields: Enums
    "Enum",
    "EnumValue",
    # Types: Types for Query Fields
    "Entity",
    "Record",
    # Fields: Computed Fields
    "compute",
    "compute_from_function",
    # Fields: Query Fields
    "query",
    "connect",
    "filter_from_function",
    "sort_from_function",
    "sort",
    "q",
    # Parameters
    "argument",
    "param",
    "parent_param",
    # Mutations
    "mutation_from_function",
    "create_entity_from_function",
    "update_entity_from_function",
    "delete_entity_from_function",
    # Execution
    "execute",
    "execute_exn",
    "execute_q",
    "Result",
    "GraphQLError",
)

from graphql import GraphQLError
from rex.query.builder import q, produce as execute_q
from .desc import (
    Field,
    Type,
    Param,
    entity_id,
    scalar,
    Object,
    Entity,
    Record,
    InputObject,
    InputObjectField,
    List,
    NonNull,
    Enum,
    EnumValue,
    argument,
    param,
    parent_param,
    query,
    compute,
    connect,
    filter_from_function,
    compute_from_function,
    mutation_from_function,
    create_entity_from_function,
    update_entity_from_function,
    delete_entity_from_function,
    sort_from_function,
    sort,
)
from .execute import execute, execute_exn, Result
from .schema import schema, Schema, SchemaConfig

import rex.graphql.ctl

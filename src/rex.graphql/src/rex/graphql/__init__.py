"""

    rex.graphql
    ===========

    GraphQL API for Rex applications.

"""

__all__ = (
    "schema",
    "Field",
    "Type",
    "Object",
    "Enum",
    "EnumValue",
    "scalar",
    "NonNull",
    "List",
    "Entity",
    "Record",
    "compute",
    "query",
    "connect",
    "q",
    "argument",
    "param",
    "parent_param",
    "execute",
    "filter_from_function",
    "compute_from_function",
    "GraphQLError",
)

from graphql import GraphQLError
from .query import query as q, execute as execute_q
from .desc import (
    Field,
    Type,
    scalar,
    Object,
    Entity,
    Record,
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
)
from .execute import execute, execute_exn
from .schema import schema

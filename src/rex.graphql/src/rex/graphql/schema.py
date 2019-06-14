"""

    rex.graphql.schema
    ==================

    :copyright: 2019-present Prometheus Research, LLC

"""

import typing as t

from rex.core import Error
from rex.db import get_db, RexHTSQL

from . import introspection, model, model_scalar, desc, code_location


class Schema:
    """ GraphQL schema."""

    def __init__(self, query_type, mutation_type, types, loc):
        self.query_type = query_type
        self.mutation_type = mutation_type
        self.types = types
        self.loc = loc

    def __getitem__(self, name):
        return self.types[name]

    def get(self, name, default=None):
        return self.types.get(name, default)


def schema(
    fields: desc.FieldsType,
    mutations=None,
    db: t.Optional[t.Union[RexHTSQL, str]] = None,
    loc=desc.autoloc,
) -> Schema:
    """ Define a GraphQL schema.

    Schema is defined by supplying a set of either :func:`compute` or
    :func:`query` fields.

    Example::

        >>> sch = schema(
        ...     fields=lambda: {
        ...         'region': query(q.region, type=region),
        ...         'settings': compute(type=settings, f=get_settings)
        ...     }
        ... )

    If ``db`` argument is passed then it will be used to validate query fields
    against the database, otherwise the default database (returned via
    ``rex.db.get_db()`` will be used).

    :param fields: Fields for the root query type
    :param db: Database to use, if ``None`` then the default one is used
    """
    if not callable(fields):
        raise Error("Argument 'fields' should be a function")

    loc = code_location.here() if loc is desc.autoloc else None

    if db is None:
        db = get_db()

    query_type = desc.Object(
        name="Root",
        fields=lambda: {
            **fields(),
            # Inject introspection API.
            "__schema": introspection.schema_field,
            "__type": introspection.type_field,
        },
        description=None,
        loc=None,
    )

    if mutations:
        mutation_type = desc.Object(
            name="Mutations",
            fields=lambda: {
                mutation.name: mutation.compute for mutation in mutations
            },
            description=None,
            loc=None,
        )
    else:
        mutation_type = None

    types = {}

    for scalar_type in (
        model_scalar.id_type,
        model_scalar.string_type,
        model_scalar.boolean_type,
        model_scalar.int_type,
        model_scalar.float_type,
        model_scalar.json_type,
        model_scalar.decimal_type,
        model_scalar.date_type,
        model_scalar.datetime_type,
    ):
        types[scalar_type.name] = scalar_type

    ctx = model.RootSchemaContext(types=types, loc=loc)
    with db:
        with code_location.context(loc, desc="While configuring schema:"):
            query_type = model.construct(query_type, ctx)
            if mutation_type:
                mutation_type = model.construct(mutation_type, ctx)

    return Schema(
        query_type=query_type,
        mutation_type=mutation_type,
        types=ctx.types,
        loc=loc,
    )

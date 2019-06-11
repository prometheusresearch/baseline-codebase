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
    def __init__(self, type, types, loc):
        self.type = type
        self.types = types
        self.loc = loc

    def __getitem__(self, name):
        return self.types[name]

    def get(self, name, default=None):
        return self.types.get(name, default)


def schema(
    fields: desc.FieldsType,
    db: t.Optional[t.Union[RexHTSQL, str]] = None,
    loc=desc.autoloc,
):
    """ Define a GraphQL schema.

    :param fields: Fields for the root query type
    :param db: Database to use, if ``None`` then the default one is used

    Schema is defined by supplying a set of either :func:`compute` or
    :func:`query` fields.

    Example::

        sch = schema(
            fields=lambda: {
                'region': query(q.region, type=region),
                'settings': compute(get_settings, type=settings)
            }
        )

    If ``db`` argument is passed then it will be used to validate query fields
    against the database, otherwise the default database (returned via
    ``rex.db.get_db()`` will be used).
    """
    if not callable(fields):
        raise Error("Argument 'fields' should be a function")

    loc = code_location.here() if loc is desc.autoloc else None

    if db is None:
        db = get_db()

    type = desc.Object(
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
            type = model.construct(type, ctx)

    return Schema(type=type, types=ctx.types, loc=loc)

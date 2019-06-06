"""

    rex.graphql.schema
    ==================

    :copyright: 2019-present Prometheus Research, LLC

"""

from rex.core import Error
from rex.db import get_db

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


def schema(fields, db=None, loc=desc.autoloc):
    """ Create GraphQL schema."""
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

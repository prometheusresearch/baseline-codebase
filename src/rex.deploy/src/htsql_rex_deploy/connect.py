#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt, rank
from htsql.core.error import EngineError
from htsql.core.connect import (
        Connect, Scramble, Unscramble, ConnectionProxy, DBErrorGuard)
from .domain import JSONDomain
from .introspect import get_image, get_model
import json
import psycopg2


def translate_error(exception):
    if not hasattr(exception, 'diag') or not exception.diag:
        return
    diag = exception.diag
    from rex.deploy import label_to_title
    if diag.sqlstate == '23502':
        catalog_image = get_image()
        schema_image = catalog_image[diag.schema_name]
        table_image = schema_image[diag.table_name]
        column_image = table_image[diag.column_name]
        schema = get_model()
        column = schema(column_image)
        if column is not None:
            column_title = column.title or label_to_title(column.label)
            table_title = column.table.title or \
                    label_to_title(column.table.label)
            return ("Got a blank field value",
                    "%s . %s" % (table_title, column_title))
    if diag.sqlstate == '23505':
        catalog_image = get_image()
        schema_image = catalog_image[diag.schema_name]
        table_image = schema_image[diag.table_name]
        constraint_image = table_image.constraints[diag.constraint_name]
        schema = get_model()
        identity = schema(constraint_image)
        if identity is not None:
            table_title = identity.table.title or \
                    label_to_title(identity.table.label)
            field_titles = [field.title or label_to_title(field.label)
                            for field in identity.fields]
            if len(field_titles) == 1:
                return ("Got a duplicate identity",
                        "%s . %s" % (table_title, field_titles[0]))
            else:
                return ("Got a duplicate identity",
                        "%s . (%s)" % (
                            table_title,
                            ", ".join(field_titles)))
        else:
            column = schema(constraint_image.origin_columns[-1])
            if column is not None:
                column_title = column.title or label_to_title(column.label)
                table_title = column.table.title or \
                        label_to_title(column.table.label)
                return ("Got a duplicate field value",
                        "%s . %s" % (table_title, column_title))


class ScrambleJSON(Scramble):

    adapt(JSONDomain)

    @staticmethod
    def convert(value):
        if value is None:
            return None
        return json.dumps(
                value, indent=2, separators=(',', ': '), sort_keys=True)


class UnscrambleJSON(Unscramble):

    adapt(JSONDomain)

    @staticmethod
    def convert(value):
        if isinstance(value, str):
            value = json.loads(value)
        return value


class DeployErrorGuard(DBErrorGuard):

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if exc_type is None:
            return
        if isinstance(exc_value, Exception):
            exception = exc_value
        elif exc_value is None:
            exception = exc_type()
        elif isinstance(exc_value, tuple):
            exception = exc_type(*exc_value)
        else:
            exception = exc_type(exc_value)
        if isinstance(exception, psycopg2.Error):
            message = translate_error(exception)
            if message is not None:
                error = EngineError(*message)
                error.wrap(
                        "Which triggered an error from the database driver",
                        str(exception))
                raise error from None
            else:
                raise EngineError(
                        "Got an error from the database driver",
                        exception) from None


class DeployConnect(Connect):

    rank(10.0)

    def __call__(self):
        guard = DeployErrorGuard()
        with guard:
            connection = self.open()
        proxy = ConnectionProxy(connection, guard)
        return proxy



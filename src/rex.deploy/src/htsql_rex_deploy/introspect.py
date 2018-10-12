#
# Copyright (c) 2014, Prometheus Research, LLC
#


from htsql.core.context import context
from htsql.core.cache import once
from htsql.core.entity import make_catalog
from htsql.core.connect import connect
from htsql.core.domain import (BooleanDomain, IntegerDomain, FloatDomain,
        DecimalDomain, TextDomain, EnumDomain, DateDomain, TimeDomain,
        DateTimeDomain, OpaqueDomain)
from htsql_pgsql.core.introspect import IntrospectPGSQL
from .domain import JSONDomain


@once
def get_model():
    # Returns `rex.deploy` schema model.
    from rex.deploy import Driver, ModelSchema
    connection = connect()
    driver = Driver(connection)
    schema = ModelSchema(driver)
    # Close the connection unless we own it.
    if context.app.rex.connection is None:
        connection.close()
    else:
        connection.release()
    return schema


@once
def get_image():
    # Returns `rex.deploy` catalog image.
    schema = get_model()
    return schema.driver.get_catalog()


class IntrospectDeploy(IntrospectPGSQL):
    # Generates HTSQL catalog from rex.deploy catalog.

    def __call__(self):
        catalog_image = get_image()
        schema_image = catalog_image['public']

        catalog = make_catalog()
        schema = catalog.add_schema(schema_image.name)

        for table_image in schema_image:
            columns_with_generators = set()
            if table_image.primary_key is not None:
                from rex.deploy import uncomment
                table_meta = uncomment(table_image.primary_key)
                columns_with_generators = set([
                        column_image
                        for column_image, generator
                            in zip(table_image.primary_key,
                                   table_meta.generators or [])
                        if generator is not None])
            table = schema.add_table(table_image.name)
            for column_image in table_image:
                name = column_image.name
                type_image = column_image.type
                while type_image.is_domain:
                    type_image = type_image.base_type
                if type_image.is_enum:
                    domain = EnumDomain(type_image.labels)
                else:
                    type_code = (type_image.schema.name, type_image.name)
                    if type_code == ('pg_catalog', 'bool'):
                        domain = BooleanDomain()
                    elif type_code in [('pg_catalog', 'int2'),
                                       ('pg_catalog', 'int4'),
                                       ('pg_catalog', 'int8')]:
                        domain = IntegerDomain()
                    elif type_code == ('pg_catalog', 'numeric'):
                        domain = DecimalDomain()
                    elif type_code in [('pg_catalog', 'float4'),
                                       ('pg_catalog', 'float8')]:
                        domain = FloatDomain()
                    elif type_code in [('pg_catalog', 'bpchar'),
                                       ('pg_catalog', 'varchar'),
                                       ('pg_catalog', 'text')]:
                        domain = TextDomain()
                    elif type_code == ('pg_catalog', 'date'):
                        domain = DateDomain()
                    elif type_code in [('pg_catalog', 'time'),
                                       ('pg_catalog', 'timetz')]:
                        domain = TimeDomain()
                    elif type_code in [('pg_catalog', 'timestamp'),
                                       ('pg_catalog', 'timestamptz')]:
                        domain = DateTimeDomain()
                    elif type_code in [('pg_catalog', 'json'),
                                       ('pg_catalog', 'jsonb')]:
                        domain = JSONDomain()
                    else:
                        domain = OpaqueDomain()
                is_nullable = (not column_image.is_not_null)
                has_default = False
                if column_image.default is not None:
                    has_default = True
                if column_image in columns_with_generators:
                    has_default = True
                table.add_column(name, domain, is_nullable, has_default)

        for table_image in schema_image:
            table = schema[table_image.name]
            for unique_key_image in table_image.unique_keys:
                columns = [table[column_image.name]
                           for column_image in unique_key_image]
                table.add_unique_key(columns, unique_key_image.is_primary)
            for foreign_key_image in table_image.foreign_keys:
                target_table_image = foreign_key_image.target
                if target_table_image.schema != schema_image:
                    continue
                target_table = schema[target_table_image.name]
                columns = [table[column_image.name]
                           for column_image in foreign_key_image.origin_columns]
                target_columns = [target_table[column_image.name]
                                  for column_image
                                        in foreign_key_image.target_columns]
                table.add_foreign_key(columns, target_table, target_columns)

        return catalog



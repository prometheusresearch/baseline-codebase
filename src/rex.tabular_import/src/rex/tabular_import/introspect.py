#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.db import get_db

from rex.deploy import get_cluster, model


__all__ = (
    'get_table_description',
)


def get_column_description(field):
    description = {
        'name': field.label,
        'type': {},
        'identity': False,
        'required': field.is_required,
        'default': None,
        'unique': field.is_unique,
    }

    if field.is_column:
        if isinstance(field.type, list):
            description['type']['name'] = 'enum'
            description['type']['enumerations'] = field.type
        elif isinstance(field.type, basestring):
            description['type']['name'] = field.type
        else:  # pragma: no cover
            description['type']['name'] = 'UNKNOWN TYPE'
        description['default'] = field.default
    elif field.is_link:
        description['type']['name'] = 'link'
        description['type']['target'] = field.target_table.label

    return description


def get_table_description(table_name):
    """
    Retrieves a description of the structure of the specified table, including
    the columns, their types, and their constraints.

    :param table_name: the name of the table to retrieve the description for
    :type table_name: str
    :rtype: dict
    """

    cluster = get_cluster()
    driver = cluster.drive()
    schema = model(driver)
    table = schema.table(table_name)
    if not table:
        return None

    description = {
        'name': table.label,
        'columns': [],
    }

    with get_db():
        for field in table.fields():
            description['columns'].append(get_column_description(field))

    identity = table.identity()
    if identity is not None:
        for field, generator in zip(identity.fields, identity.generators):
            for column in description['columns']:
                if column['name'] == field.label:
                    column['identity'] = True
                    if generator:
                        column['default'] = 'generated: %s' % (generator,)

    return description


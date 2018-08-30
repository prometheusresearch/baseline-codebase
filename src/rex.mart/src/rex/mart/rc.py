#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.deploy import introspect, sql_value


__all__ = (
    'mart_incref',
    'mart_decref',
    'mart_getref',
)


def mart_incref(cluster, name):
    """
    Bumps the reference counter on a mart database, returns the new value.
    """
    connection = cluster.connect(name)
    catalog = introspect(connection.cursor())
    if 'rc' not in catalog:
        # Create table rc.rc(id, code, value) if it does not exist.
        system_schema = catalog['pg_catalog']
        int4_type = system_schema.types['int4']
        int8_type = system_schema.types['int8']
        rc_schema = catalog.create_schema('rc')
        rc_table = rc_schema.create_table(
            'rc',
            [('id', int4_type, True, None)],
        )
        rc_schema.create_sequence('rc_seq', rc_table['id'])
        rc_table.create_unique_key('rc_uk', [rc_table['id']])
        code_type = rc_schema.create_enum_type('rc_code_enum', ['-'])
        rc_table.create_column('code', code_type, True, sql_value('-'))
        rc_table.create_primary_key('rc_pk', [rc_table['code']])
        rc_table.create_column('value', int8_type, True, sql_value(1))
        rc_data = rc_table.select()
        rc_data.insert([], [])
    # Increase rc.rc.value by 1.
    rc_table = catalog['rc']['rc']
    rc_data = rc_table.select()
    row = rc_data.get(rc_table.primary_key, ('-',))
    value = row[-1] + 1
    rc_data.update(row, [rc_table['value']], [value])
    connection.commit()
    connection.close()
    return value


def mart_decref(cluster, name):
    """
    Decrease the reference counter on a mart database by 1,
    returns the new value.

    If the counter reaches 0, the mart database is dropped.
    """
    connection = cluster.connect(name)
    catalog = introspect(connection.cursor())
    value = 0
    if 'rc' in catalog:
        rc_table = catalog['rc']['rc']
        rc_data = rc_table.select()
        row = rc_data.get(rc_table.primary_key, ('-',))
        value = row[-1] - 1
        rc_data.update(row, [rc_table['value']], [value])
    connection.commit()
    connection.close()
    if value <= 0:
        cluster.drop(name)
    return value


def mart_getref(cluster, name):
    """
    Returns the number of references to the given mart database.
    """
    connection = cluster.connect(name)
    catalog = introspect(connection.cursor())
    value = 1
    if 'rc' in catalog:
        rc_table = catalog['rc']['rc']
        rc_data = rc_table.select()
        row = rc_data.get(rc_table.primary_key, ('-',))
        value = row[-1]
    connection.close()
    return value



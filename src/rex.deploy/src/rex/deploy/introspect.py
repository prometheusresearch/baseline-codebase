#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .image import (make_catalog, NO_ACTION, RESTRICT, CASCADE, SET_NULL,
        SET_DEFAULT)


conftype_to_action = {
        'a': NO_ACTION,
        'r': RESTRICT,
        'c': CASCADE,
        'n': SET_NULL,
        'd': SET_DEFAULT,
}


def introspect(connection):
    """
    Returns a catalog image that reflects the structure of the database.
    """
    cursor = connection.cursor()

    catalog = make_catalog()

    # Extract schemas.
    cursor.execute("""
        SELECT n.oid, n.nspname
        FROM pg_catalog.pg_namespace n
        ORDER BY n.nspname
    """)
    schema_by_oid = {}
    for oid, nspname in cursor.fetchall():
        schema = catalog.add_schema(nspname)
        schema_by_oid[oid] = schema

    # Extract ENUM labels.
    labels_by_oid = {}
    cursor.execute("""
        SELECT e.enumtypid, e.enumlabel
        FROM pg_catalog.pg_enum e
        ORDER BY e.enumtypid, e.enumsortorder, e.oid
    """)
    for enumtypid, enumlabel in cursor.fetchall():
        labels_by_oid.setdefault(enumtypid, []).append(enumlabel)

    # Extract data types.
    type_by_oid = {}
    cursor.execute("""
        SELECT t.oid, t.typnamespace, t.typname, t.typtype,
               t.typbasetype, t.typlen, t.typtypmod, t.typdefault
        FROM pg_catalog.pg_type t
        ORDER BY t.typnamespace, t.typname
    """)
    for (oid, typnamespace, typname, typtype,
         typbasetype, typlen, typtypmod, typdefault) in cursor.fetchall():
        schema = schema_by_oid[typnamespace]
        if typtype == 'e':
            labels = labels_by_oid[oid]
            type = schema.add_enum_type(typname, labels)
        else:
            type = schema.add_type(typname)
        type_by_oid[oid] = type

    # Extract tables.
    table_by_oid = {}
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname, c.relpersistence
        FROM pg_catalog.pg_class c
        WHERE c.relkind IN ('r', 'v') AND
              HAS_TABLE_PRIVILEGE(c.oid, 'SELECT')
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname, relpersistence in cursor.fetchall():
        schema = schema_by_oid[relnamespace]
        table = schema.add_table(relname)
        if relpersistence == 'u':
            table.set_is_unlogged(True)
        table_by_oid[oid] = table

    # Extract columns.
    column_by_num = {}
    cursor.execute("""
        SELECT a.attrelid, a.attnum, a.attname, a.atttypid, a.atttypmod,
               a.attnotnull, a.atthasdef, a.attisdropped
        FROM pg_catalog.pg_attribute a
        ORDER BY a.attrelid, a.attnum
    """)
    for (attrelid, attnum, attname, atttypid,
         atttypmod, attnotnull, atthasdef, attisdropped) in cursor.fetchall():
        if attisdropped:
            continue
        if attname in ['tableoid', 'cmax', 'xmax', 'cmin', 'xmin', 'ctid']:
            continue
        if attrelid not in table_by_oid:
            continue
        table = table_by_oid[attrelid]
        type = type_by_oid[atttypid]
        is_not_null = bool(attnotnull)
        column = table.add_column(attname, type, is_not_null)
        column_by_num[attrelid, attnum] = column

    # Extract constraints.
    constraint_by_oid = {}
    cursor.execute("""
        SELECT c.oid, c.conname, c.contype, c.confmatchtype,
               c.conrelid, c.conkey, c.confrelid, c.confkey,
               c.confupdtype, c.confdeltype
        FROM pg_catalog.pg_constraint c
        WHERE c.contype IN ('p', 'u', 'f')
        ORDER BY c.oid
    """)
    for (oid, conname, contype, confmatchtype,
            conrelid, conkey, confrelid, confkey,
            confupdtype, confdeltype) in cursor.fetchall():
        if conrelid not in table_by_oid:
            continue
        table = table_by_oid[conrelid]
        if not all((conrelid, num) in column_by_num
                   for num in conkey):
            continue
        columns = [column_by_num[conrelid, num] for num in conkey]
        if contype in ('p', 'u'):
            is_primary = (contype == 'p')
            key = table.add_unique_key(conname, columns, is_primary)
            constraint_by_oid[oid] = key
        elif contype == 'f':
            if confrelid not in table_by_oid:
                continue
            target_table = table_by_oid[confrelid]
            if not all((confrelid, num) in column_by_num for num in confkey):
                continue
            target_columns = [column_by_num[confrelid, num] for num in confkey]
            on_update = conftype_to_action[confupdtype]
            on_delete = conftype_to_action[confdeltype]
            key = table.add_foreign_key(conname, columns,
                                        target_table, target_columns,
                                        on_update=on_update,
                                        on_delete=on_delete)
            constraint_by_oid[oid] = key

    # Extract comments.
    cursor.execute("""
        SELECT CAST('pg_catalog.pg_namespace'::regclass AS OID),
               CAST('pg_catalog.pg_type'::regclass AS OID),
               CAST('pg_catalog.pg_class'::regclass AS OID),
               CAST('pg_catalog.pg_constraint'::regclass AS OID)
    """)
    pg_namespace, pg_type, pg_class, pg_constraint = cursor.fetchone()

    cursor.execute("""
        SELECT d.objoid, d.classoid, d.objsubid, d.description
        FROM pg_catalog.pg_description d
        WHERE d.classoid IN ('pg_catalog.pg_namespace'::regclass,
                             'pg_catalog.pg_type'::regclass,
                             'pg_catalog.pg_class'::regclass,
                             'pg_catalog.pg_constraint'::regclass)
        ORDER BY d.objoid, d.classoid, d.objsubid
    """)
    for objoid, classoid, objsubid, description in cursor.fetchall():
        if classoid == pg_namespace:
            entity = schema_by_oid.get(objoid)
        elif classoid == pg_type:
            entity = type_by_oid.get(objoid)
        elif classoid == pg_class and objsubid == 0:
            entity = table_by_oid.get(objoid)
        elif classoid == pg_class:
            entity = column_by_num.get((objoid, objsubid))
        elif classoid == pg_constraint:
            entity = constraint_by_oid.get(oid)
        if entity is not None:
            entity.set_comment(description)

    return catalog



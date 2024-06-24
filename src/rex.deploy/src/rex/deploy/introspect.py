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


def introspect(cursor):
    """
    Returns a catalog image that reflects the structure of the database.
    """
    catalog = make_catalog(cursor)

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

    # Extract extensions.
    cursor.execute("""
        SELECT e.extname
        FROM pg_catalog.pg_extension e
        ORDER BY e.extname
    """)
    for (extname,) in cursor.fetchall():
        catalog.add_extension(extname)

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

    # Extract stored procedures.
    procedure_by_oid = {}
    cursor.execute("""
        SELECT p.oid, p.pronamespace, p.proname,
               p.proargtypes, p.prorettype, p.prosrc
        FROM pg_catalog.pg_proc p
        ORDER BY p.pronamespace, p.proname
    """)
    for (oid, pronamespace, proname,
         proargtypes, prorettype, prosrc) in cursor.fetchall():
        schema = schema_by_oid[pronamespace]
        types = tuple([type_by_oid[int(proargtype)]
                       for proargtype in proargtypes.split()])
        return_type = type_by_oid[prorettype]
        procedure = schema.add_procedure(proname, types, return_type, prosrc)
        procedure_by_oid[oid] = procedure

    # Extract tables.
    class_by_oid = {}
    table_by_oid = {}
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname, c.relpersistence
        FROM pg_catalog.pg_class c
        WHERE c.relkind IN ('r') AND
              HAS_TABLE_PRIVILEGE(c.oid, 'SELECT')
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname, relpersistence in cursor.fetchall():
        schema = schema_by_oid[relnamespace]
        is_unlogged = (relpersistence == 'u')
        table = schema.add_table(relname, is_unlogged=is_unlogged)
        class_by_oid[oid] = table_by_oid[oid] = table

    # Extract views.
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname, pg_get_viewdef(c.oid)
        FROM pg_catalog.pg_class c
        WHERE c.relkind IN ('v') AND
              HAS_TABLE_PRIVILEGE(c.oid, 'SELECT')
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname, definition in cursor.fetchall():
        schema = schema_by_oid[relnamespace]
        table = schema.add_view(relname, definition)
        class_by_oid[oid] = table_by_oid[oid] = table

    # Extract columns.
    column_by_num = {}
    cursor.execute("""
        SELECT a.attrelid, a.attnum, a.attname, a.atttypid, a.atttypmod,
               a.attnotnull, a.atthasdef, a.attisdropped
        FROM pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        WHERE c.relkind IN ('r')
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

    # Extract default values.
    cursor.execute("""
        SELECT a.adrelid, a.adnum, pg_get_expr(a.adbin, a.adrelid)
        FROM pg_catalog.pg_attrdef a
        ORDER BY a.adrelid, a.adnum
    """)
    for adrelid, adnum, adsrc in cursor.fetchall():
        column = column_by_num.get((adrelid, adnum))
        if column is not None:
            column.set_default(adsrc)

    # Extract sequences.
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname
        FROM pg_catalog.pg_class c
        WHERE c.relkind = 'S'
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname in cursor.fetchall():
        schema = schema_by_oid[relnamespace]
        class_by_oid[oid] = schema.add_sequence(relname)

    # Associate sequences with columns that own them.
    cursor.execute("""
        SELECT d.objid, d.refobjid, d.refobjsubid
        FROM pg_catalog.pg_depend d
        JOIN pg_catalog.pg_class c
        ON (d.classid = 'pg_class'::regclass AND d.objid = c.oid)
        WHERE c.relkind = 'S' AND
              d.refclassid = 'pg_class'::regclass AND
              d.objsubid IS NOT NULL
        ORDER BY d.objid, d.refobjid, d.objsubid
    """)
    for objid, refobjid, refobjsubid in cursor.fetchall():
        sequence = class_by_oid[objid]
        column = column_by_num.get((refobjid, refobjsubid))
        column.link(sequence)

    # Extract indexes.
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname, i.indrelid, i.indkey
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_index i
        ON (c.oid = i.indexrelid)
        WHERE c.relkind = 'i'
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname, indrelid, indkeys in cursor.fetchall():
        if indrelid not in table_by_oid:
            continue
        schema = schema_by_oid[relnamespace]
        table = table_by_oid[indrelid]
        columns = [column_by_num.get((indrelid, int(indkey)))
                   for indkey in indkeys.split()]
        class_by_oid[oid] = schema.add_index(relname, table, columns)

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
            # Each `UNIQUE` constraint own an index with the same name.
            index = table.schema.indexes.get(conname)
            if index is not None:
                key.link(index)
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

    # Extract triggers.
    trigger_by_oid = {}
    cursor.execute("""
        SELECT t.oid, t.tgrelid, t.tgname, t.tgfoid
        FROM pg_catalog.pg_trigger AS t
        WHERE NOT t.tgisinternal
        ORDER BY t.tgrelid, t.tgname
    """)
    for oid, tgrelid, tgname, tgfoid in cursor.fetchall():
        table = table_by_oid[tgrelid]
        procedure = procedure_by_oid[tgfoid]
        trigger_by_oid[oid] = table.add_trigger(tgname, procedure)

    # Extract comments.
    cursor.execute("""
        SELECT CAST('pg_catalog.pg_namespace'::regclass AS OID),
               CAST('pg_catalog.pg_type'::regclass AS OID),
               CAST('pg_catalog.pg_proc'::regclass AS OID),
               CAST('pg_catalog.pg_class'::regclass AS OID),
               CAST('pg_catalog.pg_constraint'::regclass AS OID),
               CAST('pg_catalog.pg_trigger'::regclass AS OID)
    """)
    (pg_namespace, pg_type, pg_proc,
     pg_class, pg_constraint, pg_trigger) = cursor.fetchone()

    cursor.execute("""
        SELECT d.objoid, d.classoid, d.objsubid, d.description
        FROM pg_catalog.pg_description d
        WHERE d.classoid IN ('pg_catalog.pg_namespace'::regclass,
                             'pg_catalog.pg_type'::regclass,
                             'pg_catalog.pg_proc'::regclass,
                             'pg_catalog.pg_class'::regclass,
                             'pg_catalog.pg_constraint'::regclass,
                             'pg_catalog.pg_trigger'::regclass)
        ORDER BY d.objoid, d.classoid, d.objsubid
    """)
    for objoid, classoid, objsubid, description in cursor.fetchall():
        if classoid == pg_namespace:
            entity = schema_by_oid.get(objoid)
        elif classoid == pg_type:
            entity = type_by_oid.get(objoid)
        elif classoid == pg_proc:
            entity = procedure_by_oid.get(objoid)
        elif classoid == pg_class and objsubid == 0:
            entity = class_by_oid.get(objoid)
        elif classoid == pg_class:
            entity = column_by_num.get((objoid, objsubid))
        elif classoid == pg_constraint:
            entity = constraint_by_oid.get(objoid)
        elif classoid == pg_trigger:
            entity = trigger_by_oid.get(objoid)
        if entity is not None:
            entity.set_comment(description)

    return catalog



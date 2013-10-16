#
# Copyright (c) 2013, Prometheus Research, LLC
#


import decimal
import datetime
import hashlib


def mangle(fragments, suffix=None,
           max_length=63,
           forbidden_prefixes=[u"pg"],
           forbidden_suffixes=[u"id", u"pk", u"uk", u"fk", u"chk", u"enum"]):
    """
    Generates a SQL name from fragments and a suffix.

    `fragment`
        A word or a list of words from which the name is generated.
    `suffix`
        Optional ending.

    :func:`mangle` joins the fragments and the suffix with ``_``.  If necessary,
    it mangles the name to fit the limit on number of characters and avoid naming
    collisions.
    """
    # Accept a single word too.
    if not isinstance(fragments, (list, tuple)):
        fragments = [fragments]
    # Make a separator that is not contained in any fragments.
    separator = u"_"
    while any(separator in fragment for fragment in fragments):
        separator += u"_"
    # Generate the name
    stem = separator.join(fragments)
    text = stem
    if suffix is not None:
        text += separator+suffix
    # Find if the name is collision-prone.
    is_forbidden = (any(stem == syllable or stem.startswith(syllable+u"_")
                        for syllable in forbidden_prefixes) or
                    (suffix is None and
                     any(stem == syllable or stem.endswith(u"_"+syllable)
                         for syllable in forbidden_suffixes)))
    # Mangle the name if it's too long or collision-prone.
    if is_forbidden or len(text) > max_length:
        # Add 6 characters from the MD5 hash to prevent collisions.
        digest = separator+unicode(hashlib.md5(stem).hexdigest()[:6])
        # Cut some characters to reduce the name length if necessary.
        if len(text)+len(digest) > max_length:
            cut_start = max_length/4
            cut_end = cut_start+len(digest)+len(separator)+len(text)-max_length
            text = text[:cut_start]+separator+text[cut_end:]
        text += digest
        assert len(text) <= max_length
    return text


def sql_name(names):
    """
    Quotes a SQL name or a list of names.

    `names`
        Identifier or a list of identifiers.

    *Returns:* a comma-separated list of quoted identifiers.
    """
    if not isinstance(names, (list, tuple)):
        names = [names]
    return u", ".join(u"\"%s\"" % name.replace(u"\"", u"\"\"")
                      for name in names)


def sql_value(value):
    """
    Converts a value to a SQL literal.

    `value`
        Represents a SQL value.  Could be ``None`` or a value of type
        ```bool``, ``int``, ``long``, ``float``, ``decimal.Decimal``, ``str``
        or ``unicode``.  Could also be a list or a tuple of values.
    """
    if value is None:
        return u"NULL"
    if isinstance(value, bool):
        if value is True:
            return u"TRUE"
        if value is False:
            return u"FALSE"
    if isinstance(value, (int, long, float, decimal.Decimal)):
        # FIXME: accept finite numbers only.
        return unicode(value)
    if isinstance(value, (datetime.date, datetime.datetime)):
        return u"'%s'" % value
    if isinstance(value, (str, unicode)):
        value = value.replace(u"'", u"''")
        if u"\\" in value:
            value = value.replace(u"\\", u"\\\\")
            return u"E'%s'" % value
        else:
            return u"'%s'" % value
    if isinstance(value, (list, tuple)):
        return u", ".join(sql_value(item) for item in value)
    raise NotImplementedError("sql_value() is not implemented"
                              " for values of type %s" % type(value).__name__)


def sql_create_database(name):
    """
    Generates ``CREATE DATABASE`` statement.

    `name`
        Database name.
    """
    # Generates `CREATE DATABASE` statement.
    return u"CREATE DATABASE {} WITH ENCODING = 'UTF-8';" \
            .format(sql_name(name))


def sql_drop_database(name):
    """
    Generates ``DROP DATABASE`` statement.

    `name`
        Database name.
    """
    return u"DROP DATABASE {};".format(sql_name(name))


def sql_select_database(name):
    """
    Generates a ``SELECT`` statement that returns a row if the database
    with the given name exists.

    `name`
        Database name.
    """
    return u"SELECT TRUE FROM pg_catalog.pg_database AS d" \
            u" WHERE d.datname = {};" \
            .format(sql_value(name))


def sql_create_table(name, body):
    """
    Generates ``CREATE TABLE`` statement.

    `name`
        Table name.
    `body`
        Table body, a list of lines.
    """
    lines = []
    lines.append(u"CREATE TABLE {} (".format(sql_name(name)))
    for body_line in body[:-1]:
        lines.append(u"    {},".format(body_line))
    lines.append(u"    {}".format(body[-1]))
    lines.append(u");")
    return u"\n".join(lines)


def sql_drop_table(name):
    """
    Generates ``DROP TABLE`` statement.

    `name`
        Table name.
    """
    return "DROP TABLE {};".format(sql_name(name))


def sql_define_column(name, type_name, is_not_null):
    """
    Generates column definition for ``CREATE TABLE`` statement.

    `name`
        Column name.
    `type_name`
        Column type or a tuple of column type and type parameters.
    `is_not_null`
        If set, add ``NOT NULL`` constraint.
    """
    # Generates column definition for `CREATE TABLE` body.
    return u"{} {}{}" \
            .format(sql_name(name),
                    sql_name(type_name)
                        if not isinstance(type_name, tuple)
                        else u"{}({})"
                                .format(sql_name(type_name[0]),
                                        sql_value(type_name[1:])),
                    u" NOT NULL" if is_not_null else u"")


def sql_add_column(table_name, name, type_name, is_not_null):
    """
    Generates ``ALTER TABLE ... ADD COLUMN`` statement.

    `table_name`
        Table name.
    `name`
        Column name.
    `type_name`
        Column type or a tuple of column type and type parameters.
    `is_not_null`
        If set, add ``NOT NULL`` constraint.
    """
    return u"ALTER TABLE {} ADD COLUMN {} {}{};" \
            .format(sql_name(table_name),
                    sql_name(name),
                    sql_name(type_name)
                        if not isinstance(type_name, tuple)
                        else u"{}({})"
                                .format(sql_name(type_name[0]),
                                        sql_value(type_name[1:])),
                    u" NOT NULL" if is_not_null else u"")


def sql_drop_column(table_name, name):
    """
    Generates ``ALTER TABLE ... DROP COLUMN`` statement.

    `table_name`
        Table name.
    `name`
        Column name.
    """
    return u"ALTER TABLE {} DROP COLUMN {};" \
            .format(sql_name(table_name),
                    sql_name(name))


def sql_add_unique_constraint(table_name, name, column_names, is_primary):
    """
    Generates ``ALTER TABLE ... ADD UNIQUE | PRIMARY KEY`` statement.

    `table_name`
        Table name.
    `name`
        Constraint name.
    `column_names`
        List of columns in the key.
    `is_primary`
        If set, generates ``PRIMARY KEY`` constraint.
    """
    return u"ALTER TABLE {} ADD CONSTRAINT {} {} ({});" \
            .format(sql_name(table_name),
                    sql_name(name),
                    u"UNIQUE" if not is_primary else u"PRIMARY KEY",
                    sql_name(column_names))


def sql_add_foreign_key_constraint(table_name, name, column_names,
                                   target_table_name, target_column_names):
    """
    Generates ``ALTER TABLE ... ADD FOREIGN KEY`` statement.

    `table_name`
        Name of the referring table.
    `name`
        Constraint name.
    `column_names`
        List of referring columns.
    `target_table_name`
        Name of the referred table.
    `target_column_names`
        List of referred columns.
    """
    return u"ALTER TABLE {} ADD CONSTRAINT {}" \
            u" FOREIGN KEY ({}) REFERENCES {} ({});" \
            .format(sql_name(table_name),
                    sql_name(name),
                    sql_name(column_names),
                    sql_name(target_table_name),
                    sql_name(target_column_names))


def sql_drop_constraint(table_name, name):
    """
    Generates ``ALTER TABLE ... DROP CONSTRAINT`` statement.

    `table_name`
        Table name.
    `name`
        Constraint name.
    """
    return u"ALTER TABLE {} DROP CONSTRAINT {};" \
            .format(sql_name(table_name),
                    sql_name(name))


def sql_create_enum_type(name, labels):
    """
    Generates ``CREATE TYPE ... AS ENUM`` statement.

    `name`
        Type name.
    `labels`
        List of enum values.
    """
    return u"CREATE TYPE {} AS ENUM ({});" \
            .format(sql_name(name),
                    sql_value(labels))


def sql_drop_type(name):
    """
    Generates ``DROP TYPE`` statement.

    `name`
        Type name.
    """
    return u"DROP TYPE {};" \
            .format(sql_name(name))


def sql_select(table_name, names):
    """
    Generates a simple ``SELECT`` statement.

    `table_name`
        Table name.
    `names`
        Column names to select from the table.
    """
    return u"SELECT {}\n    FROM {};" \
            .format(sql_name(names),
                    sql_name(table_name))


def sql_insert(table_name, names, values, returning_names=None):
    """
    Generates an ``INSERT`` statement.

    `table_name`
        Table name.
    `names`
        List of table columns.
    `values`
        Respective column values.
    `returning_names`
        List of columns to return or ``None``.
    """
    lines = []
    if names:
        lines.append(u"INSERT INTO {} ({})"
                    .format(sql_name(table_name),
                            sql_name(names)))
    else:
        lines.append(u"INSERT INTO {}".format(sql_name(table_name)))
    if values:
        lines.append(u"    VALUES ({})".format(sql_value(values)))
    else:
        lines.append(u"    DEFAULT VALUES")
    if returning_names:
        lines.append(u"    RETURNING {}".format(sql_name(returning_names)))
    return u"\n".join(lines)+u";"


def sql_update(table_name, key_name, key_value, names, values,
               returning_names=None):
    """
    Generates an ``UPDATE`` statement.

    `table_name`
        Table name.
    `key_name`
        Name of the column used to select a row in the table.
    `key_value`
        Value for selecting a table row.
    `names`
        List of columns to update.
    `values`
        Corresponding column values.
    `returning_names`
        List of columns to return or ``None``.
    """
    lines = []
    lines.append(u"UPDATE {}".format(sql_name(table_name)))
    if names and values:
        lines.append(u"    SET {}"
                    .format(u", ".join(u"{} = {}"
                                        .format(sql_name(name),
                                                sql_value(value))
                                       for name, value in zip(names, values))))
    else:
        lines.append(u"    SET {} = {}"
                    .format(sql_name(key_name),
                            sql_value(key_value)))
    lines.append(u"    WHERE {} = {}"
                .format(sql_name(key_name),
                        sql_value(key_value)))
    if returning_names:
        lines.append(u"    RETURNING {}".format(sql_name(returning_names)))
    return u"\n".join(lines)+u";"


def sql_delete(table_name, key_name, key_value):
    """
    Generates a ``DELETE`` statement.

    `table_name`
        Table name.
    `key_name`
        Name of the column used to select the row to delete.
    `key_value`
        Corresponding value.
    """
    lines = []
    lines.append(u"DELETE FROM {}".format(sql_name(table_name)))
    lines.append(u"    WHERE {} = {}"
                .format(sql_name(key_name),
                        sql_value(key_value)))
    return u"\n".join(lines)+u";"



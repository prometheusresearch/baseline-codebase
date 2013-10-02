#
# Copyright (c) 2013, Prometheus Research, LLC
#


import decimal
import datetime
import hashlib


def mangle(fragments, suffix=None,
           max_length=63, forbidden=[u"id", u"pk", u"uk",
                                     u"fk", u"chk", u"enum"]):
    # Generates a SQL name from fragments and a suffix.
    if not isinstance(fragments, (list, tuple)):
        fragments = [fragments]
    separator = u"_"
    while any(separator in fragment for fragment in fragments):
        separator += u"_"
    stem = separator.join(fragments)
    text = stem
    if suffix is not None:
        text += separator+suffix
        is_forbidden = False
    else:
        is_forbidden = any(stem == word or stem.endswith(u"_"+word)
                           for word in forbidden)
    if is_forbidden or len(text) > max_length:
        digest = separator+unicode(hashlib.md5(stem).hexdigest()[:6])
        if len(text)+len(digest) > max_length:
            cut_start = max_length/4
            cut_end = cut_start+len(digest)+len(separator)+len(text)-max_length
            text = text[:cut_start]+separator+text[cut_end:]
        text += digest
        assert len(text) <= max_length
    return text


def dquote(names):
    # Quotes a SQL name or a list of names.
    if not isinstance(names, (list, tuple)):
        names = [names]
    return ", ".join(u"\"%s\"" % name.replace(u"\"", u"\"\"") for name in names)


def quote(value):
    # Converts a value to a SQL literal.
    if value is None:
        return u"NULL"
    if isinstance(value, bool):
        if value is True:
            return u"TRUE"
        if value is False:
            return u"FALSE"
    if isinstance(value, (int, long, float, decimal.Decimal)):
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
        return u", ".join(quote(item) for item in value)
    raise NotImplementedError(type(value))


def create_database(name):
    # Generates `CREATE DATABASE` statement.
    return u"CREATE DATABASE {} WITH ENCODING = 'UTF-8';".format(
                dquote(name))


def drop_database(name):
    # Generates `DROP DATABASE` statement.
    return u"DROP DATABASE {};".format(
                dquote(name))


def select_database(name):
    # Generates `SELECT` statement for checking if the database exists.
    return u"SELECT TRUE FROM pg_catalog.pg_database AS d" \
            u" WHERE d.datname = {};".format(
                quote(name))


def create_table(name, body):
    # Generates `CREATE TABLE` statement.
    lines = []
    lines.append(u"CREATE TABLE {} (".format(dquote(name)))
    for body_line in body[:-1]:
        lines.append(u"    {},".format(body_line))
    lines.append(u"    {}".format(body[-1]))
    lines.append(u");")
    return u"\n".join(lines)


def drop_table(name):
    # Generates `DROP TABLE` statement.
    return "DROP TABLE {};".format(dquote(name))


def define_column(name, type_name, is_nullable):
    # Generates column definition for `CREATE TABLE` body.
    return u"{} {}{}".format(
                dquote(name),
                dquote(type_name) if not isinstance(type_name, tuple)
                    else u"{}({})".format(
                            dquote(type_name[0]),
                            quote(type_name[1:])),
                u" NULL" if is_nullable else u"")


def add_column(table_name, name, type_name, is_nullable):
    # Generates `ADD COLUMN` statement.
    return u"ALTER TABLE {} ADD COLUMN {} {}{};".format(
                dquote(table_name),
                dquote(name),
                dquote(type_name)
                    if not isinstance(type_name, tuple)
                    else u"{}({})".format(
                            dquote(type_name[0]),
                            quote(type_name[1:])),
                u" NULL" if is_nullable else u"")


def drop_column(self, table_name, name):
    # Generates `DROP COLUMN` statement.
    return u"ALTER TABLE {} DROP COLUMN {};".format(
                dquote(table_name),
                dquote(name))


def add_unique_constraint(table_name, name, column_names, is_primary):
    # Generates `ADD UNIQUE`/`ADD PRIMARY KEY` statement.
    return u"ALTER TABLE {} ADD CONSTRAINT {} {} ({});".format(
                dquote(table_name),
                dquote(name),
                u"UNIQUE" if not is_primary else u"PRIMARY KEY",
                dquote(column_names))


def add_foreign_key_constraint(table_name, name, column_names,
                               target_table_name, target_column_names):
    # Generates `ADD FOREIGN KEY` statement.
    return u"ALTER TABLE {} ADD CONSTRAINT {}" \
            u" FOREIGN KEY ({}) REFERENCES {} ({});".format(
                dquote(table_name),
                dquote(name),
                dquote(column_names),
                dquote(target_table_name),
                dquote(target_column_names))


def drop_constraint(table_name, name):
    # Generates `DROP CONSTRAINT` statement.
    return u"ALTER TABLE {} DROP CONSTRAINT {};".format(
                dquote(table_name),
                dquote(name))


def create_enum_type(name, labels):
    return u"CREATE TYPE {} AS ENUM ({});".format(
                dquote(name),
                quote(labels))


def drop_type(name):
    return u"DROP TYPE {};".format(
                dquote(name))


def select(table_name, names):
    return u"SELECT {}\n    FROM {};".format(
                dquote(names),
                dquote(table_name))


def insert(table_name, names, values, returning_names=None):
    lines = []
    if names:
        lines.append(u"INSERT INTO {} ({})".format(
                    dquote(table_name),
                    dquote(names)))
    else:
        lines.append(u"INSERT INTO {}".format(dquote(table_name)))
    if values:
        lines.append(u"    VALUES ({})".format(quote(values)))
    else:
        lines.append(u"    DEFAULT VALUES")
    if returning_names:
        lines.append(u"    RETURNING {}".format(dquote(returning_names)))
    return u"\n".join(lines)+u";"


def update(table_name, key_name, key_value, names, values,
           returning_names=None):
    lines = []
    lines.append(u"UPDATE {}".format(dquote(table_name)))
    if names and values:
        lines.append(u"    SET {}".format(
                    u", ".join(u"{} = {}".format(
                                dquote(name),
                                quote(value))
                               for name, value in zip(names, values))))
    else:
        lines.append(u"    SET {} = {}".format(
                    dquote(key_name),
                    quote(key_value)))
    lines.append(u"    WHERE {} = {}".format(
                dquote(key_name),
                quote(key_value)))
    if returning_names:
        lines.append(u"    RETURNING {}".format(dquote(returning_names)))
    return u"\n".join(lines)+u";"


def delete(table_name, key_name, key_value):
    lines = []
    lines.append(u"DELETE FROM {}".format(dquote(table_name)))
    lines.append(u"    WHERE {} = {}".format(
                dquote(key_name),
                quote(key_value)))
    return u"\n".join(lines)+u";"



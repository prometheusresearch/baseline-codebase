#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides database schema management.
"""


from rex.core import (Extension, MaybeVal, StrVal, BoolVal, SeqVal, RecordVal,
        get_settings, get_packages, Error, guard)
import htsql.core.util
import weakref
import decimal
import datetime
import psycopg2, psycopg2.extensions
import yaml


class Record(object):
    # Represents a database entity.

    __slots__ = ('owner',)

    def __init__(self, owner):
        self.owner = owner

    def remove(self):
        for cls in self.__class__.__mro__:
            if hasattr(cls, '__slots__'):
                for slot in cls.__slots__:
                    if not (slot.startswith('__') and slot.endswith('__')):
                        delattr(self, slot)


class NamedRecord(Record):
    # Represents a database entity with a name.

    __slots__ = ('name',)

    max_name_length = 63

    def __init__(self, owner, name):
        assert len(name) <= self.max_name_length
        super(NamedRecord, self).__init__(owner)
        self.name = name


class RecordCollection(htsql.core.util.omap):
    # A collection of named database entities.

    def add(self, record):
        if record.name in self:
            raise KeyError(record.name)
        self[record.name] = record

    def remove(self, record):
        if self.get(record.name) is not record:
            raise KeyError(record.name)
        del self[record.name]


class CatalogRecord(Record):
    # Database catalog.

    __slots__ = ('schemas', '__weakref__')

    def __init__(self):
        super(CatalogRecord, self).__init__(weakref.ref(self))
        self.schemas = RecordCollection()

    def __contains__(self, name):
        return (name in self.schemas)

    def __getitem__(self, name):
        return self.schemas[name]

    def __iter__(self):
        return iter(self.schemas)

    def __len__(self):
        return len(self.schemas)

    def get(self, name, default=None):
        return self.schemas.get(name, default)

    def remove(self):
        for schema in reversed(self.schemas):
            schema.remove()
        super(CatalogRecord, self).remove()

    def add_schema(self, name):
        return SchemaRecord(self, name)


class SchemaRecord(NamedRecord):
    # Database schema.

    __slots__ = ('tables', '__weakref__')

    def __init__(self, catalog, name):
        super(SchemaRecord, self).__init__(weakref.ref(catalog), name)
        self.tables = RecordCollection()
        catalog.schemas.add(self)

    @property
    def catalog(self):
        return self.owner()

    def __contains__(self, name):
        return (name in self.tables)

    def __getitem__(self, name):
        return self.tables[name]

    def __iter__(self):
        return iter(self.tables)

    def __len__(self):
        return len(self.tables)

    def get(self, name, default=None):
        return self.tables.get(name, default)

    def remove(self):
        for table in reversed(self.tables):
            table.remove()
        super(SchemaRecord, self).remove()

    def add_table(self, name):
        return TableRecord(self, name)


class TableRecord(NamedRecord):
    # Database table.

    __slots__ = ('columns', 'primary_key', 'unique_keys',
                 'foreign_keys', 'referring_foreign_keys', '__weakref__')

    def __init__(self, schema, name):
        super(TableRecord, self).__init__(weakref.ref(schema), name)
        self.columns = RecordCollection()
        self.primary_key = None
        self.unique_keys = []
        self.foreign_keys = []
        self.referring_foreign_keys = []
        schema.tables.add(self)

    @property
    def schema(self):
        return self.owner()

    def __contains__(self, name):
        return (name in self.columns)

    def __getitem__(self, name):
        return self.columns[name]

    def __iter__(self):
        return iter(self.columns)

    def __len__(self):
        return len(self.columns)

    def get(self, name, default=None):
        return self.columns.get(name, default)

    def remove(self):
        for column in reversed(self.columns):
            column.remove()
        super(TableRecord, self).remove()

    def add_column(self, name):
        return ColumnRecord(self, name)

    def add_unique_key(self, columns, is_primary=False):
        return UniqueKeyRecord(self, columns, is_primary)

    def add_primary_key(self, columns):
        return UniqueKeyRecord(self, columns, True)

    def add_foreign_key(self, columns, target, target_columns):
        return ForeignKeyRecord(self, columns, target, target_columns)


class ColumnRecord(NamedRecord):
    # Database column.

    __slots__ = ('__weakref__',)

    def __init__(self, table, name):
        super(ColumnRecord, self).__init__(weakref.ref(table), name)
        table.columns.add(self)

    @property
    def table(self):
        return self.owner()

    @property
    def unique_keys(self):
        return [unique_key
                for unique_key in self.table.unique_keys
                if self in unique_key.origin_columns]

    @property
    def foreign_keys(self):
        return [foreign_key
                for foreign_key in self.table.foreign_keys
                if self in foreign_key.origin_columns]

    @property
    def referring_foreign_keys(self):
        return [foreign_key
                for foreign_key in self.table.referring_foreign_keys
                if self in foreign_key.target_columns]

    def remove(self):
        for unique_key in self.unique_keys:
            unique_key.remove()
        for foreign_key in self.foreign_keys:
            foreign_key.remove()
        for foreign_key in self.referring_foreign_keys:
            foreign_key.remove()
        self.table.columns.remove(self)
        super(ColumnEntity, self).remove()


class UniqueKeyRecord(Record):

    __slots__ = ('origin_columns', 'is_primary')

    def __init__(self, origin, origin_columns, is_primary):
        super(UniqueKeyRecord, self).__init__(weakref.ref(origin))
        self.origin_columns = origin_columns
        self.is_primary = is_primary
        if is_primary:
            assert origin.primary_key is None
            origin.primary_key = self
        origin.unique_keys.append(self)

    def set_is_primary(self, is_primary):
        if is_primary == self.is_primary:
            return self
        if is_primary:
            assert self.origin.primary_key is None
            self.origin_primary_key = self
        else:
            assert self.origin.primary_key is self
            self.origin.primary_key = None
        return self

    @property
    def origin(self):
        return self.owner()

    def __contains__(self, column):
        return (column in self.origin_columns)

    def __getitem__(self, index):
        return self.origin_columns[index]

    def __iter__(self):
        return iter(self.origin_columns)

    def __len__(self):
        return len(self.origin_columns)

    def remove(self):
        self.origin.unique_keys.remove(self)
        if self.is_primary:
            self.origin.primary_key = None
        super(UniqueKeyRecord, self).remove()


class ForeignKeyRecord(Record):

    __slots__ = ('origin_columns', 'coowner', 'target_columns')

    def __init__(self, origin, origin_columns, target, target_columns):
        super(ForeignKeyRecord, self).__init__(weakref.ref(origin))
        self.origin_columns = origin_columns
        self.coowner = weakref.ref(target)
        self.target_columns = target_columns
        origin.foreign_keys.append(self)
        target.referring_foreign_keys.append(self)

    @property
    def origin(self):
        return self.owner()

    @property
    def target(self):
        return self.coowner()

    def __contains__(self, column_pair):
        return (column_pair in zip(self.origin_columns, self.target_columns))

    def __getitem__(self, index):
        return (self.origin_columns[index], self.target_columns[index])

    def __iter__(self):
        return iter(zip(self.origin_columns, self.target_columns))

    def __len__(self):
        return len(self.origin_columns)

    def remove(self):
        self.origin.foreign_keys.remove(self)
        self.target.referring_foreign_keys.remove(self)
        super(ForeignKeyRecord, self).remove()


class Writer(object):
    # SQL serializer.

    def __init__(self):
        pass

    def escape(self, value):
        # Converts a value to a SQL literal.
        if value is None:
            return "NULL"
        if isinstance(value, bool):
            if value is True:
                return "TRUE"
            if value is False:
                return "FALSE"
        if isinstance(value, (int, long, float, decimal.Decimal)):
            return str(value)
        if isinstance(value, datetime.date):
            return "'%s'" % value
        if isinstance(value, unicode):
            value = value.encode('utf-8')
        if isinstance(value, str):
            value = value.replace("'", "''")
            if "\\" in value:
                value = value.replace("\\", "\\\\")
                return "E'%s'" % value
            else:
                return "'%s'" % value
        raise NotImplementedError(type(value))

    def escape_name(self, name):
        # Quotes a SQL name.
        if isinstance(name, unicode):
            name = name.encode('utf-8')
        return "\"%s\"" % name.replace("\"", "\"\"")

    def escape_list(self, values):
        # Generates a comma-separated list of values.
        return ", ".join(self.escape(value) for value in values)

    def escape_name_list(self, names):
        # Generates a comma-separated list of SQL names.
        return ", ".join(self.escape_name(name) for name in names)

    def create_table(self, schema_name, name, body):
        # Generates `CREATE TABLE` statement.
        lines = []
        lines.append("CREATE TABLE {}.{} (".format(self.escape_name(schema_name),
                                                   self.escape_name(name)))
        for body_line in body[:-1]:
            lines.append("    {},".format(body_line))
        lines.append("    {}".format(body[-1]))
        lines.append(");")
        return "\n".join(lines)

    def drop_table(self, schema_name, name):
        line = "DROP TABLE {}.{};".format(self.escape_name(schema_name),
                                          self.escape_name(name))
        return line

    def define_column(self, name, type, is_nullable):
        # Generates column definition for `CREATE TABLE`.
        line = "{:<24} {}".format(name, type)
        if is_nullable:
            line += " NULL"
        return line

    def add_column(self, schema_name, table_name, name, type, is_nullable):
        line = "ALTER TABLE {}.{} ADD COLUMN {} {}".format(
                self.escape_name(schema_name),
                self.escape_name(table_name),
                self.escape_name(name),
                type)
        if is_nullable:
            line += " NULL"
        else:
            line += " NOT NULL"
        line += ";"
        return line

    def drop_column(self, schema_name, table_name, name):
        line = "ALTER TABLE {}.{} DROP COLUMN {};".format(
                self.escape_name(schema_name),
                self.escape_name(table_name),
                self.escape_name(name))
        return line

    def add_unique_key(self, schema_name, table_name, column_names,
                       is_primary):
        line = "ALTER TABLE {}.{} ADD {} ({});".format(
                self.escape_name(schema_name),
                self.escape_name(table_name),
                "UNIQUE" if not is_primary else "PRIMARY KEY",
                self.escape_name_list(column_names))
        return line

    def add_foreign_key(self, schema_name, table_name, column_names,
                        target_schema_name, target_table_name,
                        target_column_names):
        line = "ALTER TABLE {}.{} ADD FOREIGN KEY ({})" \
               " REFERENCES {}.{} ({});".format(
                self.escape_name(schema_name),
                self.escape_name(table_name),
                self.escape_name_list(column_names),
                self.escape_name(target_schema_name),
                self.escape_name(target_table_name),
                self.escape_name_list(target_column_names))
        return line


class Driver(object):

    def __init__(self, connection):
        self.connection = connection
        self.catalog = introspect(connection)
        self.writer = Writer()
        self.output = []

    def __call__(self, facts):
        for fact in facts:
            fact(self)
        cursor = self.connection.cursor()
        for sql in self.output:
            cursor.execute(sql)

    def submit(self, sql):
        self.output.append(sql)


class Fact(Extension):
    # Represents a state of the database.

    fields = []
    key = None
    validate = None

    @classmethod
    def sanitize(cls):
        if cls.fields:
            if cls.key is None:
                cls.key = cls.fields[0][0]
            if cls.validate is None:
                cls.validate = RecordVal(cls.fields)

    @classmethod
    def enabled(cls):
        return bool(cls.fields)

    def __init__(self, *args, **kwds):
        for field in self.fields:
            name = field[0]
            validate = field[1]
            has_default = (len(field) > 2)
            if has_default:
                default = field[2]
            if args:
                value = validate(args[0])
                args = args[1:]
            elif name in kwds:
                value = validate(kwds.pop(name))
            elif has_default:
                value = default
            else:
                raise TypeError("missing field %s" % name)
            setattr(self, name, value)
        if args:
            raise TypeError("unexpected positional arguments")
        if kwds:
            raise TypeError("unexpected keyword arguments")

    def __call__(self, driver):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __repr__(self):
        args = []
        for field in self.fields:
            name = field[0]
            value = getattr(self, name)
            if len(field) > 2:
                default = field[2]
                if value is default:
                    continue
            args.append("%s=%r" % (name, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class TableFact(Fact):

    fields = [
            ('table', StrVal(r'\w+')),
            ('present', BoolVal(), True),
    ]

    def __call__(self, driver):
        schema = driver.catalog["public"]
        writer = driver.writer
        if self.present:
            if self.table in schema:
                return
            body = [writer.define_column("id", "SERIAL", False)]
            sql = writer.create_table("public", self.table, body)
            driver.submit(sql)
            sql = writer.add_unique_key("public", self.table, ["id"], False)
            driver.submit(sql)
            table = schema.add_table(self.table)
            id_column = table.add_column("id")
            table.add_unique_key(id_column)
        else:
            if self.table not in schema:
                return
            sql = writer.drop_table("public", self.table)
            driver.submit(sql)
            schema[self.table].remove()


class ColumnFact(Fact):

    fields = [
            ('column', StrVal(r'\w+(?:\.\w+)?')),
            ('of', MaybeVal(StrVal(r'\w+')), None),
            ('present', BoolVal(),  True),
    ]

    def __init__(self, *args, **kwds):
        super(ColumnFact, self).__init__(*args, **kwds)
        if '.' in self.column:
            self.of, self.column = self.column.split('.')

    def __call__(self, driver):
        schema = driver.catalog["public"]
        writer = driver.writer
        if self.present:
            if self.of not in schema:
                raise Error("Unknown table:", self.of)
            table = schema[self.of]
            if self.column in table:
                return
            sql = writer.add_column(schema.name, table.name,
                                    self.column, "TEXT", True)
            driver.submit(sql)
            table.add_column(self.column)
        else:
            if self.of not in schema:
                return
            table = schema[self.of]
            if self.column not in table:
                return
            column = table[self.column]
            sql = writer.drop_column(schema.name, table.name, column.name)
            driver.submit(sql)
            column.remove()


class LinkFact(Fact):

    fields = [
            ('link', StrVal(r'\w+(?:\.\w+)?')),
            ('of', MaybeVal(StrVal(r'\w+')), None),
            ('to', MaybeVal(StrVal(r'\w+')), None),
            ('present', BoolVal(),  True),
    ]

    def __init__(self, *args, **kwds):
        super(LinkFact, self).__init__(*args, **kwds)
        if '.' in self.link:
            self.of, self.link = self.link.split('.')
        if self.to is None:
            self.to = self.link

    def __call__(self, driver):
        schema = driver.catalog["public"]
        writer = driver.writer
        if self.present:
            if self.of not in schema:
                raise Error("Unknown table:", self.of)
            if self.to not in schema:
                raise Error("Unknown target table:", self.to)
            table = schema[self.of]
            name = self.link + "_id"
            if name in table:
                return
            target_table = schema[self.to]
            if "id" not in target_table:
                raise Error("Missing ID column from target table:", self.to)
            target_column = target_table["id"]
            sql = writer.add_column(schema.name, table.name,
                                    name, "INTEGER", True)
            driver.submit(sql)
            sql = writer.add_foreign_key(schema.name, table.name, [name],
                                         schema.name, target_table.name, ["id"])
            driver.submit(sql)
            column = table.add_column(name)
            table.add_foreign_key([column], target_table, [target_column])
        else:
            if self.of not in schema:
                return
            table = schema[self.of]
            name = self.link + "_id"
            if name not in table:
                return
            column = table[name]
            sql = writer.drop_column(schema.name, table.name, column.name)
            driver.submit(sql)
            column.remove()


class IdentityFact(Fact):

    fields = [
            ('identity', SeqVal(StrVal(r'\w+(?:\.\w+)?'))),
            ('of', MaybeVal(StrVal(r'\w+')), None),
            ('present', BoolVal(),  True),
    ]

    def __init__(self, *args, **kwds):
        super(IdentityFact, self).__init__(*args, **kwds)
        names = []
        for name in self.identity:
            if "." in name:
                self.of, name = name.split(".")
            names.append(name)
        self.identity = names

    def __call__(self, driver):
        schema = driver.catalog["public"]
        writer = driver.writer
        if self.present:
            if self.of not in schema:
                raise Error("Unknown table:", self.of)
            table = schema[self.of]
            columns = []
            for name in self.identity:
                if name in table:
                    column = table[name]
                elif name+"_id" in table:
                    column = table[name+"_id"]
                else:
                    raise Error("Unknown field:", "%s.%s" % (name, self.of))
                columns.append(column)
            if table.primary_key is not None:
                if table.primary_key.origin_columns != columns:
                    raise Error("Wrong identity")
                return
            sql = writer.add_unique_key(schema.name, table.name,
                                        [column.name for column in columns],
                                        True)
            driver.submit(sql)
            table.add_primary_key(columns)
        else:
            raise NotImplementedError()


def get_facts():
    facts = []
    fact_types = Fact.all()
    for package in reversed(get_packages()):
        if not package.exists('deploy.yaml'):
            continue
        stream = package.open('deploy.yaml')
        try:
            deploy = yaml.safe_load(stream)
        except yaml.YAMLError, error:
            raise Error("Failed to load a deployment file:", str(error))
        if deploy is None:
            continue
        if not isinstance(deploy, list):
            raise Error("Got ill-formed deployment file:",
                        package.abspath('deploy.yaml'))
        for idx, record in enumerate(deploy):
            with guard("While parsing fact #%s from:" % (idx+1),
                       package.abspath('deploy.yaml')):
                if not isinstance(record, dict):
                    raise Error("Got ill-formed fact")
                for fact_type in fact_types:
                    if fact_type.key in record:
                        record = fact_type.validate(record)
                        fact = fact_type(*record)
                        facts.append(fact)
                        break
                else:
                    raise Error("Got unrecognized fact")
    return facts


class Cluster(object):

    def __init__(self, db):
        self.db = db

    def connect(self, database=None, autocommit=False):
        if database is None:
            database = self.db.database
        parameters = { 'database': database }
        if self.db.host is not None:
            parameters['host'] = self.db.host
        if self.db.port is not None:
            parameters['port'] = self.db.port
        if self.db.username is not None:
            parameters['user'] = self.db.username
        if self.db.password is not None:
            parameters['password'] = self.db.password
        try:
            connection = psycopg2.connect(**parameters)
            if autocommit:
                connection.set_isolation_level(
                                psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        except psycopg2.Error, error:
            raise Error("Failed to connect to the database server:", error)
        return connection

    def connect_postgres(self):
        return self.connect('postgres', autocommit=True)

    def exists(self, database=None):
        if database is None:
            database = self.db.database
        sql = """
            SELECT 1 FROM pg_catalog.pg_database AS d
            WHERE d.datname = %s
        """ % self._squote(database)
        return bool(self._master(database, sql))

    def create(self, database=None):
        if database is None:
            database = self.db.database
        sql = """
            CREATE DATABASE %s WITH ENCODING = 'UTF-8'
        """ % self._dquote(database)
        self._master(database, sql)

    def drop(self, database=None):
        if database is None:
            database = self.db.database
        sql = """
            DROP DATABASE %s
        """ % self._dquote(database)
        self._master(database, sql)

    def deploy(self, facts, database=None, dry_run=False):
        connection = self.connect(database)
        try:
            driver = Driver(connection)
            driver(facts)
            if not dry_run:
                connection.commit()
            else:
                connection.rollback()
            connection.close()
        except psycopg2.Error, error:
            raise Error("Got an error from the database server:", error)

    def _master(self, database, sql):
        if database is None:
            database = self.db.database
        result = None
        connection = self.connect_postgres()
        try:
            cursor = connection.cursor()
            cursor.execute(sql)
            if cursor.description is not None:
                result = cursor.fetchall()
            connection.close()
        except psycopg2.Error, error:
            raise Error("Got an error from the database server:", error)
        return result

    def _squote(self, value):
        value = value.replace("'", "''")
        if "\\" in value:
            value = value.replace("\\", "\\\\")
            return "E'%s'" % value
        else:
            return "'%s'" % value

    def _dquote(self, name):
        return "\"%s\"" % name.replace("\"", "\"\"")


def get_cluster():
    db = get_settings().db
    if not db.engine == 'pgsql':
        raise Error("Expected a PostgreSQL database; got:", db)
    return Cluster(db)


def introspect(connection):
    cursor = connection.cursor()

    catalog = CatalogRecord()

    cursor.execute("""
        SELECT n.oid, n.nspname
        FROM pg_catalog.pg_namespace n
        ORDER BY n.nspname
    """)
    schema_by_oid = {}
    for oid, nspname in cursor.fetchall():
        if nspname == u'information_schema' or nspname.startswith(u'pg_'):
            continue
        name = nspname.encode('utf-8')
        schema = catalog.add_schema(name)
        schema_by_oid[oid] = schema

    table_by_oid = {}
    cursor.execute("""
        SELECT c.oid, c.relnamespace, c.relname
        FROM pg_catalog.pg_class c
        WHERE c.relkind IN ('r', 'v') AND
              HAS_TABLE_PRIVILEGE(c.oid, 'SELECT')
        ORDER BY c.relnamespace, c.relname
    """)
    for oid, relnamespace, relname in cursor.fetchall():
        if relnamespace not in schema_by_oid:
            continue
        schema = schema_by_oid[relnamespace]
        name = relname.encode('utf-8')
        table = schema.add_table(relname)
        table_by_oid[oid] = table

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
        name = attname.encode('utf-8')
        is_nullable = (not attnotnull)
        column = table.add_column(name)
        column_by_num[attrelid, attnum] = column

    cursor.execute("""
        SELECT c.contype, c.confmatchtype,
               c.conrelid, c.conkey, c.confrelid, c.confkey
        FROM pg_catalog.pg_constraint c
        WHERE c.contype IN ('p', 'u', 'f')
        ORDER BY c.oid
    """)
    for (contype, confmatchtype,
            conrelid, conkey, confrelid, confkey) in cursor.fetchall():
        if conrelid not in table_by_oid:
            continue
        table = table_by_oid[conrelid]
        if not all((conrelid, num) in column_by_num
                   for num in conkey):
            continue
        columns = [column_by_num[conrelid, num] for num in conkey]
        if contype in ('p', 'u'):
            is_primary = (contype == 'p')
            table.add_unique_key(columns, is_primary)
        elif contype == 'f':
            if confrelid not in table_by_oid:
                continue
            target_table = table_by_oid[confrelid]
            if not all((confrelid, num) in column_by_num for num in confkey):
                continue
            target_columns = [column_by_num[confrelid, num] for num in confkey]
            table.add_foreign_key(columns, target_table, target_columns)

    return catalog



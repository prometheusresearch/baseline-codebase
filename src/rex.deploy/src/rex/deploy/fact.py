#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, MaybeVal, StrVal, BoolVal, SeqVal, RecordVal,
        get_packages, Error, guard)
from .introspect import introspect
from .write import (mangle, create_table, drop_table, define_column,
        add_column, drop_column, add_unique_constraint,
        add_foreign_key_constraint, drop_constraint)
import yaml


class Driver(object):

    def __init__(self, connection):
        self.connection = connection
        self.catalog = None
        self.output = []

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()["public"]

    def __call__(self, facts):
        for fact in facts:
            fact(self)
        cursor = self.connection.cursor()
        for sql in self.output:
            print sql
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
        schema = driver.get_schema()
        name = mangle(self.table)
        if self.present:
            if name in schema:
                return
            body = [define_column("id", "serial4", False)]
            sql = create_table(name, body)
            driver.submit(sql)
            constraint_name = mangle([name, "id"], "uk")
            sql = add_unique_constraint(name, constraint_name, ["id"], False)
            driver.submit(sql)
            table = schema.add_table(name)
            id_column = table.add_column("id")
            table.add_unique_key(constraint_name, [id_column])
        else:
            if name not in schema:
                return
            sql = drop_table(name)
            driver.submit(sql)
            schema[name].remove()


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
        schema = driver.get_schema()
        table_name = mangle(self.of)
        name = mangle(self.column)
        if self.present:
            if table_name not in schema:
                raise Error("Unknown table:", self.of)
            table = schema[table_name]
            if name in table:
                return
            sql = add_column(table.name, name, "text", True)
            driver.submit(sql)
            table.add_column(name)
        else:
            if table_name not in schema:
                return
            table = schema[table_name]
            if name not in table:
                return
            column = table[name]
            sql = drop_column(table.name, column.name)
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
        schema = driver.get_schema()
        table_name = mangle(self.of)
        name = mangle(self.link, "id")
        target_table_name = mangle(self.to)
        constraint_name = mangle([self.of, self.link], "fk")
        if self.present:
            if table_name not in schema:
                raise Error("Unknown table:", self.of)
            if target_table_name not in schema:
                raise Error("Unknown target table:", self.to)
            table = schema[table_name]
            if name in table:
                return
            target_table = schema[target_table_name]
            if "id" not in target_table:
                raise Error("Missing ID column from target table:", self.to)
            target_column = target_table["id"]
            sql = add_column(table.name, name, "int4", True)
            driver.submit(sql)
            sql = add_foreign_key_constraint(table.name, constraint_name,
                                             [name], target_table.name, ["id"])
            driver.submit(sql)
            column = table.add_column(name)
            table.add_foreign_key(constraint_name, [column],
                                  target_table, [target_column])
        else:
            if table_name not in schema:
                return
            table = schema[table_name]
            if name not in table:
                return
            column = table[name]
            sql = drop_column(table.name, column.name)
            driver.submit(sql)
            column.remove()


class IdentityFact(Fact):

    fields = [
            ('identity', SeqVal(StrVal(r'\w+(?:\.\w+)?'))),
            ('of', MaybeVal(StrVal(r'\w+')), None),
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
        schema = driver.get_schema()
        table_name = mangle(self.of)
        constraint_name = mangle(self.of, "pk")
        if table_name not in schema:
            raise Error("Unknown table:", self.of)
        table = schema[self.of]
        column_names = []
        columns = []
        for label in self.identity:
            column_name = mangle(label)
            link_name = mangle(label, "id")
            if column_name in table:
                name = column_name
            elif link_name in table:
                name = link_name
            else:
                raise Error("Unknown field:", "%s.%s" % (self.of, label))
            column_names.append(name)
            columns.append(table[name])
        if table.primary_key is not None:
            if table.primary_key.origin_columns == columns:
                return
            sql = drop_constraint(table.name, table.primary_key.name)
            driver.submit(sql)
            table.primary_key.remove()
        sql = add_unique_constraint(table.name, constraint_name,
                                    column_names, True)
        driver.submit(sql)
        table.add_primary_key(constraint_name, columns)


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



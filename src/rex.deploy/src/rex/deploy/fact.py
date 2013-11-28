#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, Validate, MaybeVal, StrVal, BoolVal, OneOfVal,
        ChoiceVal, SeqVal, OneOrSeqVal, MapVal, RecordVal, SwitchVal,
        get_packages, Error, guard, locate, set_location)
from .cluster import get_cluster
from .introspect import introspect
from .sql import (mangle, sql_create_table, sql_drop_table, sql_define_column,
        sql_add_column, sql_drop_column, sql_add_unique_constraint,
        sql_add_foreign_key_constraint, sql_drop_constraint,
        sql_create_enum_type, sql_drop_type, sql_select, sql_insert,
        sql_update)
import csv
import re
import datetime
import os.path
import htsql.core.domain
import psycopg2
import yaml


class FactVal(Validate):

    def _switch(self):
        validate_map = {}
        for fact_type in Fact.all():
            validate_map[fact_type.key] = fact_type.validate
        return SwitchVal(validate_map)

    def __call__(self, data):
        switch_val = self._switch()
        return switch_val(data)

    def construct(self, loader, node):
        switch_val = self._switch()
        return switch_val.construct(loader, node)


class UnicodeVal(StrVal):

    def __init__(self, pattern=None):
        super(UnicodeVal, self).__init__(pattern)

    def __call__(self, data):
        data = super(UnicodeVal, self).__call__(data)
        return data.decode('utf-8')

    def construct(self, loader, node):
        data = super(UnicodeVal, self).construct(loader, node)
        return data.decode('utf-8')


class LabelVal(UnicodeVal):

    def __init__(self):
        super(LabelVal, self).__init__(r'[a-z_][0-9a-z_]*')


class DottedLabelVal(UnicodeVal):

    def __init__(self):
        super(DottedLabelVal, self).__init__(
                r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?')


class Driver(object):

    validate = OneOrSeqVal(FactVal())

    def __init__(self, connection, logging={}):
        self.connection = connection
        self.catalog = None
        self.logging = logging
        self.cwd = None
        self.is_locked = False

    def chdir(self, directory):
        self.cwd = directory

    def lock(self):
        self.is_locked = True

    def unlock(self):
        self.is_locked = False

    def reset(self):
        self.catalog = None
        self.is_locked = False

    def parse(self, stream):
        spec = self.validate.parse(stream)
        if isinstance(spec, list):
            facts = []
            for item in spec:
                with guard("While parsing:", locate(item)):
                    facts.append(self.build(item))
            return facts
        else:
            with guard("While parsing:", locate(spec)):
                return self.build(spec)

    def build(self, spec):
        for fact_type in Fact.all():
            if isinstance(spec, fact_type.validate.record_type):
                fact = fact_type.build(self, spec)
                set_location(fact, spec)
                return fact
        assert False, "unknown fact record: %s" % spec

    def log(self, msg, *args, **kwds):
        log = self.logging.get('log')
        if log is not None:
            log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn = self.logging.get('warn')
        if warn is not None:
            warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug = self.logging.get('debug')
        if debug is not None:
            debug(msg, *args, **kwds)

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()[u"public"]

    def __call__(self, facts, is_locked=None):
        if not isinstance(facts, (list, tuple)):
            facts = [facts]
        # Set new lock status.
        if is_locked is not None:
            self.is_locked, is_locked = is_locked, self.is_locked
        try:
            # Apply the facts.
            for fact in facts:
                try:
                    fact(self)
                except Error, error:
                    if not self.is_locked:
                        message = "While deploying:"
                    else:
                        message = "While validating:"
                    location = locate(fact) or fact
                    error.wrap(message, location)
                    raise
        finally:
            # Restore original lock status.
            if is_locked is not None:
                self.is_locked, is_locked = is_locked, self.is_locked

    def submit(self, sql):
        cursor = self.connection.cursor()
        try:
            self.debug(sql)
            cursor.execute(sql)
            if cursor.description is not None:
                return cursor.fetchall()
        except psycopg2.Error, exc:
            error = Error("Got an error from the database driver:", exc)
            error.wrap("While executing SQL:", sql)
            raise error
        finally:
            cursor.close()


class Fact(Extension):
    """Represents a state of the database."""

    fields = []
    key = None
    validate = None

    @classmethod
    def sanitize(cls):
        if cls.__dict__.get('fields'):
            if 'key' not in cls.__dict__:
                cls.key = cls.fields[0][0]
            if 'validate' not in cls.__dict__:
                cls.validate = RecordVal(cls.fields)

    @classmethod
    def enabled(cls):
        return bool(cls.fields)

    def __call__(self, driver):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return yaml.dump(self, Dumper=FactDumper)

    def __repr__(self):
        raise NotImplementedError("%s.__repr__()" % self.__class__.__name__)

    def __yaml__(self):
        raise NotImplementedError("%s.__yaml__()" % self.__class__.__name__)


class FactDumper(yaml.Dumper):

    def represent_str(self, data):
        # Represent both `str` and `unicode` objects as YAML strings.
        # Use block style for multiline strings.
        if isinstance(data, unicode):
            data = data.encode('utf-8')
        tag = None
        style = None
        if data.endswith('\n'):
            style = '|'
        try:
            data = data.decode('utf-8')
            tag = u'tag:yaml.org,2002:str'
        except UnicodeDecodeError:
            data = data.encode('base64')
            tag = u'tag:yaml.org,2002:binary'
            style = '|'
        return self.represent_scalar(tag, data, style=style)

    def represent_fact(self, data):
        # Represent `Fact` objects.
        tag = u'tag:yaml.org,2002:map'
        mapping = list(data.__yaml__())
        flow_style = None
        return self.represent_mapping(tag, mapping, flow_style=flow_style)

FactDumper.add_representer(str, FactDumper.represent_str)
FactDumper.add_representer(unicode, FactDumper.represent_str)
FactDumper.add_multi_representer(Fact, FactDumper.represent_fact)


class TableFact(Fact):

    fields = [
            ('table', LabelVal()),
            ('present', BoolVal(), True),
            ('with', SeqVal(FactVal()), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        label = spec.table
        is_present = spec.present
        if not is_present and spec.with_:
            raise Error("Got unexpected clause:", "with")
        nested_facts = None
        if spec.with_:
            nested_facts = []
            for nested_spec in spec.with_:
                if 'of' not in nested_spec._fields:
                    raise Error("Got unrelated nested fact",
                                locate(nested_spec))
                if nested_spec.of is None:
                    nested_spec = nested_spec.__clone__(of=label)
                if nested_spec.of != label:
                    raise Error("Got unrelated nested fact",
                                locate(nested_spec))
                nested_fact = driver.build(nested_spec)
                nested_facts.append(nested_fact)
        return cls(label, is_present=is_present, nested_facts=nested_facts)

    def __init__(self, label, is_present=True, nested_facts=None):
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (nested_facts is None or
                    (isinstance(nested_facts, list) and
                     all(isinstance(fact, Fact) for fact in nested_facts)))
        else:
            assert nested_facts is None
        self.label = label
        self.is_present = is_present
        self.nested_facts = nested_facts
        #: Table SQL name.
        self.name = mangle(label)

    def __yaml__(self):
        yield ('table', self.label)
        if not self.is_present:
            yield ('present', self.is_present)
        if self.nested_facts is not None:
            yield ('with', self.nested_facts)

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        if self.nested_facts is not None:
            args.append("nested_facts=%r" % self.nested_facts)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table is present.
        schema = driver.get_schema()
        # Create the table if it does not exist.
        if self.name not in schema:
            if driver.is_locked:
                raise Error("Detected missing table:", self.name)
            # Submit `CREATE TABLE {name} (id serial4 NOT NULL)` and
            # `ADD CONSTRAINT UNIQUE (id)`.
            body = [sql_define_column(u'id', u'serial4', True)]
            key_name = mangle([self.label, u'id'], u'uk')
            driver.submit(sql_create_table(self.name, body))
            driver.submit(sql_add_unique_constraint(
                    self.name, key_name, [u'id'], False))
            # Update the catalog image.
            system_schema = driver.get_catalog()[u'pg_catalog']
            table = schema.add_table(self.name)
            int4_type = system_schema.types[u'int4']
            id_column = table.add_column(u'id', int4_type, True)
            table.add_unique_key(key_name, [id_column])
        # Verify that the table has `id` column with a UNIQUE contraint.
        table = schema[self.name]
        if u'id' not in table:
            raise Error("Detected missing column:", "%s.id" % table)
        id_column = table['id']
        if not any(unique_key.origin_columns == [id_column]
                   for unique_key in table.unique_keys):
            raise Error("Detected missing column UNIQUE constraint:",
                        "%s.id" % table)
        # Apply nested facts.
        if self.nested_facts:
            driver(self.nested_facts)

    def drop(self, driver):
        # Ensures that the table is absent.
        schema = driver.get_schema()
        if self.name not in schema:
            return
        if driver.is_locked:
            raise Error("Detected unexpected table:", self.name)
        # Bail if there are links to the table.
        table = schema[self.name]
        if any(foreign_key
               for foreign_key in table.referring_foreign_keys
               if foreign_key.origin != table):
            raise Error("Cannot delete a table with links onto it:",
                        self.name)
        # Find `ENUM` types to be deleted with the table.
        enum_types = []
        for column in table:
            if column.type.is_enum:
                enum_types.append(column.type)
        # Submit `DROP TABLE {name}`.
        driver.submit(sql_drop_table(self.name))
        # Submit `DROP TYPE` statements.
        for enum_type in enum_types:
            driver.submit(sql_drop_type(enum_type.name))
        # Update the catalog image.
        table.remove()
        for enum_type in enum_types:
            enum_type.remove()


class ColumnFact(Fact):

    # HTSQL name -> SQL name.
    TYPE_MAP = {
            "boolean": "bool",
            "integer": "int4",
            "decimal": "numeric",
            "float": "float8",
            "text": "text",
            "date": "date",
            "time": "time",
            "datetime": "timestamp",
    }

    fields = [
            ('column', DottedLabelVal()),
            ('of', LabelVal(), None),
            ('type', OneOfVal(ChoiceVal(*sorted(TYPE_MAP)),
                              SeqVal(UnicodeVal(r'[0-9A-Za-z_-]+'))), None),
            ('required', BoolVal(), None),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if u'.' in spec.column:
            table_label, label = spec.column.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.column
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        is_present = spec.present
        type = spec.type
        if is_present:
            if type is None:
                raise Error("Got missing clause:", "type")
            if isinstance(type, list):
                if len(type) == 0:
                    raise Error("Got missing enum labels")
                if len(set(type)) < len(type):
                    raise Error("Got duplicate enum labels:",
                                ", ".join(type))
        else:
            if type is not None:
                raise Error("Got unexpected clause:", "type")
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, type=type, is_required=is_required,
                   is_present=is_present)

    def __init__(self, table_label, label, type=None, is_required=None,
                 is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(type, str) and type in self.TYPE_MAP or
                    isinstance(type, list) and len(type) > 0 and
                    all(isinstance(label, unicode) and len(label) > 0
                        for label in type) and
                    len(set(type)) == len(type))
            assert isinstance(is_required, bool)
        else:
            assert type is None
            assert is_required is None
        self.table_label = table_label
        self.label = label
        self.type = type
        self.is_required = is_required
        self.is_present = is_present
        #: Table SQL name.
        self.table_name = mangle(table_label)
        #: Column SQL name.
        self.name = mangle(label)
        if isinstance(type, list):
            #: Type SQL name.
            self.type_name = mangle([table_label, label], u'enum')
            #: Labels for ``ENUM`` type.
            self.enum_labels = type
        else:
            self.type_name = self.TYPE_MAP[self.type]
            self.enum_labels = None

    def __yaml__(self):
        yield ('column', self.label)
        yield ('of', self.table_label)
        if self.type is not None:
            yield ('type', self.type)
        if self.is_required is not None:
            yield ('required', self.is_required)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.type is not None:
            args.append(repr(self.type))
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the column is present.
        schema = driver.get_schema()
        # Find the table.
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        # Determine the column type.
        if self.enum_labels:
            # Make sure the ENUM type exists.
            # Create the type if it does not exist and update the catalog.
            if self.type_name not in schema.types:
                if driver.is_locked:
                    raise Error("Detected missing ENUM type:", self.type_name)
                driver.submit(sql_create_enum_type(
                        self.type_name, self.enum_labels))
                schema.add_enum_type(self.type_name, self.enum_labels)
            # Check that the type is the one we expect.
            type = schema.types[self.type_name]
            if not (type.is_enum and type.labels == self.enum_labels):
                raise Error("Detected mismatched ENUM type:", self.type_name)
        else:
            # A regular system type.
            system_schema = driver.get_catalog()['pg_catalog']
            type = system_schema.types[self.type_name]
        table = schema[self.table_name]
        # Create the column if it does not exist.
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:",
                            "%s.%s" % (table, self.name))
            driver.submit(sql_add_column(
                    self.table_name, self.name, self.type_name,
                    self.is_required))
            table.add_column(self.name, type, self.is_required)
        # Check that the column has the right type and constraints.
        column = table[self.name]
        if column.type != type:
            raise Error("Detected column with mismatched type:", column)
        if column.is_not_null != self.is_required:
            raise Error("Detected column with mismatched"
                        " NOT NULL constraint:", column)

    def drop(self, driver):
        # Ensures that the column is absent.
        schema = driver.get_schema()
        if self.table_name not in schema:
            return
        table = schema[self.table_name]
        if self.name not in table:
            return
        column = table[self.name]
        if driver.is_locked:
            raise Error("Detected unexpected column:", column)
        # Drop the column.
        type = column.type
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()
        # Drop the dependent ENUM type.
        if type.is_enum:
            driver.submit(sql_drop_type(type.name))
            type.remove()


class LinkFact(Fact):

    fields = [
            ('link', DottedLabelVal()),
            ('of', LabelVal(), None),
            ('to', LabelVal(), None),
            ('required', BoolVal(), True),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if u'.' in spec.link:
            table_label, label = spec.link.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.link
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        target_table_label  = spec.to
        if target_table_label is None:
            target_table_label = label
        is_present = spec.present
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, target_table_label,
                   is_required=is_required, is_present=is_present)

    def __init__(self, table_label, label, target_table_label,
                 is_required=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert (isinstance(target_table_label, unicode)
                and len(target_table_label) > 0)
        assert isinstance(is_present, bool)
        if is_present:
            assert isinstance(is_required, bool)
        else:
            assert is_required is None
        self.table_label = table_label
        self.label = label
        self.target_table_label = target_table_label
        self.is_required = is_required
        self.is_present = is_present
        #: Table SQL name.
        self.table_name = mangle(table_label)
        #: Column SQL name.
        self.name = mangle(label, u'id')
        #: Target table SQL name.
        self.target_table_name = mangle(target_table_label)
        #: Foreign key SQL name.
        self.constraint_name = mangle([table_label, label], u'fk')

    def __yaml__(self):
        yield ('link', self.label)
        yield ('of', self.table_label)
        yield ('to', self.target_table_label)
        if self.is_required is not None:
            yield ('required', self.is_required)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        args.append(repr(self.target_table_label))
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the link is present.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        if self.target_table_name not in schema:
            raise Error("Detected missing table:", self.target_table_name)
        target_table = schema[self.target_table_name]
        if u'id' not in target_table:
            raise Error("Detected missing column:",
                        "%s.id" % self.target_table_name)
        target_column = target_table[u'id']
        # Create the link column if it does not exist.
        # FIXME: check if a non-link column with the same label exists?
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:",
                            "%s.%s" % (self.table_name, self.name))
            driver.submit(sql_add_column(
                    self.table_name, self.name, target_column.type.name,
                    self.is_required))
            table.add_column(self.name, target_column.type, self.is_required)
        column = table[self.name]
        # Verify the column type and `NOT NULL` constraint.
        if column.type != target_column.type:
            raise Error("Detected column with mismatched type:", column)
        if column.is_not_null != self.is_required:
            raise Error("Detected column with mismatched"
                        " NOT NULL constraint:", column)
        # Create a `FOREIGN KEY` constraint if necessary.
        if not any(foreign_key
                   for foreign_key in table.foreign_keys
                   if list(foreign_key) == [(column, target_column)]):
            if driver.is_locked:
                raise Error("Detected column with missing"
                            " FOREIGN KEY constraint:", column)
            driver.submit(sql_add_foreign_key_constraint(
                    self.table_name, self.constraint_name, [self.name],
                    self.target_table_name, [u'id']))
            table.add_foreign_key(self.constraint_name, [column],
                                  target_table, [target_column])

    def drop(self, driver):
        # Ensures that the link is absent.
        schema = driver.get_schema()
        if self.table_name not in schema:
            return
        table = schema[self.table_name]
        if self.name not in table:
            return
        column = table[self.name]
        if driver.is_locked:
            raise Error("Detected unexpected column:", column)
        # Drop the link.
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()


class IdentityFact(Fact):

    fields = [
            ('identity', SeqVal(DottedLabelVal())),
            ('of', LabelVal(), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        labels = []
        if not spec.identity:
            raise Error("Got missing identity fields")
        for label in spec.identity:
            if u'.' in label:
                current_table_label = table_label
                table_label, label = label.split(u'.')
                if (current_table_label is not None and
                        table_label != current_table_label):
                    raise Error("Got mismatched table names:",
                                ", ".join((table_label, current_table_label)))
            labels.append(label)
        if table_label is None:
            raise Error("Got missing table name")
        return cls(table_label, labels)

    def __init__(self, table_label, labels):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (isinstance(labels, list) and len(labels) > 0 and
                all(isinstance(label, unicode) for label in labels) and
                len(set(labels)) == len(labels))
        self.table_label = table_label
        self.labels = labels
        #: Table SQL name.
        self.table_name = mangle(table_label)
        #: Column/Link SQL names.
        self.names = [(mangle(label), mangle(label, u'id'))
                      for label in labels]
        #: Constraint SQL name.
        self.constraint_name = mangle(table_label, u'pk')

    def __yaml__(self):
        yield ('identity', self.labels)
        yield ('of', self.table_label)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.labels))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        # Ensures the `PRIMARY KEY` constraint exists.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        columns = []
        for column_name, link_name in self.names:
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Detected missing column:",
                            "%s.%s" % (table, column_name))
            columns.append(column)
        # Drop the `PRIMARY KEY` constraint if it does not match the identity.
        if (table.primary_key is not None and
                list(table.primary_key) != columns):
            if driver.is_locked:
                raise Error("Detected table with mismatched"
                            " PRIMARY KEY constraint:", table)
            driver.submit(sql_drop_constraint(
                    self.table_name, table.primary_key.name))
            table.primary_key.remove()
        # Create the `PRIMARY KEY` constraint if necessary.
        if table.primary_key is None:
            if driver.is_locked:
                raise Error("Detected table with missing"
                            " PRIMARY KEY constraint:", table)
            driver.submit(sql_add_unique_constraint(
                    self.table_name, self.constraint_name,
                    [column.name for column in columns], True))
            table.add_primary_key(self.constraint_name, columns)


class _skip_type(object):
    def __repr__(self):
        return "SKIP"
SKIP = _skip_type()


class DataFact(Fact):

    fields = [
            ('data', StrVal()),
            ('of', LabelVal(), None),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        data_path = None
        data = None
        if u'\n' in spec.data:
            data = spec.data
        else:
            data_path = spec.data
            if driver.cwd is not None:
                data_path = os.path.join(driver.cwd, data_path)
            if table_label is None:
                table_label = os.path.splitext(os.path.basename(data_path))[0]
        if table_label is None:
            raise Error("Got missing table name")
        is_present = spec.present
        return cls(table_label, data_path=data_path, data=data,
                   is_present=is_present)

    def __init__(self, table_label, data_path=None, data=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (data_path is None or
                (isinstance(data_path, str) and len(data_path) > 0))
        assert (data is None or
                (isinstance(data, str) and len(data) > 0))
        assert (data_path is None) != (data is None)
        assert isinstance(is_present, bool)
        self.table_label = table_label
        self.data_path = data_path
        self.data = data
        self.is_present = is_present
        #: Table SQL name.
        self.table_name = mangle(table_label)

    def __yaml__(self):
        yield ('data', self.data_path or self.data)
        yield ('of', self.table_label)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        if self.data_path is not None:
            args.append("data_path=%r" % self.data_path)
        if self.data is not None:
            args.append("data=%r" % self.data)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table contains the given data.

        # Find the table.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        if table.primary_key is None:
            raise Error("Detected table without PRIMARY KEY constraint:", table)

        # Load existing table content.
        if table.data is None:
            rows = driver.submit(sql_select(
                    table.name, [column.name for column in table]))
            table.add_data(rows)

        # Load input data.
        rows = self._parse(driver, table)
        # If no input, assume NOOP.
        if not rows:
            return

        # Indexes of the primary key columns.
        key_mask = [table.columns.index(column.name)
                    for column in table.primary_key]
        # Indexes of columns that do not belong to the PK.
        nonkey_mask = [table.columns.index(column.name)
                       for column in table
                       if column not in table.primary_key]

        # Target table for a link column.
        targets = {}
        for column in table:
            foreign_keys = column.foreign_keys
            if foreign_keys:
                targets[column] = foreign_keys[0].target

        for row_idx, row in enumerate(rows):
            try:
                # Verify that PK is provided.
                for idx in key_mask:
                    if row[idx] is None or row[idx] is SKIP:
                        raise Error("Detected column with missing value:",
                                    table[idx])
                # Convert links to FK values.
                if targets:
                    items = []
                    for column, data in zip(table, row):
                        item = data
                        if (column in targets and
                                data is not None and data is not SKIP):
                            target = targets[column]
                            item = self._resolve(target, data)
                            if item is None:
                                dumper = self._domain(column).dump
                                raise Error("Detected unknown link:",
                                            dumper(data))
                        items.append(item)
                    row = tuple(items)
                # The primary key value.
                handle = tuple(row[idx] for idx in key_mask)
                # Find an existing row by the PK.
                old_row = table.data.get(table.primary_key, handle)
                if old_row is not None:
                    # Find columns and values that changed.
                    names = []
                    values = []
                    for column, data, old_data in zip(table, row, old_row):
                        if data is SKIP or data == old_data:
                            continue
                        names.append(column.name)
                        values.append(data)
                    if not names:
                        continue
                    # Update an existing row.
                    if driver.is_locked:
                        raise Error("Detected modified row")
                    key_names = [column.name
                                 for column in table.primary_key]
                    returning_names = [column.name for column in table]
                    output = driver.submit(sql_update(
                            table.name, key_names, handle, names, values,
                            returning_names))
                    assert len(output) == 1
                    table.data.update(old_row, output[0])
                else:
                    # Add a new row.
                    if driver.is_locked:
                        raise Error("Detected missing row")
                    names = []
                    values = []
                    for column, data in zip(table, row):
                        if data is SKIP:
                            continue
                        names.append(column.name)
                        values.append(data)
                    returning_names = [column.name for column in table]
                    output = driver.submit(sql_insert(
                            table.name, names, values, returning_names))
                    assert len(output) == 1
                    table.data.insert(output[0])
            except Error, error:
                # Add the row being processed to the error trace.
                items = []
                for column, data in zip(table, rows[row_idx]):
                    if data is None or data is SKIP:
                        continue
                    dumper = self._domain(column).dump
                    item = to_literal(dumper(data))
                    items.append(item)
                error.wrap("While processing row #%s:" % (row_idx+1),
                           u"{%s}" % u", ".join(items))
                raise

    def _parse(self, driver, table):
        # Loads and parses CSV input.
        if self.data_path is not None:
            reader = csv.reader(open(self.data_path))
        else:
            reader = csv.reader(self.data.splitlines())
        try:
            labels = next(reader)
        except StopIteration:
            # Empty CSV file, assume NOOP.
            return []
        slices = list(reader)

        # Maps a table column to a position in the slice.
        masks = {}
        # Maps a table column to a converter to native representation.
        parsers = {}
        # Find table columns provided by the input CSV.
        for idx, label in enumerate(labels):
            column_name = mangle(label)
            link_name = mangle(label, u'id')
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Detected missing column:",
                            "%s.%s" % (table, column_name))
            if column in masks:
                raise Error("Detected duplicate column:",
                            "%s.%s" % (table, column_name))
            masks[column] = idx
            parsers[column] = self._domain(column).parse

        # Verify that we got PK columns.
        for column in table.primary_key:
            if column not in masks:
                raise Error("Detected missing PRIMARY KEY column:", column)

        # Convert text slices into native form.
        rows = []
        for idx, slice in enumerate(slices):
            if self.data_path is not None:
                location = "\"%s\", row %s" % (self.data_path, idx+2)
            else:
                location = "row %s" % (idx+2)
            with guard("On:", location):
                if len(slice) < len(masks):
                    raise Error("Detected too few entries:",
                                "%s < %s" % (len(slice), len(masks)))
                elif len(slice) > len(masks):
                    raise Error("Detected too many entries:",
                                "%s > %s" % (len(slice), len(masks)))
                # Convert the row.
                row = []
                for column in table.columns:
                    if column not in masks:
                        data = SKIP
                    else:
                        text = slice[masks[column]]
                        if not text:
                            data = SKIP
                        else:
                            parser = parsers[column]
                            try:
                                data = parser(text.decode('utf-8'))
                            except ValueError, exc:
                                error = Error("Detected invalid input:", exc)
                                error.wrap("While converting column:", column)
                                raise error
                    row.append(data)
                rows.append(tuple(row))

        return rows

    def _domain(self, column):
        # Determines HTSQL domain of the column.

        # FK column -> identity of the target table.
        if column.foreign_keys:
            target = column.foreign_keys[0].target
            labels = [self._domain(column)
                      for column in target.primary_key]
            return htsql.core.domain.IdentityDomain(labels)
        # Type image.
        type = column.type
        # Unwrap a domain type.
        while type.is_domain:
            type = type.base_type
        # Translate a `ENUM` type.
        if type.is_enum:
            labels = [label.decode('utf-8') for label in type.labels]
            return htsql.core.domain.EnumDomain(labels)
        # Translate known scalar types.
        elif type.schema.name == 'pg_catalog':
            if type.name == 'bool':
                return htsql.core.domain.BooleanDomain()
            elif type.name in ['int2', 'int4', 'int8']:
                return htsql.core.domain.IntegerDomain()
            elif type.name in ['float4', 'float8']:
                return htsql.core.domain.FloatDomain()
            elif type.name == 'numeric':
                return htsql.core.domain.DecimalDomain()
            elif type.name in ['bpchar', 'varchar', 'text']:
                return htsql.core.domain.TextDomain()
            elif type.name == 'date':
                return htsql.core.domain.DateDomain()
            elif type.name in ['time', 'timetz']:
                return htsql.core.domain.TimeDomain()
            elif type.name in ['timestamp', 'timestamptz']:
                return htsql.core.domain.DateTimeDomain()
        # Fallback domain.
        return htsql.core.domain.OpaqueDomain()

    def _resolve(self, table, identity):
        # Finds a row by identity.

        # Pre-load table data if necessary.
        if table.data is None:
            rows = driver.submit(sql_select(
                    table.name, [column.name for column in table]))
            table.add_data(rows)
        # Determine the PK value.
        handle = []
        for item, column in zip(identity, table.primary_key):
            if not column.foreign_keys:
                handle.append(item)
            else:
                target = column.foreign_keys[0].target
                item = self._resolve(target, item)
                handle.append(item)
        handle = tuple(handle)
        # Find the row by PK.
        row = table.data.get(table.primary_key, handle)
        # Return the row ID.
        if row is None:
            return None
        else:
            return row[0]

    def drop(self, driver):
        raise NotImplementedError("%s.drop()" % self.__class__.__name__)


def deploy(logging={}, dry_run=False):
    time_start = datetime.datetime.now()
    # Prepare the driver.
    cluster = get_cluster()
    connection = cluster.connect()
    driver = Driver(connection, logging=logging)
    packages = [package for package in reversed(get_packages())
                        if package.exists('deploy.yaml')]
    if not packages:
        driver.log("Nothing to deploy.")
    facts_by_package = {}
    # Load and parse `deploy.yaml` files.
    for package in packages:
        driver.chdir(package.abspath('/'))
        package_facts = driver.parse(package.open('deploy.yaml'))
        if not isinstance(package_facts, list):
            package_facts = [package_facts]
        facts_by_package[package] = package_facts
    driver.chdir(None)
    # Deploying database schema.
    for package in packages:
        driver.log("Deploying {}.", package.name)
        facts = facts_by_package[package]
        driver(facts)
    # Validating directives.
    driver.reset()
    for package in packages:
        driver.log("Validating {}.", package.name)
        facts = facts_by_package[package]
        driver(facts, is_locked=True)
    # Commit changes and report.
    if not dry_run:
        connection.commit()
    else:
        driver.log("Rolling back changes (dry run).")
        connection.rollback()
    time_end = datetime.datetime.now()
    driver.debug("Total time: {}", time_end-time_start)



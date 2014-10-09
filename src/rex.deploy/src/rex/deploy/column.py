#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, BoolVal, UStrVal, UChoiceVal, SeqVal, OneOrSeqVal,
        UnionVal, OnSeq)
from .identity import _generate
from .fact import Fact, LabelVal, QLabelVal, TitleVal, label_to_title
from .meta import uncomment
from .recover import recover
from .sql import (mangle, sql_add_column, sql_drop_column, sql_rename_column,
        sql_comment_on_column, sql_create_enum_type, sql_drop_type,
        sql_rename_type, sql_create_function, sql_drop_function,
        sql_create_trigger, sql_drop_trigger)


class ColumnFact(Fact):
    """
    Describes a table column.

    `table_label`: ``unicode``
        Table name.
    `label`: ``unicode``
        The name of the column.
    `type`: *type name* or [``unicode``]
        The type of the column; one of: *boolean*, *integer*,
        *decimal*, *float*, *text*, *date*, *time*, *datetime*.
        For an ``ENUM`` type, specify a list of ``ENUM`` labels.
    `former_labels`: [``unicode``]
        Names that the column may had in the past.
    `is_required`: ``bool``
        Indicates if ``NULL`` values are not allowed.
    `title`: ``unicode`` or ``None``
        The title of the column.  If not set, generated from the label.
    `is_present`: ``bool``
        Indicates whether the column exists.
    """

    # HTSQL name -> SQL name.
    TYPE_MAP = {
            u"boolean": u"bool",
            u"integer": u"int4",
            u"decimal": u"numeric",
            u"float": u"float8",
            u"text": u"text",
            u"date": u"date",
            u"time": u"time",
            u"datetime": u"timestamp",
    }

    # SQL type name -> HTSQL name.
    REVERSE_TYPE_MAP = dict((sql_name, htsql_name)
                            for htsql_name, sql_name in TYPE_MAP.items())

    fields = [
            ('column', QLabelVal),
            ('of', LabelVal, None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('type', UnionVal((OnSeq, SeqVal(UStrVal(r'[0-9A-Za-z_-]+'))),
                              UChoiceVal(*sorted(TYPE_MAP))), None),
            ('required', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
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
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        type = spec.type
        title = spec.title
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
            if former_labels:
                raise Error("Got unexpected clause:", "was")
            if type is not None:
                raise Error("Got unexpected clause:", "type")
            if title is not None:
                raise Error("Got unexpected clause:", "title")
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, former_labels=former_labels,
                   title=title, type=type,
                   is_required=is_required, is_present=is_present)

    @classmethod
    def recover(cls, driver, column):
        table_fact = recover(driver, column.table)
        if table_fact is None:
            return None
        meta = uncomment(column)
        label = meta.label or column.name
        if mangle(label) != column.name:
            return None
        type = None
        if column.type.is_enum:
            if (column.type.schema is column.table.schema and
                column.type.name == mangle([table_fact.label, label], u'enum')):
                type = column.type.labels
        else:
            system_schema = driver.get_catalog()[u'pg_catalog']
            if column.type.schema is system_schema:
                type = cls.REVERSE_TYPE_MAP.get(column.type.name)
        if type is None:
            return None
        return cls(table_fact.label, label, type,
                   is_required=column.is_not_null, title=meta.title)

    def __init__(self, table_label, label, type=None, former_labels=[],
                 is_required=None, title=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            assert (isinstance(type, unicode) and type in self.TYPE_MAP or
                    isinstance(type, list) and len(type) > 0 and
                    all(isinstance(label, unicode) and len(label) > 0
                        for label in type) and
                    len(set(type)) == len(type))
            assert isinstance(is_required, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
        else:
            assert former_labels == []
            assert type is None
            assert is_required is None
            assert title is None
        self.table_label = table_label
        self.label = label
        self.type = type
        self.former_labels = former_labels
        self.is_required = is_required
        self.title = title
        self.is_present = is_present
        self.table_name = mangle(table_label)
        self.name = mangle(label)
        self.name_for_link = mangle(label, u'id')
        if type is None:
            self.type_name = None
            self.enum_labels = None
        elif isinstance(type, list):
            self.type_name = mangle([table_label, label], u'enum')
            self.enum_labels = type
        else:
            self.type_name = self.TYPE_MAP[self.type]
            self.enum_labels = None

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.type is not None:
            args.append(repr(self.type))
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if self.title is not None:
            args.append("title=%r" % self.title)
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
        table = schema[self.table_name]
        # Verify that we don't have a link under the same name.
        if self.name_for_link in table:
            raise Error("Detected unexpected column:", self.name_for_link)
        # Verify if we need to rename the column.
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:", self.name)
            for former_label in self.former_labels:
                former_name = mangle(former_label)
                if former_name not in table:
                    continue
                column = table[former_name]
                # Rename the column.
                driver.submit(sql_rename_column(
                        self.table_name, former_name, self.name))
                column.rename(self.name)
                # Rename the type if necessary.
                if column.type.is_enum:
                    former_type_name = mangle(
                            [self.table_label, former_label], u'enum')
                    if column.type.name == former_type_name:
                        driver.submit(sql_rename_type(
                                former_type_name, self.type_name))
                        column.type.rename(self.type_name)
                # Rebuild `PRIMARY KEY` generator.
                source = None
                if table.primary_key is not None and \
                        column in table.primary_key:
                    meta = uncomment(table.primary_key)
                    if meta.generators:
                        source = _generate(table, meta.generators)
                if source is not None:
                    procedure_name = mangle(self.table_name, u'pk')
                    signature = (procedure_name, ())
                    trigger = table.triggers.get(procedure_name)
                    procedure = schema.procedures.get(signature)
                    if trigger is not None:
                        driver.submit(sql_drop_trigger(
                                self.table_name, procedure_name))
                        trigger.remove()
                    if procedure is not None:
                        driver.submit(sql_drop_function(
                                procedure_name, ()))
                        procedure.remove()
                    driver.submit(sql_create_function(
                            procedure_name, (), u"trigger", u"plpgsql",
                            source))
                    system_schema = driver.get_catalog()['pg_catalog']
                    procedure = schema.add_procedure(
                            procedure_name, (),
                            system_schema.types[u'trigger'], source)
                    driver.submit(sql_create_trigger(
                            self.table_name, procedure_name,
                            u"BEFORE", u"INSERT",
                            procedure_name, ()))
                    table.add_trigger(procedure_name, procedure)
                break
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
        # Create the column if it does not exist.
        if self.name not in table:
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
        # Store the original column label and the column title.
        meta = uncomment(column)
        saved_label = self.label if self.label != self.name else None
        saved_title = self.title if self.title != label_to_title(self.label) \
                      else None
        if meta.update(label=saved_label, title=saved_title):
            comment = meta.dump()
            if driver.is_locked:
                raise Error("Detected missing metadata:", comment)
            driver.submit(sql_comment_on_column(
                    self.table_name, self.name, comment))
            column.set_comment(comment)

    def drop(self, driver):
        # Ensures that the column is absent.
        # Find the table.
        schema = driver.get_schema()
        if self.table_name not in schema:
            return
        table = schema[self.table_name]
        # Verify that we don't have a link under the same name.
        if self.name_for_link in table:
            raise Error("Detected unexpected column", self.name_for_link)
        # Find the column.
        if self.name not in table:
            return
        column = table[self.name]
        if driver.is_locked:
            raise Error("Detected unexpected column:", column)
        # Check if we need to purge the identity.
        identity_fact = None
        if table.primary_key is not None and column in table.primary_key:
            identity_fact = recover(driver, table.primary_key)
        # Drop the column.
        type = column.type
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()
        # Drop the dependent ENUM type.
        if type.is_enum:
            driver.submit(sql_drop_type(type.name))
            type.remove()
        # Purge the identity.
        if identity_fact is not None:
            identity_fact.purge(driver)

    def purge(self, driver):
        # Removes remains of a column after the table is dropped.
        schema = driver.get_schema()
        # Drop the ENUM type.
        if isinstance(self.type, list):
            enum_type = schema.types.get(self.type_name)
            if enum_type is not None:
                driver.submit(sql_drop_type(self.type_name))
                enum_type.remove()



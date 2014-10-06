#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, OneOrSeqVal, locate
from .identity import _generate
from .fact import Fact, FactVal, LabelVal, TitleVal, label_to_title
from .meta import TableMeta, ColumnMeta, PrimaryKeyMeta
from .sql import (mangle, sql_create_table, sql_drop_table, sql_rename_table,
        sql_comment_on_table, sql_define_column, sql_set_column_default,
        sql_add_unique_constraint, sql_rename_constraint, sql_rename_index,
        sql_create_sequence, sql_rename_sequence, sql_nextval, sql_drop_type,
        sql_rename_type, sql_create_function, sql_drop_function,
        sql_create_trigger, sql_drop_trigger)


class TableFact(Fact):
    """
    Describes a database table.

    `label`: ``unicode``
        The name of the table.
    `former_labels`: [``unicode``]
        Names that the table may have had in the past.
    `is_reliable`: ``bool``
        Indicates whether the table is crush-safe.
    `title`: ``unicode`` or ``None``
        The title of the table.  If not set, generated from the label.
    `is_present`: ``bool``
        Indicates whether the table exists in the database.
    `related`: [:class:`Fact`] or ``None``
        Facts to be deployed when the table is deployed.  Could be specified
        only when ``is_present`` is ``True``.
    """

    fields = [
            ('table', LabelVal),
            ('was', OneOrSeqVal(LabelVal), None),
            ('reliable', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
            ('with', SeqVal(FactVal), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        label = spec.table
        is_present = spec.present
        is_reliable = spec.reliable
        if is_present:
            if is_reliable is None:
                is_reliable = True
        else:
            if is_reliable is not None:
                raise Error("Got unexpected clause:", "reliable")
        if not is_present and spec.was:
            raise Error("Got unexpected clause:", "was")
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        if not is_present and spec.title:
            raise Error("Got unexpected clause:", "title")
        title = spec.title
        if not is_present and spec.with_:
            raise Error("Got unexpected clause:", "with")
        related = None
        if spec.with_:
            related = []
            for related_spec in spec.with_:
                if 'of' not in related_spec._fields:
                    raise Error("Got unrelated fact:",
                                locate(related_spec))
                if related_spec.of is None:
                    related_spec = related_spec.__clone__(of=label)
                if related_spec.of != label:
                    raise Error("Got unrelated fact:",
                                locate(related_spec))
                related_fact = driver.build(related_spec)
                related.append(related_fact)
        return cls(label, former_labels=former_labels,
                   is_reliable=is_reliable, title=title,
                   is_present=is_present, related=related)

    def __init__(self, label, former_labels=[], is_reliable=True,
                 title=None, is_present=True, related=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            assert isinstance(is_reliable, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
            assert (related is None or
                    (isinstance(related, list) and
                     all(isinstance(fact, Fact) for fact in related)))
        else:
            assert former_labels == []
            assert is_reliable is None or isinstance(is_reliable, bool)
            assert title is None
            assert related is None
        self.label = label
        self.former_labels = former_labels
        self.is_reliable = is_reliable
        self.title = title
        self.is_present = is_present
        self.related = related
        self.name = mangle(label)
        self.constraint_name = mangle(label, u'uk')
        self.sequence_name = mangle(label, u'seq')

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_reliable is False:
            args.append("is_reliable=%r" % self.is_reliable)
        if self.title is not None:
            args.append("title=%r" % self.title)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        if self.related is not None:
            args.append("related=%r" % self.related)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table exists.
        schema = driver.get_schema()

        # Check if we need to rename the table.
        if self.name not in schema:
            if driver.is_locked:
                raise Error("Detected missing table:", self.name)
            for former_label in self.former_labels:
                former_name = mangle(former_label)
                if former_name not in schema:
                    continue
                table = schema[former_name]
                # Rename the table itself.
                driver.submit(sql_rename_table(
                        former_name, self.name))
                table.rename(self.name)
                # Find and rename the table sequence.
                former_sequence_name = mangle(former_label, u'seq')
                sequence = schema.sequences.get(former_sequence_name)
                if sequence is not None:
                    driver.submit(sql_rename_sequence(
                            former_sequence_name, self.sequence_name))
                    sequence.rename(self.sequence_name)
                # Find and rename `UNIQUE` and `PRIMARY KEY` constraints.
                for suffix in [u'uk', u'pk']:
                    former_constraint_name = mangle(former_label, suffix)
                    constraint_name = mangle(self.label, suffix)
                    constraint = table.constraints.get(former_constraint_name)
                    if constraint is not None:
                        driver.submit(sql_rename_constraint(
                                self.name, former_constraint_name,
                                constraint_name))
                        constraint.rename(constraint_name)
                    index = schema.indexes.get(former_constraint_name)
                    if index is not None:
                        index.rename(constraint_name)
                # Rename constraints and other objects associated with
                # each column.
                for column in table.columns:
                    # Demangle the field label.
                    meta = ColumnMeta.parse(column)
                    if meta.label is not None:
                        field_label = meta.label
                    else:
                        field_label = column.name
                        if field_label.endswith(u'_id'):
                            field_label = field_label[:-2].rstrip(u'_')
                    column_name = mangle(field_label)
                    link_name = mangle(field_label, u'id')
                    if column.name == column_name:
                        # Rename `ENUM` types.
                        if column.type.is_enum:
                            former_enum_name = mangle(
                                    [former_label, field_label], u'enum')
                            if column.type.name == former_enum_name:
                                enum_name = mangle(
                                        [self.label, field_label], u'enum')
                                driver.submit(sql_rename_type(
                                        former_enum_name, enum_name))
                                column.type.rename(enum_name)
                    elif column.name == link_name:
                        # Rename `FOREIGN KEY` constraints.
                        former_constraint_name = mangle(
                                [former_label, field_label], u'fk')
                        constraint_name = mangle(
                                [self.label, field_label], u'fk')
                        constraint = table.constraints.get(former_constraint_name)
                        if constraint is not None:
                            driver.submit(sql_rename_constraint(
                                    self.name, former_constraint_name,
                                    constraint_name))
                            constraint.rename(constraint_name)
                        index = schema.indexes.get(former_constraint_name)
                        if index is not None:
                            driver.submit(sql_rename_index(
                                    former_constraint_name, constraint_name))
                            index.rename(constraint_name)
                # Rebuild `PRIMARY KEY` generator.
                source = None
                if table.primary_key is not None:
                    meta = PrimaryKeyMeta.parse(table.primary_key)
                    if meta.generators:
                        source = _generate(table, meta.generators)
                if source is not None:
                    former_procedure_name = mangle(former_label, u'pk')
                    former_signature = (former_procedure_name, ())
                    procedure_name = mangle(self.label, u'pk')
                    signature = (procedure_name, ())
                    trigger = table.triggers.get(former_procedure_name)
                    procedure = schema.procedures.get(former_signature)
                    if trigger is not None:
                        driver.submit(sql_drop_trigger(
                                self.name, former_procedure_name))
                        trigger.remove()
                    if procedure is not None:
                        driver.submit(sql_drop_function(
                                former_procedure_name, ()))
                        procedure.remove()
                    driver.submit(sql_create_function(
                            procedure_name, (), u"trigger", u"plpgsql",
                            source))
                    system_schema = driver.get_catalog()['pg_catalog']
                    procedure = schema.add_procedure(
                            procedure_name, (),
                            system_schema.types[u'trigger'], source)
                    driver.submit(sql_create_trigger(
                            self.name, procedure_name,
                            u"BEFORE", u"INSERT",
                            procedure_name, ()))
                    table.add_trigger(procedure_name, procedure)
                break

        # Create the table if it does not exist.
        if self.name not in schema:
            # Submit `CREATE TABLE {name} (id int4 NOT NULL)` and
            # `ADD CONSTRAINT UNIQUE (id)`.
            body = [sql_define_column(u'id', u'int4', True)]
            is_unlogged = (not self.is_reliable)
            driver.submit(sql_create_table(
                    self.name, body, is_unlogged=is_unlogged))
            driver.submit(sql_add_unique_constraint(
                    self.name, self.constraint_name, [u'id'], False))
            # Submit `CREATE SEQUENCE` and `ALTER COLUMN SET DEFAULT`.
            default = sql_nextval(self.sequence_name)
            driver.submit(sql_create_sequence(
                    self.sequence_name, self.name, u'id'))
            driver.submit(sql_set_column_default(
                    self.name, u'id', default))
            # Update the catalog image.
            system_schema = driver.get_catalog()[u'pg_catalog']
            table = schema.add_table(self.name)
            table.set_is_unlogged(is_unlogged)
            int4_type = system_schema.types[u'int4']
            id_column = table.add_column(u'id', int4_type, True, default)
            table.add_unique_key(self.constraint_name, [id_column])
            schema.add_index(self.constraint_name, table, [id_column])
            schema.add_sequence(self.sequence_name)
        # Verify that the table has `id` column with a UNIQUE contraint.
        table = schema[self.name]
        if u'id' not in table:
            raise Error("Detected missing column:", "id")
        id_column = table['id']
        if not any(unique_key.origin_columns == [id_column]
                   for unique_key in table.unique_keys):
            raise Error("Detected missing column UNIQUE constraint:", "id")
        if table.is_unlogged != (not self.is_reliable):
            raise Error("Detected table with mismatched"
                        " reliability characteristic:", table)
        # Store the original table label and the table title.
        meta = TableMeta.parse(table)
        saved_label = self.label if self.label != self.name else None
        saved_title = self.title if self.title != label_to_title(self.label) \
                      else None
        if meta.update(label=saved_label, title=saved_title):
            comment = meta.dump()
            if driver.is_locked:
                raise Error("Detected missing metadata:", comment)
            driver.submit(sql_comment_on_table(self.name, comment))
            table.set_comment(comment)
        # Apply nested facts.
        if self.related:
            driver(self.related)

    def drop(self, driver):
        # Ensures that the table does not exist.
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
            raise Error("Cannot delete a table with links into it:", self.name)
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
        # Remove any associated sequences.
        if self.sequence_name in schema.sequences:
            schema.sequences[self.sequence_name].remove()



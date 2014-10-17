#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, OneOrSeqVal, locate
from .identity import _generate
from .fact import Fact, FactVal, LabelVal, TitleVal, label_to_title
from .meta import uncomment
from .recover import recover
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
        if not spec.present:
            for field in ['was', 'reliable', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
            if spec.with_ is not None:
                raise Error("Got unexpected clause:", "with")
        label = spec.table
        is_present = spec.present
        is_reliable = spec.reliable
        if is_present:
            if is_reliable is None:
                is_reliable = True
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        title = spec.title
        related = None
        after = None
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
                if 'after' in related_spec._fields:
                    if after is not None and related_spec.after is None:
                        related_spec = related_spec.__clone__(after=after)
                related_fact = driver.build(related_spec)
                related.append(related_fact)
                if hasattr(related_fact, 'label'):
                    after = related_fact.label
        return cls(label, former_labels=former_labels,
                   is_reliable=is_reliable, title=title,
                   is_present=is_present, related=related)

    @classmethod
    def recover(cls, driver, table):
        # Recovers the fact from an existing database table.
        schema = driver.get_schema()
        if table.schema is not schema:
            return None
        meta = uncomment(table)
        label = meta.label or table.name
        name = mangle(label)
        if name != table.name:
            return None
        if u'id' not in table:
            return None
        id_column = table['id']
        if not any(unique_key.origin_columns == [id_column]
                   for unique_key in table.unique_keys):
            return None
        is_reliable = (not table.is_unlogged)
        return cls(label, is_reliable=is_reliable, title=meta.title)

    def __init__(self, label, former_labels=[], is_reliable=None,
                 title=None, is_present=True, related=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            if is_reliable is None:
                is_reliable = True
            assert isinstance(is_reliable, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
            assert (related is None or
                    (isinstance(related, list) and
                     all(isinstance(fact, Fact) for fact in related)))
        else:
            assert former_labels == []
            assert is_reliable is None
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
            for former_label in self.former_labels:
                former_name = mangle(former_label)
                if former_name not in schema:
                    continue
                table = schema[former_name]
                # Rename the table itself.
                driver.submit(sql_rename_table(
                        former_name, self.name))
                table.set_name(self.name)
                # Rename auxiliary objects.
                self.rebase(driver, former_label)
                for column in table.columns:
                    field_fact = recover(driver, column)
                    if field_fact is not None:
                        field_fact.rebase(driver,
                                former_label, field_fact.label)
                identity_fact = recover(driver, table.primary_key)
                if identity_fact is not None:
                    identity_fact.rebase(driver, former_label)
                # Rename links into the table.
                for foreign_key in table.referring_foreign_keys:
                    if foreign_key.origin is table:
                        continue
                    for column in foreign_key.origin_columns:
                        link_fact = recover(driver, column)
                        if link_fact is None or link_fact.label != former_label:
                            continue
                        link_fact = link_fact.clone(
                                label=self.label, former_labels=[former_label])
                        link_fact(driver)
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
        meta = uncomment(table)
        saved_label = self.label if self.label != self.name else None
        saved_title = self.title if self.title != label_to_title(self.label) \
                      else None
        if meta.update(label=saved_label, title=saved_title):
            comment = meta.dump()
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
        table = schema[self.name]
        # Remove links to the table.
        for foreign_key in table.referring_foreign_keys:
            if foreign_key.origin is table:
                continue
            for column in foreign_key.origin_columns:
                link_fact = recover(driver, column)
                if link_fact is not None:
                    link_fact.drop(driver)
        # Gather facts to be purged.
        field_facts = [recover(driver, column) for column in table]
        identity_fact = recover(driver, table.primary_key)
        # Submit `DROP TABLE {name}`.
        driver.submit(sql_drop_table(self.name))
        table.remove()
        # Purge the remains.
        sequence = schema.sequences.get(self.sequence_name)
        if sequence is not None:
            sequence.remove()
        for field_fact in field_facts:
            if field_fact is not None:
                field_fact.purge(driver)
        if identity_fact is not None:
            identity_fact.purge(driver)

    def rebase(self, driver, former_label):
        # Renames auxiliary objects after the table is renamed.
        schema = driver.get_schema()
        assert self.name in schema
        table = schema[self.name]
        assert u'id' in table
        id_column = table[u'id']
        # Rename the sequence.
        former_sequence_name = mangle(former_label, u'seq')
        sequence = schema.sequences.get(former_sequence_name)
        if sequence is not None and \
                self.sequence_name != former_sequence_name:
            driver.submit(sql_rename_sequence(
                    former_sequence_name, self.sequence_name))
            sequence.set_name(self.sequence_name)
            if id_column.default == sql_nextval(former_sequence_name):
                id_column.set_default(sql_nextval(self.sequence_name))
        # Rename the `UNIQUE` constraint.
        former_constraint_name = mangle(former_label, u'uk')
        constraint = table.constraints.get(former_constraint_name)
        if constraint is not None and \
                self.constraint_name != former_constraint_name:
            driver.submit(sql_rename_constraint(
                    self.name, former_constraint_name,
                    self.constraint_name))
            constraint.set_name(self.constraint_name)
        index = schema.indexes.get(former_constraint_name)
        if index is not None:
            index.set_name(self.constraint_name)

    def purge(self, driver):
        raise NotImplementedError()



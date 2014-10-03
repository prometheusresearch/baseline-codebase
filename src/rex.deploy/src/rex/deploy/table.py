#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, locate
from .fact import Fact, FactVal, LabelVal, TitleVal, label_to_title
from .meta import TableMeta
from .sql import (mangle, sql_create_table, sql_drop_table,
        sql_comment_on_table, sql_define_column, sql_set_column_default,
        sql_add_unique_constraint, sql_create_sequence, sql_nextval,
        sql_drop_type)


class TableFact(Fact):
    """
    Describes a database table.

    `label`: ``unicode``
        The name of the table.
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
        return cls(label, is_reliable=is_reliable, title=title,
                   is_present=is_present, related=related)

    def __init__(self, label, is_reliable=True, title=None, is_present=True,
                 related=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert isinstance(is_reliable, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
            assert (related is None or
                    (isinstance(related, list) and
                     all(isinstance(fact, Fact) for fact in related)))
        else:
            assert is_reliable is None or isinstance(is_reliable, bool)
            assert title is None
            assert related is None
        self.label = label
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
        # Create the table if it does not exist.
        if self.name not in schema:
            if driver.is_locked:
                raise Error("Detected missing table:", self.name)
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



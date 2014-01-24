#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal
from .fact import Fact, LabelVal, QLabelVal, TitleVal, label_to_title
from .meta import ColumnMeta, TableMeta
from .sql import (mangle, sql_add_column, sql_drop_column,
        sql_comment_on_column, sql_add_foreign_key_constraint)


class LinkFact(Fact):
    """
    Describes a link between two tables.

    `table_label`: ``unicode``
        The name of the origin table.
    `label`: ``unicode``
        The name of the link.
    `target_table_label`: ``unicode`` or ``None``
        The name of the target table.  Must be ``None``
        if ``is_present`` is not set.
    `is_required`: ``bool`` or ``None``
        Indicates if ``NULL`` values are not allowed.  Must be ``None``
        if ``is_present`` is not set.
    `title`: ``unicode`` or ``None``
        The title of the link.  If not set, borrowed from the target title
        or generated from the label.
    `is_present`: ``bool``
        Indicates whether the link exists.
    """

    fields = [
            ('link', QLabelVal),
            ('of', LabelVal, None),
            ('to', LabelVal, None),
            ('required', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
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
        target_table_label = spec.to
        is_required = spec.required
        title = spec.title
        is_present = spec.present
        if is_present:
            if target_table_label is None:
                target_table_label = label
            if is_required is None:
                is_required = True
        else:
            if target_table_label is not None:
                raise Error("Got unexpected clause:", "to")
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
            if title is not None:
                raise Error("Got unexpected clause:", "title")
        return cls(table_label, label, target_table_label,
                   is_required=is_required, title=title, is_present=is_present)

    def __init__(self, table_label, label, target_table_label=None,
                 is_required=None, title=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(target_table_label, unicode)
                    and len(target_table_label) > 0)
            assert isinstance(is_required, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
        else:
            assert target_table_label is None
            assert is_required is None
            assert title is None
        self.table_label = table_label
        self.label = label
        self.target_table_label = target_table_label
        self.is_required = is_required
        self.title = title
        self.is_present = is_present
        self.table_name = mangle(table_label)
        self.name = mangle(label, u'id')
        self.name_for_column = mangle(label)
        if is_present:
            self.target_table_name = mangle(target_table_label)
            self.constraint_name = mangle([table_label, label], u'fk')
        else:
            self.target_table_name = None
            self.constraint_name = None

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.target_table_label is not None:
            args.append(repr(self.target_table_label))
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
        # Ensures that the link is present.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        if self.target_table_name not in schema:
            raise Error("Detected missing table:", self.target_table_name)
        target_table = schema[self.target_table_name]
        if u'id' not in target_table:
            raise Error("Detected missing column:", "id")
        target_column = target_table[u'id']
        # Verify that we don't have a regular column under the same name.
        if self.name_for_column in table:
            raise Error("Detected unexpected column", self.name_for_column)
        # Create the link column if it does not exist.
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:", self.name)
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
        # Store the original link label and the link title.
        meta = ColumnMeta.parse(column)
        preferred_label = self.name[:-2].rstrip(u'_') \
                                if self.name.endswith(u'_id') else None
        saved_label = self.label if self.label != preferred_label else None
        preferred_title = label_to_title(self.label)
        if self.label == self.target_table_label:
            target_meta = TableMeta.parse(target_table)
            if target_meta.title:
                preferred_title = target_meta.title
        saved_title = self.title if self.title != preferred_title else None
        if meta.update(label=saved_label, title=saved_title):
            comment = meta.dump()
            if driver.is_locked:
                raise Error("Detected missing metadata:", comment)
            driver.submit(sql_comment_on_column(
                    self.table_name, self.name, comment))
            column.set_comment(comment)

    def drop(self, driver):
        # Ensures that the link is absent.
        # Find the table.
        schema = driver.get_schema()
        if self.table_name not in schema:
            return
        table = schema[self.table_name]
        # Verify that we don't have a regular column under the same name.
        if self.name_for_column in table:
            raise Error("Detected unexpected column", self.name_for_column)
        # Find the column.
        if self.name not in table:
            return
        column = table[self.name]
        if driver.is_locked:
            raise Error("Detected unexpected column:", column)
        # Drop the link.
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()



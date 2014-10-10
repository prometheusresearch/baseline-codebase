#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, OneOrSeqVal
from .identity import _generate
from .fact import Fact, LabelVal, QLabelVal, TitleVal, label_to_title
from .image import SET_DEFAULT
from .meta import uncomment
from .recover import recover
from .sql import (mangle, sql_add_column, sql_drop_column, sql_rename_column,
        sql_comment_on_column, sql_add_foreign_key_constraint,
        sql_rename_constraint, sql_create_index, sql_rename_index,
        sql_create_function, sql_drop_function, sql_create_trigger,
        sql_drop_trigger)


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
    `former_labels`: [``unicode``]
        Names that the link may have had in the past.
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
            ('was', OneOrSeqVal(LabelVal), None),
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
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
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
            if former_labels:
                raise Error("Got unexpected clause:", "was")
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
            if title is not None:
                raise Error("Got unexpected clause:", "title")
        return cls(table_label, label, target_table_label,
                    former_labels=former_labels, is_required=is_required,
                    title=title, is_present=is_present)

    @classmethod
    def recover(cls, driver, column):
        table_fact = recover(driver, column.table)
        if table_fact is None:
            return None
        meta = uncomment(column)
        label = meta.label
        if label is None:
            if not column.name.endswith(u'_id'):
                return None
            label = column.name[:-2].rstrip(u'_')
        if mangle(label, u'id') != column.name:
            return None
        foreign_keys = column.foreign_keys
        if len(foreign_keys) != 1:
            return None
        [foreign_key] = foreign_keys
        if (foreign_key.origin_columns != [column] or
            foreign_key.target_columns[0].name != u'id'):
            return None
        target_table_fact = recover(driver, foreign_key.target)
        if target_table_fact is None:
            return None
        return cls(table_fact.label, label, target_table_fact.label,
                   is_required=column.is_not_null, title=meta.title)

    def __init__(self, table_label, label, target_table_label=None,
                 former_labels=[],
                 is_required=None, title=None, is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(target_table_label, unicode)
                    and len(target_table_label) > 0)
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            assert isinstance(is_required, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
        else:
            assert target_table_label is None
            assert former_labels == []
            assert is_required is None
            assert title is None
        self.table_label = table_label
        self.label = label
        self.target_table_label = target_table_label
        self.former_labels = former_labels
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
        # Verify if we need to rename the link.
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:", self.name)
            for former_label in self.former_labels:
                former_name = mangle(former_label, u"id")
                if former_name not in table:
                    continue
                column = table[former_name]
                # Rename the column.
                driver.submit(sql_rename_column(
                        self.table_name, former_name, self.name))
                column.rename(self.name)
                # Rename auxiliary objects.
                self.rebase(driver, self.table_label, former_label)
                identity_fact = recover(driver, table.primary_key)
                if identity_fact is not None:
                    identity_fact.rebase(driver, self.table_label)
                break
        # Create the link column if it does not exist.
        if self.name not in table:
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
        # Create a `FOREIGN KEY` constraint and an associated index
        # if necessary.
        if not any(foreign_key
                   for foreign_key in table.foreign_keys
                   if list(foreign_key) == [(column, target_column)]):
            if driver.is_locked:
                raise Error("Detected column with missing"
                            " FOREIGN KEY constraint:", column)
            driver.submit(sql_add_foreign_key_constraint(
                    self.table_name, self.constraint_name, [self.name],
                    self.target_table_name, [u'id'], on_delete=SET_DEFAULT))
            table.add_foreign_key(self.constraint_name, [column],
                                  target_table, [target_column],
                                  on_delete=SET_DEFAULT)
            driver.submit(sql_create_index(self.constraint_name,
                    self.table_name, [self.name]))
            schema.add_index(self.constraint_name, table, [column])
        # Store the original link label and the link title.
        meta = uncomment(column)
        preferred_label = self.name[:-2].rstrip(u'_') \
                                if self.name.endswith(u'_id') else None
        saved_label = self.label if self.label != preferred_label else None
        preferred_title = label_to_title(self.label)
        if self.label == self.target_table_label:
            target_meta = uncomment(target_table)
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
        # Check if we need to purge the identity.
        identity_fact = None
        if table.primary_key is not None and column in table.primary_key:
            identity_fact = recover(driver, table.primary_key)
        # Drop the link.
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()
        # Purge the identity.
        if identity_fact is not None:
            identity_fact.purge(driver)

    def rebase(self, driver, former_table_label, former_label):
        # Updates the names after the table or the column gets renamed.
        schema = driver.get_schema()
        assert self.table_name in schema
        table = schema[self.table_name]
        # Rename the `FOREIGN KEY` constraint and its index.
        former_constraint_name = mangle(
                [former_table_label, former_label], u'fk')
        constraint = table.constraints.get(former_constraint_name)
        if constraint is not None and \
                self.constraint_name != former_constraint_name:
            driver.submit(sql_rename_constraint(
                    self.table_name, former_constraint_name,
                    self.constraint_name))
            constraint.rename(self.constraint_name)
        index = schema.indexes.get(former_constraint_name)
        if index is not None and \
                self.constraint_name != former_constraint_name:
            driver.submit(sql_rename_index(
                    former_constraint_name, self.constraint_name))
            index.rename(self.constraint_name)

    def purge(self, driver):
        # Removes remains of a link after the table is dropped.
        pass



#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, UStrVal, OneOrSeqVal
from rex.deploy import (
        Fact, TableFact, ColumnFact, LinkFact, IdentityFact, mangle, model,
        BEFORE, INSERT_UPDATE)
from .sql import plpgsql_file_table_check, plpgsql_file_link_check
from .model import FileTableConstraintModel, FileLinkConstraintModel


class LabelVal(UStrVal):
    # An entity label.

    pattern = r'[a-z_][0-9a-z_]*'


class QLabelVal(UStrVal):
    # An entity label with an optional qualifier.

    pattern = r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?'


class TitleVal(UStrVal):
    # Entity title.

    pattern = r'\S(.*\S)?'


class FileFact(Fact):

    fields = [
            ('file', QLabelVal),
            ('of', LabelVal, None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('after', OneOrSeqVal(LabelVal), None),
            ('required', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['was', 'after', 'required', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        if '.' in spec.file:
            table_label, label = spec.file.split('.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.file
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        is_required = spec.required
        title = spec.title
        is_present = spec.present
        front_labels = spec.after
        if front_labels is None:
            front_labels = []
        elif not isinstance(front_labels, list):
            front_labels = [front_labels]
        return cls(table_label, label,
                   former_labels=former_labels, is_required=is_required,
                   title=title, front_labels=front_labels,
                   is_present=is_present)

    def __init__(self, table_label, label,
                 former_labels=[], is_required=None,
                 title=None, front_labels=[], is_present=True):
        assert isinstance(table_label, str) and len(table_label) > 0
        assert isinstance(label, str) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, str)
                        for former_label in former_labels))
            if is_required is None:
                is_required = True
            assert isinstance(is_required, bool)
            assert (title is None or
                    (isinstance(title, str) and len(title) > 0))
            assert (isinstance(front_labels, list) and
                    all(isinstance(front_label, str)
                        for front_label in front_labels))
        else:
            assert former_labels == []
            assert is_required is None
            assert title is None
            assert front_labels == []
        self.table_label = table_label
        self.label = label
        self.former_labels = former_labels
        self.is_required = is_required
        self.title = title
        self.front_labels = front_labels
        self.is_present = is_present

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_required is not None and self.is_required is not True:
            args.append("is_required=%r" % self.is_required)
        if self.title is not None:
            args.append("title=%r" % self.title)
        if self.front_labels:
            args.append("front_labels=%r" % self.front_labels)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            schema = model(driver)
            driver([
                TableFact("file"),
                ColumnFact("file", "handle", type="text"),
                IdentityFact("file", ["handle"]),
                ColumnFact(
                    "file", "timestamp", type="datetime", default="now()"),
                ColumnFact("file", "session", type="text"),
                ColumnFact("file", "fresh", type="boolean", default=True),
            ])
            table = schema.table('file')
            constraint = table.constraint(FileTableConstraintModel)
            if not constraint:
                FileTableConstraintModel.do_build(table)
            fact = LinkFact(
                    self.table_label, self.label, "file",
                    former_labels=self.former_labels,
                    is_required=self.is_required,
                    title=self.title,
                    front_labels=self.front_labels)
            fact(driver)
            table = schema.table(self.table_label)
            link = table.link(self.label)
            table = schema.table(self.table_label)
            link = table.link(self.label)
            if not any(constraint.link is link
                       for constraint
                            in table.constraints(FileLinkConstraintModel)):
                FileLinkConstraintModel.do_build(link)
        else:
            link = LinkFact(
                    self.table_label, self.label, is_present=False)
            link(driver)



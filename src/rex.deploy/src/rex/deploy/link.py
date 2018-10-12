#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, UStrVal, OneOrSeqVal
from .fact import Fact, LabelVal, QLabelVal, TitleVal
from .model import model
import collections


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
    `default`: ``unicode`` or HTSQL ID
        The default value for the link.
    `former_labels`: [``unicode``]
        Names that the link may have had in the past.
    `is_required`: ``bool`` or ``None``
        Indicates if ``NULL`` values are not allowed.  Must be ``None``
        if ``is_present`` is not set.
    `is_unique`: ``bool`` or ``None``
        Indicates that each value must be unique across all rows in the table.
    `title`: ``unicode`` or ``None``
        The title of the link.  If not set, borrowed from the target title
        or generated from the label.
    `front_labels`: [``unicode``]
        List of fields that should be positioned in front of the link.
    `is_present`: ``bool``
        Indicates whether the link exists.
    """

    fields = [
            ('link', QLabelVal),
            ('of', LabelVal, None),
            ('to', LabelVal, None),
            ('default', UStrVal, None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('after', OneOrSeqVal(LabelVal), None),
            ('required', BoolVal, None),
            ('unique', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['to', 'default', 'was', 'after',
                          'required', 'unique', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        if '.' in spec.link:
            table_label, label = spec.link.split('.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.link
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        target_table_label = spec.to
        default = spec.default
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        is_required = spec.required
        is_unique = spec.unique
        title = spec.title
        is_present = spec.present
        if is_present:
            if target_table_label is None:
                target_table_label = label
        front_labels = spec.after
        if front_labels is None:
            front_labels = []
        elif not isinstance(front_labels, list):
            front_labels = [front_labels]
        return cls(table_label, label, target_table_label,
                    default=default,
                    former_labels=former_labels, is_required=is_required,
                    is_unique=is_unique, title=title, front_labels=front_labels,
                    is_present=is_present)

    def __init__(self, table_label, label, target_table_label=None,
                 default=None, former_labels=[], is_required=None,
                 is_unique=None, title=None, front_labels=[], is_present=True):
        assert isinstance(table_label, str) and len(table_label) > 0
        assert isinstance(label, str) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(target_table_label, str)
                    and len(target_table_label) > 0)
            assert default is None or isinstance(default, str)
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, str)
                        for former_label in former_labels))
            if is_required is None:
                is_required = True
            assert isinstance(is_required, bool)
            if is_unique is None:
                is_unique = False
            assert isinstance(is_unique, bool)
            assert (title is None or
                    (isinstance(title, str) and len(title) > 0))
            assert (isinstance(front_labels, list) and
                    all(isinstance(front_label, str)
                        for front_label in front_labels))
        else:
            assert target_table_label is None
            assert default is None
            assert former_labels == []
            assert is_required is None
            assert is_unique is None
            assert title is None
            assert front_labels == []
        self.table_label = table_label
        self.label = label
        self.target_table_label = target_table_label
        self.default = default
        self.former_labels = former_labels
        self.is_required = is_required
        self.is_unique = is_unique
        self.title = title
        self.front_labels = front_labels
        self.is_present = is_present

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.target_table_label is not None:
            args.append(repr(self.target_table_label))
        if self.default is not None:
            args.append("default=%r" % self.default)
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_required is not None and self.is_required is not True:
            args.append("is_required=%r" % self.is_required)
        if self.is_unique is not None and self.is_unique is not False:
            args.append("is_unique=%r" % self.is_unique)
        if self.title is not None:
            args.append("title=%r" % self.title)
        if self.front_labels:
            args.append("front_labels=%r" % self.front_labels)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        mapping['link'] = self.label
        if full:
            mapping['of'] = self.table_label
        if self.target_table_label not in (None, self.label):
            mapping['to'] = self.target_table_label
        if self.former_labels:
            mapping['was'] = self.former_labels
        if full and self.front_labels:
            mapping['after'] = self.front_labels
        if self.default is not None:
            mapping['default'] = self.default
        if self.is_required is False:
            mapping['required'] = self.is_required
        if self.is_unique is True:
            mapping['unique'] = self.is_unique
        if self.title is not None:
            mapping['title'] = self.title
        if self.is_present is False:
            mapping['present'] = self.is_present
        return mapping

    def __call__(self, driver):
        schema = model(driver)
        table = schema.table(self.table_label)
        if not table:
            if self.is_present:
                raise Error("Discovered missing table:", self.table_label)
            return
        link = table.link(self.label)
        if not link:
            if table.column(self.label):
                raise Error("Discovered column with the same name:", self.label)
            for former_label in self.former_labels:
                link = table.link(former_label)
                if link:
                    break
        if self.is_present:
            target_table = schema.table(self.target_table_label)
            if not target_table:
                raise Error("Discovered missing table:",
                            self.target_table_label)
            if link:
                link.modify(
                        label=self.label,
                        target_table=target_table,
                        default=self.default,
                        is_required=self.is_required,
                        is_unique=self.is_unique,
                        title=self.title)
            else:
                link = table.build_link(
                        label=self.label,
                        target_table=target_table,
                        default=self.default,
                        is_required=self.is_required,
                        is_unique=self.is_unique,
                        title=self.title)
            front_fields = []
            for front_label in self.front_labels:
                front_field = (table.column(front_label) or
                               table.link(front_label))
                if not front_field:
                    raise Error("Discovered missing field:", front_label)
                front_fields.append(front_field)
            if front_fields:
                table.move_after(link, front_fields)
        else:
            if link:
                link.erase()



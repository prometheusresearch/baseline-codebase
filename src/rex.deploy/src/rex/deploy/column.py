#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Error, AnyVal, BoolVal, UStrVal, UChoiceVal, SeqVal,
        OneOrSeqVal, UnionVal, OnSeq)
from .fact import Fact, LabelVal, QLabelVal, TitleVal
from .model import model, ColumnModel
from htsql.core.domain import (UntypedDomain, BooleanDomain, IntegerDomain,
        DecimalDomain, FloatDomain, TextDomain, DateDomain, TimeDomain,
        DateTimeDomain, EnumDomain)
import datetime
import decimal
import json
import collections


class EnumValue(object):

    def __init__(self, value, former_values=[], title=None):
        self.value = value
        self.former_values = former_values
        self.title = title

    def __repr__(self):
        args = []
        args.append(repr(self.value))
        if self.former_values:
            args.append("former_values=%r" % self.former_values)
        if self.title is not None:
            args.append("title=%r" % title)
        if len(args) == 1:
            return args[0]
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


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
    `default`: literal value compatible with the column type
        Column default value.
    `former_labels`: [``unicode``]
        Names that the column may had in the past.
    `is_required`: ``bool``
        Indicates if ``NULL`` values are not allowed.
    `is_unique`: ``bool``
        Indicates that each value must be unique across all rows in the table.
    `title`: ``unicode`` or ``None``
        The title of the column.  If not set, generated from the label.
    `front_labels`: [``unicode``]
        List of fields which should be positioned in front of the column.
    `is_present`: ``bool``
        Indicates whether the column exists.
    """

    TYPE_MAP = ColumnModel.data.TYPE_MAP
    DOMAIN_MAP = ColumnModel.data.DOMAIN_MAP

    fields = [
            ('column', QLabelVal),
            ('of', LabelVal, None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('after', OneOrSeqVal(LabelVal), None),
            ('type', UnionVal((OnSeq, SeqVal(UStrVal(r'[0-9A-Za-z_-]+'))),
                              UChoiceVal(*sorted(TYPE_MAP))), None),
            ('default', AnyVal, None),
            ('required', BoolVal, None),
            ('unique', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['was', 'after', 'type', 'default',
                          'required', 'unique', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        if '.' in spec.column:
            table_label, label = spec.column.split('.')
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
        domain = UntypedDomain()
        if isinstance(type, list):
            domain = EnumDomain(type)
        elif type is not None:
            domain = cls.DOMAIN_MAP[type]
        default = spec.default
        if isinstance(default, str):
            default = default.decode('utf-8', 'replace')
        if isinstance(default, str):
            try:
                default = domain.parse(default)
            except ValueError:
                pass
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
            if not (default is None or
                    (type == 'boolean' and
                        isinstance(default, bool)) or
                    (type == 'integer' and
                        isinstance(default, int)) or
                    (type in ('decimal', 'float') and
                        isinstance(default, (int,
                                             decimal.Decimal, float))) or
                    (type == 'text' and
                        isinstance(default, str)) or
                    (type == 'date' and
                        isinstance(default, datetime.date)) or
                    (type == 'date' and
                        default == 'today()') or
                    (type == 'time' and
                        isinstance(default, datetime.time)) or
                    (type == 'datetime' and
                        isinstance(default, datetime.datetime)) or
                    (type == 'datetime' and
                        default == 'now()') or
                    type == 'json' or
                    (isinstance(type, list) and
                        isinstance(default, str) and default in type)):
                raise Error("Got ill-typed default value:", default)
        if default is not None:
            if type == 'decimal':
                default = decimal.Decimal(default)
            elif type == 'float':
                default = float(default)
            elif type == 'json':
                try:
                    json.dumps(default)
                except ValueError:
                    raise Error("Got ill-typed default value:", default)
        is_required = spec.required
        is_unique = spec.unique
        front_labels = spec.after
        if front_labels is None:
            front_labels = []
        elif not isinstance(front_labels, list):
            front_labels = [front_labels]
        return cls(table_label, label, former_labels=former_labels,
                   title=title, type=type, default=default,
                   is_required=is_required, is_unique=is_unique,
                   front_labels=front_labels, is_present=is_present)

    def __init__(self, table_label, label, type=None, default=None,
                 former_labels=[], is_required=None, is_unique=None,
                 title=None, front_labels=[], is_present=True):
        assert isinstance(table_label, str) and len(table_label) > 0
        assert isinstance(label, str) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, str)
                        for former_label in former_labels))
            assert (isinstance(type, str) and type in self.TYPE_MAP or
                    isinstance(type, list) and len(type) > 0 and
                    all(isinstance(label, str) and len(label) > 0
                        for label in type) and
                    len(set(type)) == len(type))
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
            assert former_labels == []
            assert type is None
            assert default is None
            assert is_required is None
            assert is_unique is None
            assert title is None
            assert front_labels == []
        self.table_label = table_label
        self.label = label
        self.type = type
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
        if self.type is not None:
            args.append(repr(self.type))
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
        mapping['column'] = self.label
        if full:
            mapping['of'] = self.table_label
        if self.former_labels:
            mapping['was'] = self.former_labels
        if full and self.front_labels:
            mapping['after'] = self.front_labels
        if self.type is not None:
            mapping['type'] = self.type
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
        column = table.column(self.label)
        if not column:
            if table.link(self.label):
                raise Error("Discovered link with the same name:", self.label)
            for former_label in self.former_labels:
                column = table.column(former_label)
                if column:
                    break
        if self.is_present:
            if column:
                column.modify(
                        label=self.label,
                        type=self.type,
                        default=self.default,
                        is_required=self.is_required,
                        is_unique=self.is_unique,
                        title=self.title)
            else:
                column = table.build_column(
                        label=self.label,
                        type=self.type,
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
                table.move_after(column, front_fields)
        else:
            if column:
                column.erase()



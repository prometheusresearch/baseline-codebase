"""

    rex.workflow.actions.list
    =========================

    :copyright: 2015, Prometheus Research, LLC

"""

import re

from htsql.core import domain as domains

from rex.port import Port, GrowVal, arm as arms
from rex.core import StrVal, OneOfVal, SeqVal, BoolVal
from rex.core import cached
from rex.widget.modern import Field, undefined

from ..port_field import register_port
from ..base import ActionWidget
from ..utils import inflector
from ..validate import ColumnVal, KeyPathVal, FieldDescVal

__all__ = ('List',)


class List(ActionWidget):
    """ Show a list of records in database.

    This is a generic action which displays a list of records in database as a
    configurable datatable. Each item in the list can be selected by clicking on
    it, in that case the brief info is shown in service panel.
    """

    type = 'list'
    name = 'List'
    js_type = 'rex-workflow/lib/Actions/List'

    icon = Field(StrVal(), default='list')

    default_name = property(lambda s: 'List %s' % \
                                      inflector.plural(s.entity_name))


    entity = Field(
        StrVal(),
        doc="""
        Name of the table in database from which to show records in the list.
        """)

    sortable = Field(
        BoolVal(), default=False,
        doc="""
        If set to ``true`` then list can be sorted by any column.
        """)

    resizable_columns = Field(
        BoolVal(), default=False,
        doc="""
        If set to ``true`` then list has all its column resizable.
        """)

    columns = Field(
        SeqVal(OneOfVal(ColumnVal(), KeyPathVal())), default=undefined,
        doc="""
        A set of column specifications to be shown.

        If it's not provided then it will be inferred from database schema.
        """)

    info_fields = Field(
        SeqVal(OneOfVal(FieldDescVal())), default=undefined,
        doc="""
        A set of info field specifications to be shown when a record is
        selected.

        If it's not provided then it will be inferred from database schema.
        """)

    requirements = Field(
        SeqVal(StrVal()), default=[],
        doc="""
        Requirements.
        """)

    @property
    def entity_name(self):
        return self._compile_port()[1]['entity']

    def context(self):
        bindings = self._compile_port()[1]['bindings']
        inputs = [(b.split('.')[0] if '.' in b else b)
                  for b in bindings.values()]
        outputs = [self.entity_name]
        return inputs, outputs

    _validate_grow_val = GrowVal()

    @cached
    def _compile_port(self):
        filters = []
        bindings = {}
        for f, b in self._compile_filters():
            bindings.update(b)
            filters.append(f)
        select = None
        with_ = None

        if self.columns:
            select = select or {}
            with_ = with_ or {}
            for c in self.columns:
                if isinstance(c, list):
                    assert len(c) < 3, 'Not implemented'
                    if len(c) == 1:
                        select[c[0]] = True
                    elif len(c) == 2:
                        with_.setdefault(c[0], {'select': [], 'entity': c[0]})['select'].append(c[1])
                elif c.expression is not undefined:
                    key = KeyPathVal.to_string(c.key)
                    assert key not in with_
                    with_[key] = '%s := %s' % (key, c.expression)

        if self.info_fields:
            select = select or {}
            with_ = with_ or {}
            for f in self.info_fields:
                assert len(f.key) < 3, 'Not implemented'
                if len(f.key) == 1:
                    select[c[0]] = True
                elif len(f.key) == 2:
                    with_.setdefault(f.key[0], {'select': [], 'entity': f.key[0]})['select'].append(f.key[1])

        grow_val = {
            'entity': self.entity,
            'filters': filters,
            'select': select.keys() if select else None,
            'with': with_.values() if with_ else None,
        }
        port = Port(self._validate_grow_val({k: v for (k, v) in grow_val.items()
                                                  if v is not None}))
        path = register_port(self.package, port)
        return port, {
            'path': path,
            'entity': port.tree.keys()[0],
            'bindings': bindings
        }

    def _compile_filters(self):
        filters = []
        for idx, f in enumerate(self.requirements):
            f, bindings = parse_filter(f)
            assert len(bindings) <= 1, 'Not implemented yet'
            f_name = 'filter%d' % idx
            filters.append((
                '%s($%s) := %s' % (f_name, bindings[0][0], f),
                {'*:' + f_name: bindings[0][1]}
            ))
        return filters

    @cached
    def descriptor(self):
        desc = super(List, self).descriptor()
        props = desc.ui.props

        port, data = self._compile_port()
        port_columns = columns_from_port(port)
        columns = props.get('columns', undefined)
        if columns is undefined:
            columns = port_columns
        built_columns = []
        for c in columns:
            if isinstance(c, list):
                built_columns.append(column_from_port(port, c))
            else:
                built_columns.append(c)
        if props.get('fields', undefined) is undefined:
            props.fields = [_make_field_desc({'key': c.key, 'name': c.name})
                            for c in built_columns]
        props.columns = built_columns
        props.data = data
        return desc


_make_column = ColumnVal()
_make_field_desc = FieldDescVal()


def columns_from_port(port):
    meta = port.describe().meta
    # { <entity tag>: [ <domain> ] }
    domain = meta.domain.fields[0].domain.item_domain
    columns = []
    for field in domain.fields:
        columns.append(_make_column({
            'key': field.tag,
            'name': field.header,
        }))
    return columns


def column_from_port(port, key_path):
    meta = port.describe().meta
    # { <entity tag>: [ <domain> ] }
    fields = {f.tag: f for f in meta.domain.fields[0].domain.item_domain.fields}
    for k in key_path[:-1]:
        fields = {f.tag: f for f in fields[k].domain.fields}
    field = fields[key_path[-1]]
    return _make_column({
        'key': key_path,
        'name': field.header,
    })


PARSE_CONTEXT_REFS = re.compile(r'\$([a-zA-Z0-9_\.]+)')

def parse_filter(value):
    bindings = []
    for m in reversed(list(PARSE_CONTEXT_REFS.finditer(value))):
        param = m.groups()[0]
        arg = param.replace('.', '__')
        bindings.append((arg, param))
        value = value[:m.start()] + '$' + arg + value[m.end():]
    return value, bindings

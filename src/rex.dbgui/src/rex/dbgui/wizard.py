
from rex.core import cached, OMapVal
from rex.action import ActionVal
from rex.action.wizard import Wizard as BaseWizard
from rex.deploy import model
from rex.widget import render_widget, computed_field
from cached_property import cached_property
import yaml
from functools import partial, reduce

@cached
def get_schema():
    return model()

def pick_table(skip_tables=[]):
    return DBGUI(
        id='dbgui',
        type='dbgui',
        title='Pick Table',
        skip_tables=skip_tables
    )

def view_source(skip_tables=[], read_only=False):
    return ViewSource(
        id='view-source',
        type='view-source',
        title='View Source',
        skip_tables=skip_tables,
        read_only=read_only
    )

def root_wizard(skip_tables=[]):
    return WizardProxy.from_path(
                'dbgui',
                'DBGUI',
                [(pick_table(skip_tables), None)]
            )

def table_wizard(table_name, skip_tables=[], read_only=False):
    return WizardProxy.table_wizard(table_name, skip_tables, read_only)


class WizardProxy(object):

    wizard_val = ActionVal(action_class=BaseWizard)
    order = ['id', 'type', 'title', 'path', 'actions']

    def __init__(self, id, title, path, actions):
        self.id = id
        self.type = 'wizard'
        self.title = title
        self.path = path
        self.actions = actions

    @cached_property
    def wizard(self):
        ret = self.wizard_val(dict(
            id=self.id,
            type='wizard',
            title=self.title,
            path=self.path,
            actions=dict([(a.id, a.action) for a in self.actions])
        ))
        return ret

    @classmethod
    def table_wizard(cls, table, skip_tables=[], read_only=False):
        schema = get_schema()
        if schema.table(table) is None or table in skip_tables:
            title = "Table %s not found" % table
            text = "**%s**" % title
            return cls.from_path(table, 'DBGUI: %s' % table,
                    [(pick_table(skip_tables),
                      [(Page(id='pick-' + table, title=title, text=text), None)])
                    ])
        else:
            return cls.from_path(table, 'DBGUI: %s' % table,
                    [(pick_table(skip_tables),
                      cls.table_path(table, skip_tables=skip_tables,
                                     read_only=read_only)
                      + [(view_source(skip_tables, read_only), None)])
                    ])

    @classmethod
    def from_path(cls, id, title, path):
        flatten = lambda l: reduce(lambda a, b: a + flatten(b)
                                   if isinstance(b, (list, tuple))
                                   else a + [b], l, [])
        actions = [a for a in flatten(path)
                     if a and not isinstance(a, str)]
        return cls(id=id,
                   title=title,
                   path=cls.extract_path(path),
                   actions=actions)

    @classmethod
    def extract_path(cls, path):
        dict1 = lambda x,y: dict([(x, y)])
        if path is None:
            return None
        elif isinstance(path, str):
            return [{'replace': path}]
        else:
            return [dict1(k.id, cls.extract_path(v)) for k, v in path]

    @classmethod
    def table_path(cls, table_name, context=[], mask=None, skip_tables=[],
                   read_only=False):
        pick = Pick(table_name, context=context, mask=mask)
        make = Make(table_name, context=context, skip_tables=skip_tables)
        drop = Drop(table_name)
        if read_only:
            make_drop_path = []
        else:
            make_drop_path = [
                (drop, None),
                (make, make.replace())
            ]
        return [(pick, cls.record_path(table_name, context=context,
                                       skip_tables=skip_tables,
                                       read_only=read_only)
                       + make_drop_path
               )]

    @classmethod
    def record_path(cls, table_name, context=[], skip_tables=[], read_only=False):
        view = View(table_name, context, skip_tables=skip_tables)
        if read_only:
            next = []
        else:
            edit = Edit(table_name, context, skip_tables=skip_tables)
            next = [(edit, edit.replace())]
        ret = [(view, next)]
        schema = get_schema()
        for table in schema.tables():
            identity = table.identity().fields
            # ignore all non-rex.deploy tables
            if not identity or any([f is None for f in identity]):
                continue
            if len(identity) == 1 \
            and identity[0].is_link \
            and identity[0].target_table.label == table_name\
            and table.label not in skip_tables:
                next.extend(cls.record_path(
                    table.label,
                    context=context + ([table_name] if not view._is_facet else []),
                    skip_tables=skip_tables,
                    read_only=read_only
                ))
                continue
            links = [f for f in identity
                       if f.is_link and f.target_table.label == table_name]
            if len(links) == 1 and links[0] not in context \
            and table.label not in skip_tables:
                if view._is_facet:
                    mask = '%s.%s=$%s' % (links[0].label,
                                          list(view.entity.values())[0],
                                          list(view.entity.keys())[0])
                    next.extend(cls.table_path(table.label,
                        mask=mask,
                        context=context,
                        skip_tables=skip_tables,
                        read_only=read_only
                    ))
                else:
                    mask='%s=%s' % (links[0].label, to_ref(table_name))
                    ret.extend(cls.table_path(table.label,
                        mask=mask,
                        context=context + [table_name],
                        skip_tables=skip_tables,
                        read_only=read_only
                    ))
        if len(next) == 0:
            ret[0] = (view, None)
        return ret

def to_complete_entity(entity):
    if entity == 'table':
        return {'_table': 'table'}
    if entity == 'user':
        return {'_user': 'user'}
    else:
        return dict([(entity, entity)])

def to_ref(table):
    return '$' + list(to_complete_entity(table).keys())[0]


class ActionProxy(object):

    action_val = ActionVal()
    order = ['type', 'title']

    def __init__(self, id, type, title, skip_tables=[]):
        self.id = id
        self.type = type
        self.title = title
        self._skip_tables = skip_tables

    def get_params(self):
        return dict([
            (k, v) for k, v in list(vars(self).items())
                   if v is not None and not k.startswith('_')
        ])

    @cached_property
    def action(self):
        return self.action_val(self.get_params())


class DBGUI(ActionProxy):

    def __init__(self, **kwds):
        super(DBGUI, self).__init__(**kwds)
        self.skip_tables = self._skip_tables


class ViewSource(ActionProxy):

    def __init__(self, read_only, **kwds):
        super(ViewSource, self).__init__(**kwds)
        self.skip_tables = self._skip_tables
        self.read_only = read_only


class Page(ActionProxy):

    def __init__(self, id, title, text):
        super(Page, self).__init__(id=id, title=title, type='page')
        self.text = text


class TableActionProxy(ActionProxy):

    order = ActionProxy.order + ['entity', 'input', 'value',
                                 'fields', 'mask', 'search',
                                 'search_placeholder']

    def __init__(self, table, type, context=[], **kwds):
        super(TableActionProxy, self).__init__(
            id='%s-%s' % (type, table.replace('_', '-')),
            type=type,
            title='%s %s' % (type.title(), table),
            skip_tables=kwds.get('skip_tables', [])
        )
        self.entity, field_prefix = self.get_base_entity(table, context)
        self._is_facet = table != self.entity
        self.entity = to_complete_entity(self.entity)
        self.fields, self.value = self.get_fields_value(table, field_prefix,
                                                        context)
        if context:
            self.id = '%s--%s' % (self.id, '-'.join([c for c in context]))
        self.input = [to_complete_entity(item) for item in context]
        for attr, value in kwds.items():
            if attr != 'skip_tables':
                setattr(self, attr, value)

    def get_base_entity(self, table_name, context):
        schema = get_schema()
        field_prefix = []
        entity = table_name
        if context:
            parent = context[-1]
            table = schema.table(table_name)
            while True:
                identity = table.identity().fields
                if len(identity) == 1 and identity[0].is_link:
                    if identity[0].target_table.label == parent:
                        field_prefix.append(table_name)
                        entity = parent
                        break
                    else:
                        field_prefix.append(identity[0].target_table.label)
                        table = identity[0].target_table
                else:
                    field_prefix = []
                    entity = table_name
                    break
        field_prefix = '.'.join(field_prefix)
        if field_prefix:
            field_prefix += '.'
        return entity,  field_prefix

    def get_fields_value(self, table_name, prefix='', context=[]):
        schema = get_schema()
        table = schema.table(table_name)
        value = {}
        for field in table.identity().fields:
            if field.is_link:
                parent = field.target_table.label
                while True:
                    if parent in context:
                        value[field.label] = to_ref(parent)
                        break
                    parent_identity = schema.table(parent).identity().fields
                    if len(parent_identity) == 1 \
                    and parent_identity[0].is_link:
                        parent = parent_identity[0].target_table.label
                    else:
                        break
        fields = []
        for field in table.fields():
            if field.label in value:
                continue
            fields.append(prefix + field.label)
        return fields, value or None

    def replace(self):
        table = list(self.entity.keys())[0]
        view = 'view' + self.id[len(self.type):]
        pick = 'pick' + self.id[len(self.type):]
        add_to_context = lambda name: '%s=$%s' % (name, name)
        if not self._is_facet:
            return '../../../' + pick + '?' + add_to_context(table) + '/' + view
        else:
            return '../../' + view + '?' + add_to_context(table)


class Pick(TableActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Pick, self).__init__(table, 'pick', context, **kwds)
        self.search = 'string(id())~$search'
        self.search_placeholder = 'Search by ID'

    def get_fields_value(self, table, prefix='', context=[]):
        fields = [dict(
            value_key='id',
            label='id()',
            type='calculation',
            expression='string(id())'
        )]
        schema = get_schema()
        for field in schema.table(table).identity().fields:
            if field.is_link and field.target_table.label in context:
                continue
            fields.append(field.label)
        return fields, None


class Make(TableActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Make, self).__init__(table, 'make', context, **kwds)

    def replace(self):
        #strip out first '../'
        return super(Make, self).replace()[3:]


class Edit(TableActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Edit, self).__init__(table, 'edit', context, **kwds)


class View(TableActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(View, self).__init__(table, 'view', context, **kwds)

    def get_fields_value(self, table_name, prefix='', context=[]):
        fields, _ = super(View, self).get_fields_value(table_name, prefix,
                                                       context)
        schema = get_schema()
        table = schema.table(table_name)
        for index, field in enumerate(fields):
            link = table.link(field[len(prefix):])
            if link is not None:
                if link.target_table.label in self._skip_tables:
                    fields[index] = dict(
                            value_key=field,
                            type='string'
                            )
                else:
                    fields[index] = dict(
                        value_key=field,
                        type='dbgui_entity',
                        data=dict(
                            entity=link.target_table.label
                        )
                    )
        return fields, None


class Drop(TableActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Drop, self).__init__(table, 'drop', context, **kwds)
        self.input = None

    def get_fields_value(self, table_name, prefix='', context=[]):
        return None, None


def sort_key(obj):
    return lambda i: obj.order.index(i[0]) if i[0] in obj.order else 1000

def represent_wizard(dumper, wizard):
    mapping = lambda l: yaml.nodes.MappingNode('tag:yaml.org,2002:map', l)
    ret = []
    for key, value in sorted(list(vars(wizard).items()), key=sort_key(wizard)):
        if key not in wizard.order:
            continue
        if value is not None:
            node_key = dumper.represent_data(key)
            if key == 'path':
                node_value = dumper.represent_data(value[0]['dbgui'])
            elif key == 'actions':
                actions = []
                stop_actions = ['dbgui', 'view-source']
                for action in value:
                    if action.id in stop_actions:
                        continue
                    actions.append((
                        dumper.represent_data(action.id),
                        dumper.represent_data(action)
                    ))
                node_value = mapping(actions)
            else:
                node_value = dumper.represent_data(value)
            ret.append((node_key, node_value))
    url_key = dumper.represent_data('/' + wizard.id)
    action_key = dumper.represent_data('action')
    return mapping([(url_key, mapping([(action_key, mapping(ret))]))])

def represent_action(dumper, action):
    ret = []
    for key, value in sorted(list(vars(action).items()), key=sort_key(action)):
        if key not in action.order:
            continue
        if value not in (None, []):
            if key == 'fields':
                value = [v['value_key']
                         if isinstance(v, dict) and v['type'] == 'dbgui_entity'
                         else v
                         for v in value]
            node_key = dumper.represent_data(key)
            node_value = dumper.represent_data(value)
            ret.append((node_key, node_value))
    return yaml.nodes.MappingNode('tag:yaml.org,2002:map', ret)

yaml.SafeDumper.add_representer(WizardProxy, represent_wizard)
yaml.SafeDumper.add_multi_representer(ActionProxy, represent_action)
yaml.SafeDumper.add_representer(
    type(None),
    lambda dumper, value: dumper.represent_scalar('tag:yaml.org,2002:null', '')
)

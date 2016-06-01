
from rex.core import cached, OMapVal
from rex.action.action import ActionVal
from rex.action.wizard import Wizard
from rex.deploy import model

action_val = ActionVal()
wizard_val = ActionVal(action_class=Wizard)

@cached
def get_schema():
    return model()

@cached
def get_wizard(table_name):
    wizard = table_wizard(table_name)
    flatten = lambda l: reduce(lambda a, b: a + flatten(b)
                               if isinstance(b, (list, tuple))
                               else a + [b], l, [])
    actions = dict([(a.id, a.get_action()) for a in flatten(wizard)
                    if a and not isinstance(a, (str, unicode))])
    path = get_path(wizard)
    return action(table_name, type='wizard', actions=actions, path=path)

def get_path(wizard):
    dict1 = lambda x,y: dict([(x, y)])
    if wizard is None:
        return None
    elif isinstance(wizard, (str, unicode)):
        return [{'replace': wizard}]
    else:
        return [dict1(k.id, get_path(v)) for k, v in wizard]

def action(table_name, type, **kwds):
    constructor = wizard_val if type == 'wizard' else action_val
    kwds['type'] = type
    if 'id' not in kwds:
        kwds['id'] = '%s-%s' % (type, table_name)
    if type != 'wizard':
        kwds['entity'] = table_name
    return constructor(kwds)

def table_wizard(table_name, context=[], mask=None):
    pick = Pick(table_name, context=context, mask=mask)
    make = Make(table_name, context=context)
    return [(pick, record_wizard(table_name, context=context) + [
        (make, make.replace())
    ])]

def replace(table_name, with_pick=True):
    ret = '/view-%s' % table_name
    if with_pick:
        ret = ('/pick-%s' % table_name) + ret
    return ret

def record_wizard(table_name, context=[]):
    #TODO: generate fields replacing entity with links
    view = View(table_name, context)
    edit = Edit(table_name, context)
    next = [(edit, edit.replace())]
    ret = [(view, next)]
    schema = get_schema()
    facets = []
    for table in schema.tables():
        identity = table.identity().fields
        if len(identity) == 1 \
        and identity[0].is_link \
        and identity[0].target_table.label == table_name:
            next.extend(record_wizard(
                table.label,
                context=context + [table_name]
            ))
            continue
        links = [f for f in identity
                   if f.is_link and f.target_table.label == table_name]
        if len(links) == 1 and links[0] not in context:
            ret.extend(table_wizard(table.label,
                mask='%s=$%s' % (table_name, table_name),
                context=context + [table_name]
            ))
    return ret

def fields(table_name, prefix='', skip=[]):
    schema = get_schema()
    table = schema.table(table_name)
    value = {}
    for f in table.identity().fields:
        if f.is_link and f.target_table.label in skip:
            value[f.label] = '$' + f.target_table.label
    ret = []
    for f in table.fields():
        if f.label in value:
            continue
        ret.append(prefix + f.label)
    return value, ret


class ActionProxy(object):

    action_val = ActionVal()

    def __init__(self, table, type, context=[], **kwds):
        self.entity, field_prefix = self.get_base_entity(table, context)
        self.id = '%s-%s' % (type, table.replace('_', '-'))
        self.type = type
        self.title = '%s %s' % (type.title(), table)
        self.fields, self.value = self.get_fields_value(table, field_prefix,
                                                        context)
        self.input = context
        for attr, value in kwds.items():
            setattr(self, attr, value)
        self._is_facet = table != self.entity

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
                        field_prefix.insert(0, table_name)
                        entity = parent
                        break
                    else:
                        field_prefix.insert(0, identity[0].target_table.label)
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
            if field.is_link and field.target_table.label in context:
                value[field.label] = '$' + field.target_table.label
        fields = []
        for field in table.fields():
            if field.label in value:
                continue
            fields.append(prefix + field.label)
        return fields, value or None

    def get_action(self):
        action_params = dict([(k, v) for k, v in vars(self).items()
                              if v is not None and not k.startswith('_')])
        return self.action_val(action_params)

    def replace(self):
        view = 'view' + self.id[len(self.type):]
        pick = 'pick' + self.id[len(self.type):]
        return ('../../../'  + pick + '/' + view) if not self._is_facet \
               else '../../' + view


class Pick(ActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Pick, self).__init__(table, 'pick', context, **kwds)
        self.value = None
        # prettify fields
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
        self.fields = fields


class Make(ActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Make, self).__init__(table, 'make', context, **kwds)

    def replace(self):
        # strip out first '../'
        return super(Make, self).replace()[3:]


class Edit(ActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Edit, self).__init__(table, 'edit', context, **kwds)


class View(ActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(View, self).__init__(table, 'view', context, **kwds)
        self.value = None

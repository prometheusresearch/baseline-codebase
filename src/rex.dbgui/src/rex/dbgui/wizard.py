
from rex.core import cached, OMapVal
from rex.action.action import ActionVal
from rex.action.wizard import Wizard
from rex.deploy import model
from rex.widget import render_widget


@cached
def get_schema():
    return model()

@cached
def get_wizard(table_name):
    return WizardProxy.get_wizard(table_name)

def create_wizard(config):
    validator = ActionVal(action_class=Wizard)
    config['id'] = config.get('title', 'id')
    config['type'] = 'wizard'
    return validator(config)


class WizardProxy(object):

    wizard_val = ActionVal(action_class=Wizard)

    def __init__(self, table, path, actions):
        self.table = table
        self.path = path
        self.actions = actions
        self.wizard = self.wizard_val(dict(
            id=table,
            type='wizard',
            title='Wizard: %s' % table,
            path=path,
            actions=dict([(a.id, a.get_action()) for a in actions])
        ))

    def render(self, req):
        segment = req.path_info_peek()
        if segment == '@@':
            req.path_info_pop()
        return render_widget(self.wizard, req, path=req.path_info[1:])


    @classmethod
    def get_wizard(cls, table):
        wizard = cls.table_wizard(table)
        flatten = lambda l: reduce(lambda a, b: a + flatten(b)
                                   if isinstance(b, (list, tuple))
                                   else a + [b], l, [])
        actions = [a for a in flatten(wizard)
                     if a and not isinstance(a, (str, unicode))]
        path = cls.get_path(wizard)
        return cls(table=table, path=path, actions=actions)

    @classmethod
    def get_path(cls, path):
        dict1 = lambda x,y: dict([(x, y)])
        if path is None:
            return None
        elif isinstance(path, (str, unicode)):
            return [{'replace': path}]
        else:
            return [dict1(k.id, cls.get_path(v)) for k, v in path]

    @classmethod
    def table_wizard(cls, table_name, context=[], mask=None):
        pick = Pick(table_name, context=context, mask=mask)
        make = Make(table_name, context=context)
        #drop = Drop(table_name)
        return [(pick, cls.record_wizard(table_name, context=context) + [
         #   (drop, None),
            (make, make.replace())
        ])]

    @classmethod
    def record_wizard(cls, table_name, context=[]):
        #TODO: generate fields replacing entity with links
        view = View(table_name, context)
        edit = Edit(table_name, context)
        next = [(edit, edit.replace())]
        ret = [(view, next)]
        schema = get_schema()
        for table in schema.tables():
            identity = table.identity().fields
            if len(identity) == 1 \
            and identity[0].is_link \
            and identity[0].target_table.label == table_name:
                next.extend(cls.record_wizard(
                    table.label,
                    context=context + [table_name]
                ))
                continue
            links = [f for f in identity
                       if f.is_link and f.target_table.label == table_name]
            if len(links) == 1 and links[0] not in context:
                if view._is_facet:
                    mask = '%s.%s=$%s' % (links[0].label,
                                          view.entity.values()[0],
                                          view.entity.keys()[0])
                    next.extend(cls.table_wizard(table.label,
                        mask=mask,
                        context=context
                    ))
                else:
                    mask='%s=$%s' % (links[0].label,
                                     entity(table_name).keys()[0])
                    ret.extend(cls.table_wizard(table.label,
                        mask=mask,
                        context=context + [table_name]
                    ))
        return ret

def entity(table_name):
    if table_name == 'user':
        return {'_user': 'user'}
    else:
        return dict([(table_name, table_name)])


class ActionProxy(object):

    action_val = ActionVal()

    def __init__(self, table, type, context=[], **kwds):
        self.entity, field_prefix = self.get_base_entity(table, context)
        self._is_facet = table != self.entity
        self._table = table
        self.entity = entity(self.entity)
        self.id = '%s-%s' % (type, table.replace('_', '-'))
        self.type = type
        self.title = '%s %s' % (type.title(), table)
        self.fields, self.value = self.get_fields_value(table, field_prefix,
                                                        context)
        self.input = [entity(item) for item in context]
        for attr, value in kwds.items():
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
            if field.is_link:
                parent = field.target_table.label
                while True:
                    if parent in context:
                        value[field.label] = '$' + entity(parent).keys()[0]
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
        self.search = 'string(id)~$search'


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

    def get_fields_value(self, table_name, prefix='', context=[]):
        fields, _ = super(View, self).get_fields_value(table_name, prefix,
                                                       context)
        schema = get_schema()
        table = schema.table(table_name)
        for index, field in enumerate(fields):
            link = table.link(field[len(prefix):])
            if link is not None:
                fields[index] = dict(
                    value_key=field,
                    type='dbgui_entity',
                    data=dict(
                        entity=link.target_table.label
                    )
                )
        return fields, None

class Drop(ActionProxy):

    def __init__(self, table, context=[], **kwds):
        super(Drop, self).__init__(table, 'drop', context, **kwds)

    def get_fields_value(self, table_name, prefix='', context=[]):
        return None, None

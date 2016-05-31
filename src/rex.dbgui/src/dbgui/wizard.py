
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
    actions = dict([(a.id, a) for a in flatten(wizard)
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

def table_wizard(table_name, skip=[], mask=None, input=[]):
    value, field_list = fields(table_name, '', skip)
    pick = action(table_name, type='pick', fields=field_list, mask=mask, input=input)
    make = action(table_name, type='make', fields=field_list, value=value)
    return [(pick, record_wizard(table_name, skip=skip) + [
        (make, '../..' + replace(table_name))
    ])]

def replace(table_name, with_pick=True):
    ret = '/view-%s' % table_name
    if with_pick:
        ret = ('/pick-%s' % table_name) + ret
    return ret

def record_wizard(table_name, fields_table=None, field_prefix='', skip=[]):
    if fields_table is None:
        fields_table = table_name
    print table_name, fields_table, field_prefix
    #TODO: generate fields replacing entity with links
    _, field_list = fields(fields_table, field_prefix, skip + [table_name])
    id = lambda t: '%s-%s' % (t, fields_table)
    title = lambda t: '%s %s' % (t.title(), fields_table)
    view = action(table_name,
        id=id('view'),
        title=title('view'),
        type='view',
        fields=field_list
    )
    edit = action(table_name,
        id=id('edit'),
        title=title('edit'),
        type='edit',
        fields=field_list
    )
    end = ('../../..'  + replace(fields_table)) if not field_prefix \
          else '../..' + replace(fields_table, with_pick=False)
    next = [(edit, end)]
    ret = [(view, next)]
    # facets
    schema = get_schema()
    facets = []
    for table in schema.tables():
        identity = table.identity().fields
        if len(identity) == 1 \
        and identity[0].is_link \
        and identity[0].target_table.label == fields_table:
            next.extend(record_wizard(table_name,
                fields_table=table.label,
                field_prefix=field_prefix + table.label + '.',
                skip=skip
            ))
            continue
        links = [f for f in identity
                   if f.is_link and f.target_table.label == fields_table]
        if len(links) == 1:
            ret.extend(table_wizard(table.label,
                mask='%s=$%s' % (fields_table, fields_table),
                input=[fields_table],
                skip=skip + [fields_table]
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

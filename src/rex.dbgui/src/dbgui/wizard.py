
from rex.core import cached, OMapVal
from rex.action.action import ActionVal
from rex.action.wizard import Wizard
from rex.deploy import model

action_val = ActionVal()
wizard_val = ActionVal(action_class=Wizard)

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

def table_wizard(table_name):
    [(pick_action, _)] = pick(table_name)
    [(make_action, _)] = make(table_name)
    return [(pick_action, record_wizard(table_name) + [
        (make_action, '../..' + replace(table_name))
    ])]

def replace(table_name, with_pick=True):
    ret = '/view-%s' % table_name
    if with_pick:
        ret = ('/pick-%s' % table_name) + ret
    return ret

def pick(table_name):
    return [(
        action(table_name, type='pick'),
    None)]

def make(table_name):
    return [(
        action(table_name, type='make'),
    None)]

def record_wizard(table_name):
    #TODO: generate fields replacing entity with links
    view = action(table_name, type='view')
    edit = action(table_name, type='edit')
    return [(view, [(edit, '../../..' + replace(table_name))] + facets(table_name))]

def fields(table_name, prefix='', skip=[]):
    skip_dict = dict([(f.label, True) for f in skip])
    schema = model()
    table = schema.table(table_name)
    ret = []
    for f in table.fields():
        if f.label in skip_dict:
            continue
        ret.append(prefix + f.label)
    return ret

def facets(table_name, skip_links_to=[]):
    schema = model()
    tables = []
    for table in schema.tables():
        identity = table.identity().fields
        if len(identity) == 1 \
        and identity[0].is_link \
        and identity[0].target_table.label == table_name:
            tables.append((table, identity[0]))
    view_facet = lambda table, skip: action(table_name, 'view',
        id='view-%s' % table.label,
        title='View %s' % (table.title or table.label),
        fields=fields(table.label, prefix=table.label + '.', skip=[skip])
    )
    ret = [(view_facet(t, s), None)
            for t, s in sorted(tables, key=lambda x: x[0].title)]
    return ret

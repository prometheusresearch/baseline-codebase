
from rex.core import cached, OMapVal
from rex.action.action import ActionVal
from rex.action.wizard import Wizard

action_val = ActionVal()
wizard_val = ActionVal(action_class=Wizard)

@cached
def get_wizard(table_name):
    wizard = table(table_name)
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
    kwds['id'] = '%s-%s' % (type, table_name)
    if type != 'wizard':
        kwds['entity'] = table_name
    return constructor(kwds)

def table(table_name):
    [(pick_action, _)] = pick(table_name)
    [(make_action, _)] = make(table_name)
    return [(pick_action, record(table_name) + [
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

def record(table_name):
    #TODO: generate fields replacing entity with links
    view = action(table_name, type='view')
    edit = action(table_name, type='edit')
    return [(view, [(edit, '../../..' + replace(table_name))])]

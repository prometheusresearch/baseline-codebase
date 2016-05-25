
from rex.core import cached, OMapVal
from rex.action.action import ActionVal
from rex.action.wizard import Wizard

action_val = ActionVal()
omap = OMapVal()

def pick(table):
    return action_val(dict(
        type='pick',
        id='pick-%s' % table,
        entity=table,
        title='Pick %s' % table
    ))

def view(table):
    return action_val(dict(
        type='view',
        id='view-%s' % table,
        entity=table,
        title='View %s' % table
    ))

@cached
def get_wizard(table):
    return ActionVal(action_class=Wizard)(dict(
        type='wizard',
        id='wizard-%s' % table,
        path=[
            omap([
                ('pick-individual', [omap([('view-individual', None)])])
            ])
        ],
        actions={
            'pick-individual': pick(table),
            'view-individual': view(table),
        }
    ))

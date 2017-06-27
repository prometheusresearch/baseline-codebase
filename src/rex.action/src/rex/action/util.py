"""

    rex.action.util
    ===============

    :copyright: 2017, Prometheus Research, LLC

"""

__all__ = ('get_action_key',)

def get_action_key(parent_id, action_local_id):
    key = '%s@%s' % (parent_id, action_local_id)
    return key

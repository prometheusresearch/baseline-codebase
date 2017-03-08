"""

    rex.action.util
    ===============

    :copyright: 2017, Prometheus Research, LLC

"""

import hashlib

__all__ = ('get_action_key',)

def get_action_key(parent_id, action_local_id):
    key = '%s@%s' % (parent_id, action_local_id)
    # prepend action_local_id for debug purposes
    key = '%s--%s' % (action_local_id, hashlib.md5(key).hexdigest())
    return key

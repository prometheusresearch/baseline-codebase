"""

    rex.widget.state.reference
    ==========================

"""


from collections import namedtuple


Reference = namedtuple('Reference', ['id', 'path'])


def parse_ref(ref):
    """ Parse string into :class:`Reference`"""
    if ':' in ref:
        id, path = ref.split(':', 1)
        return Reference(id, path.split('.'))
    else:
        return Reference(ref, [])

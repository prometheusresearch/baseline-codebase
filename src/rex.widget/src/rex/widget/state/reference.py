"""

    rex.widget.state.reference
    ==========================

"""


from collections import namedtuple

_Reference = namedtuple('Reference', ['id', 'path'])

class Reference(_Reference):
    """ A reference to state and a path inside its value."""

    __slots__ = ()

    def __new__(cls, state_id, path=None):
        path = path or []
        if ':' in state_id:
            _state_id, _path = state_id.split(':', 1)
            return _Reference.__new__(cls, _state_id, _path.split('.') + path)
        else:
            return _Reference.__new__(cls, state_id, path)

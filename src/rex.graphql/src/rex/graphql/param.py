"""

    rex.graphql.param
    =================

"""

import abc
from . import code_location

autoloc = code_location.autoloc


class Param(abc.ABC):
    """ A parameter.

    Parameters are used by :func:`compute` and :func:`query` fields.

    A parameter's value can be supplied as a GraphQL argument or via some other
    means.
    """
    @abc.abstractmethod
    def with_type(self, type):
        pass

    @abc.abstractmethod
    def __eq__(self, o):
        pass

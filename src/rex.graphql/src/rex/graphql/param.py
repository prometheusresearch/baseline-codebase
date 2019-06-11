"""

    rex.graphql.param
    =================

"""

import abc
from . import code_location

autoloc = code_location.autoloc


class Param(abc.ABC):
    @abc.abstractmethod
    def with_type(self, type):
        pass

    @abc.abstractmethod
    def __eq__(self, o):
        pass

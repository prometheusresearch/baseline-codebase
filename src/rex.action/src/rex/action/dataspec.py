"""

    rex.action.dataspec
    ===================

    :copyright: 2015, Prometheus Research, LLC

"""

from __future__ import absolute_import

from rex.widget import TransitionableRecord

__all__ = ('ContextBinding',)


class ContextBinding(TransitionableRecord):

    fields = ('keys', 'is_join')

    __transit_tag__ = 'contextbinding'

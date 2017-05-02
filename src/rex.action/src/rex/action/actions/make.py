"""

    rex.action.actions.make
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict

from webob.exc import HTTPBadRequest

from rex.core import StrVal
from rex.widget import Field, undefined

from ..typing import RecordTypeVal, RecordType
from .form_action import FormAction

__all__ = ('Make',)


class Make(FormAction):
    """
    Make an entity.

    If ``query`` is provided, then it is used to store the data in the
    database. In this case all the fields declared become **$references** named
    the same as their respective ``value_key``.

    """

    name = 'make'
    js_type = 'rex-action', 'Make'

    submit_button = Field(
        StrVal(), default=undefined,
        doc="""
        Text for submit button.
        """)

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    def context(self):
        return self.input, self.domain.record(self.entity)

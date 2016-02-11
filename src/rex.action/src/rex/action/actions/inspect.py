"""

    rex.action.doc
    ==============

    Introspection for Rex Action based applications.

    :copyright: 2016, Prometheus Research, LLC

"""

from collections import OrderedDict, namedtuple

from cached_property import cached_property
from webob import Response
from webob.exc import HTTPBadRequest

from rex.core import StrVal
from rex.widget import (
    Field, computed_field, responder, RequestURL, transitionable)

from ..action import Action
from .. import typing
from .. import introspection

__all__ = ('ActionList', 'ViewAction')


class ListAction(Action):
    """ List of actions active in an application.
    """

    name = 'inspect-list-action'
    js_type = 'rex-action/lib/inspect/ListAction'


    output = Field(StrVal(), default='path')

    @computed_field
    def actions(self):
        info = introspection.introspect_actions().values()
        return [{'path': info.path, 'info': info.info_widget()}
                for info in info
                if info]

    def context(self):
        output = {self.output: typing.ValueType('path')}
        return (
            self.domain.record(),
            self.domain.record(**output)
        )


class ViewAction(Action):
    """ View action.
    """

    input = Field(StrVal(), default='path')
    output = Field(StrVal(), default='path')

    name = 'inspect-view-action'
    js_type = 'rex-action/lib/inspect/ViewAction'

    @responder(url_type=RequestURL)
    def action(self, req):
        path = req.GET.get('path')
        if not path:
            raise HTTPBadRequest('missing "path" parameter')
        info = introspection.introspect_action(path)
        if info is None:
            raise HTTPBadRequest('invalid "path" parameter')
        info = info.detailed_info_widget()
        return Response(
            transitionable.encode(info, req),
            content_type='application/json')

    def context(self):
        input = {self.input: typing.ValueType('path')}
        output = {self.output: typing.ValueType('path')}
        return (
            self.domain.record(**input),
            self.domain.record(**output)
        )

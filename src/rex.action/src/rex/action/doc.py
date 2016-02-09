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

from rex.widget import (
    Field, computed_field, responder, RequestURL, transitionable)

from .action import Action
from . import typing
from . import introspection

__all__ = ('ActionList', 'ViewAction')


class ListAction(Action):
    """ List of actions active in an application.
    """

    name = 'doc-list-action'
    js_type = 'rex-action/lib/doc/ListAction'

    @computed_field
    def actions(self):
        info = introspection.introspect_actions().values()
        return [{'path': info.path, 'info': info.info_widget()}
                for info in info
                if info]

    def context(self):
        return (
            self.domain.record(),
            self.domain.record(path=typing.ValueType('path'))
        )


class ViewAction(Action):
    """ View action.
    """

    name = 'doc-view-action'
    js_type = 'rex-action/lib/doc/ViewAction'

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
        return (
            self.domain.record(path=typing.ValueType('path')),
            self.domain.record()
        )

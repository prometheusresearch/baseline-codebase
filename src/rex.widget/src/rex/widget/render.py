"""

    rex.widget.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

import json
import pkg_resources
import os

from webob import Response
from webob.exc import HTTPBadRequest

from rex.core import get_packages, get_settings, Extension
from rex.db import get_db
from rex.web import render_to_response

from .keypath import KeyPathVal
from .transitionable import encode, select, SelectError
from .chrome import get_chrome

__all__ = ('render',)


class Bootstrap(Extension):

    name = None
    after_bundle = False

    @classmethod
    def sanitize(cls):
        assert cls.name is None or isinstance(cls.name, str)

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()"
                                  % self.__class__.__name__)


validate_widget_path = KeyPathVal(allow_empty=True)


def render(widget, request,
        template='rex.widget:/templates/index.html',
        path=None,
        title=None,
        no_chrome=False):
    """ Render ``widget`` in the context of a given ``request``.

    Can be used by WSGI applications to generate responses from widgets::

        import webob

        @webob.dec.wsgify
        def application(req):
            widget = Panel(children=[
                Title(title='Title'),
                Panel(children=[]),
                ])
            return render_widget(widget, req)

    :param widget: Widget instance to render
    :type widget: :class:`rex.widget.Widget`

    :param request: WSGI request
    :type request: :class:`webob.Request`

    :keyword template: Template to use (as a package spec ``pkg.module:/path``)
    :type template: str

    :keyword no_chrome: If ``True`` do not wrap widget in chrome
    :type no_chrome: bool

    :return: WSGI response
    :rtype: :class:`webob.Response`
    """
    if not no_chrome:
        Chrome = get_chrome()
        widget = Chrome.validated(content=widget, title=title)
    if path:
        path = validate_widget_path(path)
        try:
            widget = select(widget, request, path)
        except SelectError as err:
            raise HTTPBadRequest('invalid path "%s" at key "%s"' % \
                                 ('.'.join(str(segment) for segment in path), err.key))
        if not hasattr(widget, 'respond') or not callable(widget.respond):
            raise HTTPBadRequest('unable to locate responder via selector')
        return widget.respond(request)
    else:
        settings = get_settings()
        accept = request.accept.best_match(['text/html', 'application/json'])
        payload = encode(widget, request)
        theme = encode(settings.rex_widget.theme, request)
        if accept == 'application/json':
            return Response(payload, content_type='application/json', charset='utf-8')
        else:
            user = get_db().produce('$USER').data
            before_bundle = [item() for item in Bootstrap.all()
                                    if not getattr(item, 'after_bundle', False)]
            after_bundle = [item() for item in Bootstrap.all()
                                   if getattr(item, 'after_bundle', False)]
            return render_to_response(
                template, request,
                user=json.dumps(json.dumps(user)),
                theme=theme,
                before_bundle=before_bundle,
                after_bundle=after_bundle,
                payload=payload)

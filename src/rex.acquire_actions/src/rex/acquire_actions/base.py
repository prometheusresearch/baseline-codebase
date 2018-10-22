#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob import Response
from webob.exc import HTTPForbidden, HTTPBadRequest, HTTPNotFound

from rex.action import Action
from rex.action.actions import EntityAction
from rex.core import get_settings, Error, Extension
from rex.db import get_db
from rex.forms.implementation.lookup import REGISTRY
from rex.i18n import get_locale_identifier
from rex.instrument import Channel, User
from rex.instrument.util import to_json
from rex.web import authenticate
from rex.widget import Field, URLVal, computed_field, URL, responder, \
    RequestURL, JSValue


__all__ = (
    'CommonAcquireMixin',
    'AcquireAction',
    'AcquireEntityAction',
)


class FormQuestionWidget(Extension):
    """ An interface to define custom widgets for rex.forms questions."""

    name = None
    js_type = None

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def sanitize(cls):
        if not cls.enabled():
            return
        if cls.js_type is None:
            raise Error(
                'Implementation %s does not conform to rex.forms.interface.FormQuestionWidget interface' % (cls.__name__,),
                'Missing js_type class attribute')

    @classmethod
    def to_widget_config(cls):
        return {w.name: JSValue(package=w.js_type[0], symbol=w.js_type[1]) for w
                in cls.all()}


class CommonAcquireMixin(object):

    def get_user(self, request):
        if not hasattr(request, '_acquire_user'):
            user_id = authenticate(request)
            user = User.get_implementation().get_by_login(user_id)
            if not user:
                raise HTTPForbidden('Unrecognized user')
            setattr(request, '_acquire_user', user)
        return request._acquire_user

    def response_as_json(self, obj):
        return Response(
            to_json(obj),
            charset='utf-8',
            headerlist=[
                ('Content-type', 'application/json'),
            ]
        )

    def do_lookup(self, request):
        lookup = request.GET.get('lookup')
        query = request.GET.get('query')
        if not lookup or not query:
            raise HTTPBadRequest('Must specify both lookup and query.')

        lookup_query = REGISTRY.get_query(lookup)
        if not lookup_query:
            raise HTTPNotFound('Unknown lookup ID "%s"' % (lookup,))

        data = get_db().produce(lookup_query, search=query)
        hits = []
        for rec in data:
            hits.append({
                'value': rec.value,
                'label': rec.label,
            })

        return self.response_as_json({'values': hits})


class AcquireAction(CommonAcquireMixin, Action):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs.'
    )

    resource_prefix_url = Field(
        URLVal(),
        default=None,
        doc='The URL to prefix resources with when rendering Forms.',
    )

    @computed_field
    def widget_config(self):
        return FormQuestionWidget.to_widget_config()

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = Channel.get_implementation()
        return [
            channel.as_dict()
            for channel in channel_impl.find()
        ]

    def __init__(self, *args, **kwargs):
        prefix = get_settings().forms_local_resource_prefix
        if kwargs['resource_prefix_url'] is None and prefix is not None:
            kwargs['resource_prefix_url'] = URL(prefix)
        super(AcquireAction, self).__init__(*args, **kwargs)

    @responder(url_type=RequestURL)
    def lookup_field(self, request):
        return self.do_lookup(request)


class AcquireEntityAction(CommonAcquireMixin, EntityAction):
    i18n_base_url = Field(
        URLVal(),
        default='rex.i18n:/',
        doc='The base URL of the I18N server-side APIs.'
    )

    resource_prefix_url = Field(
        URLVal(),
        default=None,
        doc='The URL to prefix resources with when rendering Forms.',
    )

    @computed_field
    def widget_config(self):
        return FormQuestionWidget.to_widget_config()

    @computed_field
    def locale(self, request):
        # pylint: disable=unused-argument
        return get_locale_identifier()

    @computed_field
    def channels(self, request):
        # pylint: disable=unused-argument
        channel_impl = Channel.get_implementation()
        return [
            channel.as_dict()
            for channel in channel_impl.find()
        ]

    def __init__(self, *args, **kwargs):
        prefix = get_settings().forms_local_resource_prefix
        if kwargs['resource_prefix_url'] is None and prefix is not None:
            kwargs['resource_prefix_url'] = URL(prefix)
        super(AcquireEntityAction, self).__init__(*args, **kwargs)

    @responder(url_type=RequestURL)
    def lookup_field(self, request):
        return self.do_lookup(request)


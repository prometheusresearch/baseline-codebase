#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import get_settings, StrVal
from rex.restful import SimpleResource
from rex.web import Parameter

from .base import BaseResource, get_instrument_user, ConstantArg


__all__ = (
    'InstrumentVersionResource',
)


class InstrumentVersionResource(SimpleResource, BaseResource):
    base_path = '/api/instrumentversion'
    base_parameters = BaseResource.base_parameters + (
        Parameter('instrument', StrVal(), None),
        Parameter('version', StrVal(), None),
    )

    path = '/api/instrumentversion/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'instrumentversion'
    extra_properties = ['definition']

    def list(self, request, **kwargs):
        return self.do_list(
            request,
            list_criteria=['instrument', 'version'],
            **kwargs
        )

    def create(self, request, **kwargs):
        return self.do_create(
            request,
            create_args=[
                (
                    'instrument',
                    get_settings().instrument_implementation.instrument,
                ),
                'definition',
                'published_by',
            ],
            create_kwargs=['version', 'date_published'],
        )

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)

    def update(self, request, uid, **kwargs):
        user = get_instrument_user(request).get_display_name()
        return self.do_update(
            request,
            uid,
            properties=['definition', 'date_published',
                        ConstantArg('published_by', user)],
        )


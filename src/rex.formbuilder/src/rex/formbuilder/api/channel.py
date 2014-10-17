#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import StrVal
from rex.restful import SimpleResource
from rex.web import Parameter

from .base import BaseResource


__all__ = (
    'ChannelResource',
)


class ChannelResource(SimpleResource, BaseResource):
    base_path = '/api/channel'
    base_parameters = BaseResource.base_parameters + (
        Parameter('title', StrVal(), None),
    )

    path = '/api/channel/{uid}'
    parameters = (
        Parameter('uid', StrVal()),
    )

    interface_name = 'channel'
    interface_package = 'forms'

    def list(self, request, **kwargs):
        return self.do_list(request, list_criteria=['title'], **kwargs)

    def retrieve(self, request, uid, **kwargs):
        return self.do_retrieve(request, uid)


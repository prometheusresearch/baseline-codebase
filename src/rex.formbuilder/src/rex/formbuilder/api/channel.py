#
# Copyright (c) 2014, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.core import StrVal
from rex.restful import SimpleResource
from rex.web import Parameter

from .base import BaseResource


__all__ = (
    'ChannelResource',
)


# pylint: disable=unused-argument


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

    def list(self, request, **kwargs):
        kwargs['presentation_type'] = 'form'
        return self.do_list(
            request,
            list_criteria=['title', 'presentation_type'],
            **kwargs
        )

    def retrieve(self, request, uid, **kwargs):
        channel = self.do_retrieve(request, uid)
        if channel['presentation_type'] != 'form':
            raise HTTPNotFound()
        return channel


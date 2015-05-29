#
# Copyright (c) 2015, Prometheus Research, LLC
#


from urlparse import urlparse

from rex.core import cached, get_settings

from .transports import AsyncTransport


__all__ = (
    'get_transport',
)


@cached
def get_transport(uri=None):
    uri = uri or get_settings().asynctask_transport

    parts = urlparse(uri)
    transport = AsyncTransport.mapped().get(parts.scheme)
    if not transport:
        raise ValueError(
            '"%s" does not resolve to a known AsyncTransport' % (
                uri,
            )
        )

    return transport(parts)


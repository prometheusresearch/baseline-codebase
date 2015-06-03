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
    """
    Retrieves a connection to the transport that controls the queuing and
    dequeuing of tasks.

    :param uri:
        the transport URI to retrieve the connection to; if not specified,
        defaults to the value of the ``asynctask_transport`` setting
    :type uri: str
    :rtype: AsyncTransport
    """

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


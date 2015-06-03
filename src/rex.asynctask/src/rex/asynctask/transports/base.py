#
# Copyright (c) 2015, Prometheus Research, LLC
#


import json
import re

from urlparse import parse_qs

from rex.core import Extension, MaybeVal, MapVal


__all__ = (
    'AsyncTransport',
)


RE_QUEUE_NAME = re.compile(r'^[a-z](?:[a-z0-9]|[_](?![_]))*[a-z0-9]$')


class AsyncTransport(Extension):
    """
    This is an extension to allow custom transport implementations for the
    rex.asynctask package.
    """

    #: The name of the transport as referred to in the asynctask_transport
    #: setting.
    name = None

    @classmethod
    def sanitize(cls):
        if cls.enabled():
            assert cls.submit_task != AsyncTransport.submit_task, \
                '%s.submit_task() method not implemented' % cls
            assert cls.get_task != AsyncTransport.get_task, \
                '%s.get_task() method not implemented' % cls

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    def __init__(self, uri_parts):
        """
        Stores the relevant pieces of the asynctask_transport URI as properties
        on this object. It will set the ``location``, ``path`` ,and ``options``
        properties.

        :param uri_parts: the parsed transport URI
        :type uri_parts: urlparse.ParseResult
        """

        self.location = uri_parts.netloc
        self.path = uri_parts.path
        self.options = parse_qs(uri_parts.query)
        for key, value in self.options.items():
            self.options[key] = value[0]
        self.initialize()

    def initialize(self):  # pragma: no cover
        """
        Called once during the initialization of the application to allow the
        transport to perform any necessary setup.
        """

        pass

    def is_valid_name(self, name):
        """
        Indicates whether or not the specified name can be used as a queue
        name.

        :param name: the name to check
        :type name: str
        :rtype: bool
        """

        if RE_QUEUE_NAME.match(name):
            return True
        return False

    def ensure_valid_name(self, name):
        """
        Checks to see if the specified name can be used as a queue name, and
        will raise an excpetion if it can't.

        :param name: the name to check
        :type name: str
        :raises:
            ValueError if the specified name is not a valid queue name
        """

        if not self.is_valid_name(name):
            raise ValueError(
                '"%s" is not a properly-formatted queue name' % (
                    name,
                )
            )

    _PAYLOAD_VALIDATOR = MaybeVal(MapVal())

    def encode_payload(self, payload):
        """
        Encodes the payload for safe transport while in the queue.

        :param payload: the task payload to encode
        :type payload: dict
        :returns: JSON-encoded string
        """

        payload = AsyncTransport._PAYLOAD_VALIDATOR(payload) or {}
        payload = json.dumps(payload)
        return payload

    def decode_payload(self, payload):
        """
        Decodes the payload so it can be used by backend workers/processors.
        (It's the inverse of the encode_payload() method)

        :param payload: the encoded payload to decode
        :type payload: JSON-encoded string
        :rtype: dict
        """

        if isinstance(payload, basestring):
            payload = json.loads(payload)
        return payload

    def submit_task(self, queue_name, payload):
        """
        Places a task into the specified queue.

        Must be implemented by concrete classes.

        :param queue_name: the name of the queue to place the task in
        :type queue_name: str
        :param payload: the data to send in the task
        :type payload: dict
        """

        raise NotImplementedError()

    def get_task(self, queue_name):
        """
        Retrieves a task from the specified queue.

        Must be implemented by concrete classes.

        :param queue_name: the name of the queue to retrieve a task from
        :type queue_name: str
        :returns:
            the payload dictionary of the task, or ``None`` if there are no
            tasks in the queue
        """

        raise NotImplementedError()


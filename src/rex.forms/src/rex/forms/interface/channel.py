#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension
from rex.instrument.mixins import Comparable, Displayable, Dictable
from rex.instrument.util import to_unicode


__all__ = (
    'Channel',
)


class Channel(Extension, Comparable, Displayable, Dictable):
    """
    Represents an Electronic Data Capture system for which a Form can be
    defined.
    """

    dict_properties = (
        'title',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Channel from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Channel to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Channel; None if the specified UID does not exist
        :rtype: Channel
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Channels that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * title (partial matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Channels to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Channels to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Channels
        """

        raise NotImplementedError()

    def __init__(self, uid, title):
        self._uid = to_unicode(uid)
        self._title = to_unicode(title)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Channel in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def title(self):
        """
        The human-readable title of the Channel.

        :rtype: unicode
        """

        return self._title

    def get_instruments(self, offset=0, limit=100, **search_criteria):
        """
        Returns Instruments that have at least one Form configured for this
        Channel.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instruments to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Instruments to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Instruments
        """

        raise NotImplementedError()

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.title

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.title,
        )


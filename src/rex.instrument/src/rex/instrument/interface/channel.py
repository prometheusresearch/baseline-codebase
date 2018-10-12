#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode, get_implementation


__all__ = (
    'Channel',
)


class Channel(Extension, Comparable, Displayable, Dictable):
    """
    Represents an Electronic Data Capture system for which a Presentation
    configuration can be defined.
    """

    PRESENTATION_TYPE_FORM = 'form'
    PRESENTATION_TYPE_SMS = 'sms'
    ALL_PRESENTATION_TYPES = (
        PRESENTATION_TYPE_FORM,
        PRESENTATION_TYPE_SMS,
    )

    dict_properties = (
        'title',
        'presentation_type',
    )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a Channel from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Channel to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Channel
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Channel; None if the specified UID does not exist
        :rtype: Channel
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Channels that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * title (partial matches)
        * presentation_type (exact matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Channels to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Channels to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Channels
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Channels
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('channel')

    def __init__(self, uid, title, presentation_type):
        self._uid = to_unicode(uid)
        self._title = to_unicode(title)
        if presentation_type not in Channel.ALL_PRESENTATION_TYPES:
            raise ValueError(
                '"%s" is not a valid presentation type' % (presentation_type,)
            )
        self._presentation_type = presentation_type

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

    @property
    def presentation_type(self):
        """
        The presentation type this Channel handles.

        :rtype: unicode
        """

        return self._presentation_type

    def get_instruments(
            self,
            offset=0,
            limit=None,
            user=None,
            **search_criteria):
        """
        Returns Instruments that have at least one Presentation configuration
        set up for this Channel.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instruments to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Instruments to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means no
            limit
        :type limit: int
        :param user: the User who should have access to the desired Instruments
        :type user: User
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
        return '%s(%r, %r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.title,
            self.presentation_type,
        )


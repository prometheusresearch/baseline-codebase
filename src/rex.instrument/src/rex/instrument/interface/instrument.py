#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode


__all__ = (
    'Instrument',
)


class Instrument(Extension, Comparable, Displayable, Dictable):
    """
    Represents a general, unversioned Instrument.
    """

    #: The Instrument can be used for data collection.
    STATUS_ACTIVE = u'active'

    #: The Instrument is not allowed to be used for data collection.
    STATUS_DISABLED = u'disabled'

    #: All valid values that the status property can be assigned.
    ALL_STATUSES = (
        STATUS_ACTIVE,
        STATUS_DISABLED,
    )

    dict_properties = (
        'title',
        'status',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves an Instrument from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Instrument to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Instrument; None if the specified UID does not exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Instruments that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instrument to start the return set from
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

    @classmethod
    def create(cls, uid, title, status=None):
        """
        Creates an Instrument in the datastore and returns a corresponding
        Instrument instance.

        Must be implemented by concrete classes.

        :param uid:
            the unique identifier that will represent the new Instrument
        :type uid: string
        :param title: the title to use for the new Instrument
        :type title: string
        :param status:
            the status to assign the new Instrument. if not specified,
            ``STATUS_ACTIVE`` is used
        :type status: string
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Instrument
        """

        raise NotImplementedError()

    def __init__(self, uid, title, status=None):
        self._uid = to_unicode(uid)
        self.title = title
        self.status = status or self.__class__.STATUS_ACTIVE

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Instrument in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def title(self):
        """
        The human-readable title of the Instrument.

        :rtype: unicode
        """

        return self._title

    @title.setter
    def title(self, value):
        # pylint: disable=W0201
        self._title = to_unicode(value)

    @property
    def status(self):
        """
        The status of this Instrument.

        :rtype: unicode
        """

        return self._status

    @status.setter
    def status(self, value):
        if value not in self.__class__.ALL_STATUSES:
            raise ValueError(
                '"%s" is not a valid Instrument status' % (
                    value,
                )
            )
        # pylint: disable=W0201
        self._status = value

    def get_version(self, version):
        """
        Returns the InstrumentVersion for this Instrument of the specified
        version.

        Must be implemented by concrete classes.

        :returns:
            an InstrumentVersion for the specified version; None if the
            specified version does not exist
        """

        raise NotImplementedError()

    @property
    def latest_version(self):
        """
        The most recent InstrumentVersion for this Instrument. Read only.

        Must be implemented by concrete classes.
        """

        raise NotImplementedError()

    def save(self):
        """
        Persists the Instrument into the datastore.

        Must be implemented by concrete classes.

        :raises:
            DataStoreError if there was an error writing to the datastore
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


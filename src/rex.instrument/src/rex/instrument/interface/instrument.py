#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import *
from ..util import to_unicode, get_implementation


__all__ = (
    'Instrument',
)


class Instrument(
        Extension,
        Comparable,
        Displayable,
        Dictable,
        ImplementationContextable):
    """
    Represents a general, unversioned Instrument.
    """

    #: The Instrument can be used for data collection.
    STATUS_ACTIVE = 'active'

    #: The Instrument is not allowed to be used for data collection.
    STATUS_DISABLED = 'disabled'

    #: All valid values that the status property can be assigned.
    ALL_STATUSES = (
        STATUS_ACTIVE,
        STATUS_DISABLED,
    )

    dict_properties = (
        'title',
        'code',
        'status',
    )

    @classmethod
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves an Instrument from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Instrument to retrieve
        :type uid: string
        :param user: the User who should have access to the desired Instrument
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Instrument; None if the specified UID does not exist
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Instruments that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * title (partial matches)
        * code (partial matches)
        * status (exact matches)
        * presentation_type (has at least one configuration for the specified
          type)
        * only_presentation_type (only has configurations for the specified
          type)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Instrument to start the return set from
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

    @classmethod
    def create(cls, code, title, status=None, implementation_context=None):
        """
        Creates an Instrument in the datastore and returns a corresponding
        Instrument instance.

        Must be implemented by concrete classes.

        :param code:
            a unique identifier that will represent the new Instrument. in some
            implementations, this is used to generate the UID of the Instrument
        :type code: string
        :param title: the title to use for the new Instrument
        :type title: string
        :param status:
            the status to assign the new Instrument. if not specified,
            ``STATUS_ACTIVE`` is used
        :type status: string
        :param implementation_context:
            the extra, implementation-specific variables necessary to create
            the Instrument in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
        :raises:
            DataStoreError if there was an error writing to the datastore
        :rtype: Instrument
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('instrument')

    def __init__(self, uid, code, title, status=None):
        self._uid = to_unicode(uid)
        self._code = to_unicode(code)
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
    def code(self):
        """
        A unique string that represents the Instrument in the set of
        Instruments in the system. Read only.

        :rtype: unicode
        """

        return self._code

    @property
    def title(self):
        """
        The human-readable title of the Instrument.

        :rtype: unicode
        """

        return self._title

    @title.setter
    def title(self, value):
        # pylint: disable=attribute-defined-outside-init
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
        # pylint: disable=attribute-defined-outside-init
        self._status = value

    def get_version(self, version):
        """
        Returns the InstrumentVersion for this Instrument of the specified
        version.

        :returns:
            an InstrumentVersion for the specified version; None if the
            specified version does not exist
        """

        iv_impl = get_implementation('instrumentversion')
        iver = iv_impl.find(
            instrument=self.uid,
            version=version
        )
        if iver:
            return iver[0]
        return None

    @property
    def latest_version(self):
        """
        The most recent InstrumentVersion for this Instrument. Read only.

        Must be implemented by concrete classes.

        :rtype: InstrumentVersion
        """

        raise NotImplementedError()

    def save(self, implementation_context=None):
        """
        Persists the Instrument into the datastore.

        Must be implemented by concrete classes.

        :param implementation_context:
            the extra, implementation-specific variables necessary to persist
            the Intrument in the data store; if not specified, defaults to
            None
        :type implementation_context: dict
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

        return to_unicode(self.title)

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.title,
        )


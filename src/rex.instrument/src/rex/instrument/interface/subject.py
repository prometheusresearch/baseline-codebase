#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode


__all__ = (
    'Subject',
)


class Subject(Extension, Comparable, Displayable, Dictable):
    """
    Represents the Subject of an Instrument; the person, place, or thing that
    an Instrument is gathering data points about.
    """

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a Subject from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the Subject to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified Subject; None if the specified UID does not exist
        :rtype: Subject
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Subjects that match the specified criteria.

        ``search_criteria`` for this method will (at a minimum) support:

        * uid (partial matches)

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Subjects to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Subjects to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Subjects
        """

        raise NotImplementedError()

    def __init__(self, uid):
        self._uid = to_unicode(uid)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this Subject in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid


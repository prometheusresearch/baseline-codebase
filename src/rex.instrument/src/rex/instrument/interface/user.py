#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode


__all__ = (
    'User',
)


class User(Extension, Comparable, Displayable, Dictable):
    """
    Represents the person who is engaging with the application in order to
    provide responses for Instruments. The User may or may not be the Subject
    of an Instrument.
    """

    dict_properties = (
        'login',
    )

    @classmethod
    def get_by_uid(cls, uid):
        """
        Retrieves a User from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the User to retrieve
        :type uid: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified UID does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def get_by_login(cls, login):
        """
        Retrieves a User from the datastore using its login username.

        Must be implemented by concrete classes.

        :param login: the login username of the User to retrieve
        :type login: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified login does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=100, **search_criteria):
        """
        Returns Users that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Users to start the return set from
            (useful for pagination purposes)
        :type offset: int
        :param limit:
            the maximum number of Users to return (useful for pagination
            purposes)
        :type limit: int
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Users
        """

        raise NotImplementedError()

    def __init__(self, uid, login):
        self._uid = to_unicode(uid)
        self._login = to_unicode(login)

    @property
    def uid(self):
        """
        The Unique Identifier that represents this User in the datastore.
        Read only.

        :rtype: unicode
        """

        return self._uid

    @property
    def login(self):
        """
        The (unique) login username that is assigned to this user. Read only.

        :rtype: unicode
        """

        return self._login

    def get_subject(self, uid):
        """
        Retrieves a Subject using its UID, if this User has access to it.

        :param uid: the UID of the Subject to retrieve
        :type uid: string
        :returns:
            the Subject matching the UID if this User has access to it;
            otherwise None
        """

        raise NotImplementedError()

    def find_subjects(self, offset=0, limit=100, **search_criteria):
        """
        Returns Subjects that match the specified criteria that this User
        has access to.

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

    def get_display_name(self):
        """
        Returns a unicode string that represents this object, suitable for use
        in human-visible places.

        :rtype: unicode
        """

        return self.login

    def __repr__(self):
        return '%s(%r, %r)' % (
            self.__class__.__name__,
            self.uid,
            self.login,
        )


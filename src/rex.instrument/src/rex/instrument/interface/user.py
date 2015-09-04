#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension

from ..mixins import Comparable, Displayable, Dictable
from ..util import to_unicode, get_implementation


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
    def get_by_uid(cls, uid, user=None):
        """
        Retrieves a User from the datastore using its UID.

        Must be implemented by concrete classes.

        :param uid: the UID of the User to retrieve
        :type uid: string
        :param user: the User who should have access to the desired User
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified UID does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def get_by_login(cls, login, user=None):
        """
        Retrieves a User from the datastore using its login username.

        Must be implemented by concrete classes.

        :param login: the login username of the User to retrieve
        :type login: string
        :param user: the User who should have access to the desired User
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the specified User; None if the specified login does not exist
        :rtype: User
        """

        raise NotImplementedError()

    @classmethod
    def find(cls, offset=0, limit=None, user=None, **search_criteria):
        """
        Returns Users that match the specified criteria.

        Must be implemented by concrete classes.

        :param offset:
            the offset in the list of Users to start the return set from
            (useful for pagination purposes); if not specified, defaults to 0
        :type offset: int
        :param limit:
            the maximum number of Users to return (useful for pagination
            purposes); if not specified, defaults to ``None``, which means
            no limit
        :type limit: int
        :param user: the User who should have access to the desired Users
        :type user: User
        :raises:
            DataStoreError if there was an error reading from the datastore
        :rtype: list of Users
        """

        raise NotImplementedError()

    @classmethod
    def get_implementation(cls):
        """
        Returns the concrete implementation of this class that is activated in
        the currently running application.

        :rtype: type
        """

        return get_implementation('user')

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

    def get_object_by_uid(self, uid, object_name, package_name='instrument'):
        """
        Retrieves an interface object using its UID, if this User has access to
        it. Essentially acts as a proxy to the object's get_by_uid() method.

        :param uid: the UID of the object to retrieve
        :type uid: string
        :param object_name:
            the name of the interface object to retrieve (e.g., "subject",
            "instrument", "instrumentversion", "assessment", etc)
        :type object_name: string
        :param package_name:
            the package alias the interface object is defined in; if not
            specified, defaults to "instrument"
        :type package_name: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns:
            the object matching the UID if this User has access to it;
            otherwise None
        """

        impl = get_implementation(object_name, package_name=package_name)
        return impl.get_by_uid(uid, user=self)

    def find_objects(self, object_name, package_name='instrument', **kwargs):
        """
        Retrieves interface objects that match the specified criteria that this
        User has access to. Essentially acts as a proxy to the object's find()
        method.

        :param object_name:
            the name of the interface object to retrieve (e.g., "subject",
            "instrument", "instrumentversion", "assessment", etc)
        :type object_name: string
        :param package_name:
            the package alias the interface object is defined in; if not
            specified, defaults to "instrument"
        :type package_name: string
        :raises:
            DataStoreError if there was an error reading from the datastore
        :returns: list of interface objects
        """

        impl = get_implementation(object_name, package_name=package_name)
        return impl.find(user=self, **kwargs)

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


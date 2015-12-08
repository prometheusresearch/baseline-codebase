#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Extension

from .config import get_all_definitions
from .connections import get_management_db
from .mart import Mart


__all__ = (
    'MartAccessPermissions',
)


class MartAccessPermissions(Extension):
    """
    An extendable interface for defining the logic that governs which Marts
    and/or Definitions can be accessed by system users.
    """

    @classmethod
    def user_can_access_mart(cls, user, mart_or_id):
        """
        Identifies whether or not a user can access a Mart.

        :param user: the user to check for access
        :type user: str
        :param mart_or_id:
            the Mart to check for access; this can either be a Mart object
            or just the ID/Code of a Mart
        :type mart_or_id: Mart or str
        :rtype: bool
        """

        if not isinstance(mart_or_id, Mart):
            mart = cls.get_mart(mart_or_id, user)
            if not mart:
                return False
        else:
            mart = mart_or_id

        return mart.owner == user \
            and cls.user_can_access_definition(user, mart.definition)

    @classmethod
    def user_can_manage_mart(cls, user, mart_or_id):
        """
        Identifies whether or not a user can manage a Mart. "Manage", in this
        situation, refers to the ability to mark/unmark a Mart as pinned, or to
        purge the Mart.


        :param user: the user to check for access
        :type user: str
        :param mart_or_id:
            the Mart to check for access; this can either be a Mart object
            or just the ID/Code of a Mart
        :type mart_or_id: Mart or str
        :rtype: bool
        """

        return cls.user_can_access_mart(user, mart_or_id)

    @classmethod
    def user_can_access_definition(cls, user, definition_or_id):
        """
        Identifies whether or a user is allowed to access a definition.

        :param user: the user to check for access
        :type user: str
        :param definition_or_id:
            the definition to check for access; this can either be a full
            Definition dictionary object, or just the ID of a Definition
        :type definition_or_id: dict or str
        :rtype: bool
        """

        # pylint: disable=unused-argument
        return True

    @classmethod
    def get_definitions_for_user(cls, user):
        """
        Retrieves the Definitions that the specified user has access to.

        :param user: the user to retrieve Definitions for
        :type user: str
        :rtype: list of dicts
        """

        return [
            definition
            for definition in get_all_definitions()
            if cls.user_can_access_definition(user, definition)
        ]

    @classmethod
    def get_mart(cls, mart_id, user):
        """
        Retrieves a Mart object from the database.

        :param mart_id: the ID/Code of the Mart to retrieve
        :type mart_id: int
        :param user: the user that is requesting access to the Mart
        :type user: str
        :returns:
            ``None`` if the Mart does not exist, ``False`` if the user does
            not have access to the Mart, or the specified Mart object
        """

        data = get_management_db().produce(
            '/rexmart_inventory.filter(code=$code)',
            code=mart_id,
        )
        if not data:
            return None

        mart = Mart.from_record(data[0])
        if cls.user_can_access_mart(user, mart):
            return mart
        else:
            return False

    @classmethod
    def get_marts_for_user(cls, user, definition_id=None):
        """
        Retrieves the Marts that the specified user has access to.

        :param user: the user to retrieve Mart objects for
        :type user: str
        :param definition_id:
            if specified, the Marts returned will be instances of this
            Definition
        :type definition_id: str
        :returns:
            ``False`` if the user does not have access to the Definition, or
            a list of Mart objects ordered by definition ID and descending
            date created
        """

        if definition_id and not cls.user_can_access_definition(
                user,
                definition_id):
            return False

        statement = '/rexmart_inventory.filter(owner=$user)'
        parameters = {'user': user}
        if definition_id:
            statement += '.filter(definition=$definition)'
            parameters.update({'definition': definition_id})
        statement += '.sort(definition, date_creation_completed-)'

        data = get_management_db().produce(statement, **parameters)
        marts = []
        for record in data:
            mart = Mart.from_record(record)
            if cls.user_can_access_mart(user, mart):
                marts.append(mart)

        return marts


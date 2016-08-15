#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Extension, get_settings

from .connections import get_management_db
from .permissions import MartAccessPermissions


__all__ = (
    'MartQuota',
)


HTSQL_MART_COUNTS = """/{
    count(rexmart_inventory.filter(owner=$owner&status='complete')),
    count(rexmart_inventory.filter(owner=$owner&pinned&status='complete')),
    count(rexmart_inventory.filter(owner=$owner&definition=$definition&status='complete')),
    count(rexmart_inventory.filter(owner=$owner&definition=$definition&pinned&status='complete'))
}"""


class MartQuota(Extension):
    """
    An extendable interface for defining the logic that governs how the Mart
    Quota subsystem works.
    """

    @classmethod
    def signature(cls):  # pragma: no cover
        return 'mart'

    @classmethod
    def get_mart_counts(cls, owner, definition_id=None):
        """
        Returns a collection of Mart tallies:

        * total: the total number of Marts the owner has
        * total_pinned: the total number of pinned Marts the owner has
        * definition: the number of Marts of the specified Definition the owner
          has
        * definition_pinned: the number of pinned Marts of the specified
          Definition the owner has

        :param owner: the owner to tally Marts for
        :type owner: str
        :param definition_id: the Definition to tally Marts for
        :type definition_id: str
        :rtype: dict
        """

        data = get_management_db().produce(
            HTSQL_MART_COUNTS,
            owner=owner,
            definition=definition_id,
        )
        return {
            'total': data[0][0],
            'total_pinned': data[0][1],
            'definition': data[0][2],
            'definition_pinned': data[0][3],
        }

    @classmethod
    def can_create_mart(cls, owner, definition):
        """
        Determines whether or not creating a Mart of the specified definition
        for the specified owner would violate their Quota.

        :param owner: the owner whose Quota should be checked
        :type owner: str
        :param definition: the Definition to check
        :type definition: dict
        :rtype: bool
        """

        counts = cls.get_mart_counts(owner, definition['id'])

        if counts['definition_pinned'] >= definition['quota']['per_owner']:
            return False

        if counts['total_pinned'] >= get_settings().mart_max_marts_per_owner:
            return False

        return True

    @classmethod
    def reap_owner_definition_marts(cls, owner, definition):
        """
        Purges Marts of the specified Definition so that the owner is within
        their Quota for the Definition.

        :param owner: the owner to purge the Marts for
        :type owner: str
        :param definition:
        :type definition: dict
        :returns: the list of Mart objects that were purged
        """

        counts = cls.get_mart_counts(owner, definition['id'])
        num_to_purge = counts['definition'] - definition['quota']['per_owner']

        purged_marts = []
        if num_to_purge > 0:
            marts = MartAccessPermissions.top().get_marts_for_user(
                owner,
                definition_id=definition['id'],
            )
            for mart in reversed(marts):
                if (not mart.pinned) and mart.usable:
                    mart.purge()
                    purged_marts.append(mart)
                    if len(purged_marts) >= num_to_purge:
                        break

        return purged_marts

    @classmethod
    def reap_owner_marts(cls, owner):
        """
        Purges Marts of the owner so that they are within their Quota.

        :param owner: the owner to purge the Marts for
        :type owner: str
        :returns: the list of Mart objects that were purged
        """

        counts = cls.get_mart_counts(owner, None)
        num_to_purge = counts['total'] \
            - get_settings().mart_max_marts_per_owner

        purged_marts = []
        if num_to_purge > 0:
            marts = MartAccessPermissions.top().get_marts_for_user(owner)
            for mart in reversed(marts):
                if (not mart.pinned) and mart.usable:
                    mart.purge()
                    purged_marts.append(mart)
                    if len(purged_marts) >= num_to_purge:
                        break

        return purged_marts

    @classmethod
    def reap_marts(cls, owner, definition):
        """
        Purges old Marts so that the owner's Quota is not in violation.

        :param owner: the owner whose Marts need to be reaped
        :type owner: str
        :param definition: the Definition of the Mart that was just created
        :type definition: dict
        :returns: the list of Mart objects that were purged
        """

        purged_marts = cls.reap_owner_definition_marts(owner, definition)
        purged_marts.extend(cls.reap_owner_marts(owner))

        return purged_marts


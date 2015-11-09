#
# Copyright (c) 2015, Prometheus Research, LLC
#


from .connections import get_management_db, get_hosting_cluster


__all__ = (
    'purge_mart',
)


def purge_mart(code):
    """
    Deletes a Mart database and removes it from the inventory.

    :param code: the code/ID of the Mart to purge
    :type code: str
    """

    db = get_management_db()

    # Get the name of the Mart
    data = db.produce(
        '/rexmart_inventory[$code]{name}',
        code=code,
    )
    if not data:
        # Already purged?
        return
    name = data[0].name

    # Physically remove the Mart database
    cluster = get_hosting_cluster()
    if cluster.exists(name):
        cluster.drop(name)

    # Remove the Mart from the inventory
    db.produce(
        '/rexmart_inventory[$code]{id()}/:delete',
        code=code,
    )


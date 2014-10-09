#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .image import TableImage, ColumnImage, UniqueKeyImage


def recover(driver, image):
    # Restores a fact object from a database entity.
    from .table import TableFact
    from .column import ColumnFact
    from .link import LinkFact
    from .identity import IdentityFact
    if image is None:
        return None
    if isinstance(image, TableImage):
        return TableFact.recover(driver, image)
    if isinstance(image, ColumnImage):
        return (ColumnFact.recover(driver, image) or
                LinkFact.recover(driver, image))
    if isinstance(image, UniqueKeyImage) and image.is_primary:
        return IdentityFact.recover(driver, image)
    raise NotImplementedError(image)



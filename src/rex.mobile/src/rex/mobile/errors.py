#
# Copyright (c) 2015, Prometheus Research, LLC
#


__all__ = (
    'MobileError',
    'ValidationError',
    'DataStoreError',
    'AlreadyExistsError',
)


class MobileError(Exception):
    """
    The base class of any exception raised directly by rex.mobile
    """

    pass


class ValidationError(MobileError):
    """
    The exception raised when there are errors encountered when validating a
    schema.
    """

    pass


class DataStoreError(MobileError):
    """
    The exception raised when there are problems encountered when reading or
    writing to the datastore.
    """

    pass


class AlreadyExistsError(DataStoreError):
    """
    The exception raised when trying to create an object with a UID that
    already exists.
    """

    pass


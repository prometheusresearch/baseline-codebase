#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error


__all__ = (
    'MobileError',
    'ValidationError',
    'DataStoreError',
    'AlreadyExistsError',
)


class MobileError(Error):
    """
    The base class of any exception raised directly by rex.mobile
    """

    def __init__(self, message, payload=None):
        self.message = message
        super(MobileError, self).__init__(message, payload=payload)


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


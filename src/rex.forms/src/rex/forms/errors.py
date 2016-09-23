#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error


__all__ = (
    'FormError',
    'ValidationError',
    'DataStoreError',
    'AlreadyExistsError',
)


class FormError(Error):
    """
    The base class of any exception raised directly by rex.forms
    """

    def __init__(self, message, payload=None):
        self.message = message
        super(FormError, self).__init__(message, payload=payload)


class ValidationError(FormError):
    """
    The exception raised when there are errors encountered when validating a
    schema.
    """

    pass


class DataStoreError(FormError):
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


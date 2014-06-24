#
# Copyright (c) 2014, Prometheus Research, LLC
#


__all__ = (
    'FormError',
    'ValidationError',
    'DataStoreError',
    'AlreadyExistsError',
)


class FormError(Exception):
    """
    The base class of any exception raised directly by rex.forms
    """

    pass


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


#
# Copyright (c) 2014, Prometheus Research, LLC
#


__all__ = (
    'InstrumentError',
    'ValidationError',
    'DataStoreError',
    'AlreadyExistsError',
)


class InstrumentError(Exception):
    """
    The base class of any exception raised directly by rex.instrument
    """

    pass


class ValidationError(InstrumentError):
    """
    The exception raised when there are errors encountered when validating a
    schema or data structure.
    """

    pass


class DataStoreError(InstrumentError):
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


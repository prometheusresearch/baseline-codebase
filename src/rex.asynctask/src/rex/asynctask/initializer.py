#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Initialize

from .core import get_transport


__all__ = (
    'AsyncTaskInitialize',
)


class AsyncTaskInitialize(Initialize):
    def __call__(self):
        get_transport()


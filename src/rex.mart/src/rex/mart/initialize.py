#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Initialize

from .config import get_all_definitions


__all__ = (
    'MartInitialize',
)


class MartInitialize(Initialize):
    """
    Initializes the rex.mart package and validates all configurations.
    """

    @classmethod
    def signature(cls):  # pragma: no cover
        return 'mart'

    def __call__(self):
        # Load all the definitions and cache them.
        get_all_definitions()


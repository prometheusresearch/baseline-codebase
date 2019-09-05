#
# Copyright (c) 2015, Prometheus Research, LLC
#


from contextlib import contextmanager

from rex.core import Extension

from ..util import global_scope
from .calculationmethod import CalculationMethod


__all__ = (
    'CalculationScopeAddon',
    'global_calculation_scope',
)


class CalculationScopeAddon(Extension):
    """
    An extension that allows a developer to expand the scope of values and/or
    functions that are available in the context of a CalculationSet
    calculation.
    """

    #: The name in the calculation scope that the value will be assigned to.
    name = None

    #: A list containing the CalculationMethod names that this scope addon can
    #: be applied to.
    allowed_methods = []

    @classmethod
    def enabled(cls):
        return cls is not CalculationScopeAddon \
            and cls.name is not None \
            and len(cls.allowed_methods) > 0

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'CalculationScopeAddon':
            assert \
                cls.get_scope_value != CalculationScopeAddon.get_scope_value, \
                'abstract method %s.get_scope_value()' % cls

    @classmethod
    def signature(cls):  # pragma: no cover
        return cls.name

    @classmethod
    def get_addon_scope(cls, method, assessment):
        """
        Returns a dictionary containing the custom values to add to the scope
        of a calculation.

        :param method: the name of the CalculationMethod that is being executed
        :type method: string
        :param assessment:
            the Assessment that the calculation is being executed on
        :type assessment: Assessment
        :rtype: dict
        """

        scope = {}
        for addon in cls.all():
            if method in addon.allowed_methods:
                scope[addon.name] = addon.get_scope_value(assessment)
        return scope

    @classmethod
    def get_all_addon_scopes(cls, assessment):
        """
        Returns a dictionary containing the custom values to add to the scope
        of a calculation, organized by the calculation method they're
        applicable to.

        :param assessment:
            the Assessment that the calculation is being executed on
        :type assessment: Assessment
        :rtype: dict of dicts
        """

        scopes = {}
        for method in CalculationMethod.mapped():
            scopes[method] = cls.get_addon_scope(method, assessment)
        return scopes

    @classmethod
    def get_scope_value(cls, assessment):
        """
        Returns the value to assign to this scope's name.

        Must be implemented by concrete classes.

        :param assessment:
            the Assessment that the calculation is being executed on
        :type assessment: Assessment
        """

        raise NotImplementedError()


@contextmanager
def global_calculation_scope(assessment):
    """
    A context manager that will Initialize all defined CalculationScopeAddons
    and inject those variables into the global Python scope.

    :param assessment: the Assessment to create the calculation scope for
    :type assessment: Assessment
    """

    scope_additions = CalculationScopeAddon.get_addon_scope(
        method='python',
        assessment=assessment,
    )

    with global_scope(scope_additions):
        yield


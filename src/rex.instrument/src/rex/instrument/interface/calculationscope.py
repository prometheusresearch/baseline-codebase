#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Extension


__all__ = (
    'CalculationScopeAddon',
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
            assert cls.get_scope_value != CalculationScopeAddon.get_scope_value, \
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
    def get_scope_value(cls, assessment):
        """
        Returns the value to assign to this scope's name.

        Must be implemented by concrete classes.

        :param assessment:
            the Assessment that the calculation is being executed on
        :type assessment: Assessment
        """

        raise NotImplementedError()


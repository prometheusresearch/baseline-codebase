*********************
CalculationScopeAddon
*********************


Set up the environment::

    >>> from rex.instrument.interface.calculationscope import *
    >>> from rex.instrument.util import get_implementation
    >>> from rex.core import Rex
    >>> rex = Rex('__main__', 'rex.demo.instrument')
    >>> rex.on()


You can add "globally"-available variables and functions to the execution scope
of calculations by implementing the CalculationScopeAddon extension::

    >>> class TestCalculationScope(CalculationScopeAddon):
    ...     name = 'test_variable'
    ...     allowed_methods = ['python']
    ...     @classmethod
    ...     def get_scope_value(cls, assessment):
    ...         return assessment.uid

    >>> CalculationScopeAddon.all()
    [rex.demo.instrument.DemoSubjectSatusScopeAddon, __main__.TestCalculationScope]


The ``get_addon_scope()`` method accepts a calculation method and an assessment
and returns the variables created by the CalculationScopeAddons::

    >>> assessment_impl = get_implementation('assessment')
    >>> assessment = assessment_impl.get_by_uid('assessment1')
    >>> CalculationScopeAddon.get_addon_scope('python', assessment)
    {'subject_status': 'completed', 'test_variable': 'assessment1'}


A utility context manager named ``global_calculation_scope`` can be used by
Python code to simulate the same context as is available to Python callable
calculations::

    >>> subject_status
    Traceback (most recent call last):
        ...
    NameError: name 'subject_status' is not defined

    >>> with global_calculation_scope(assessment):
    ...     subject_status
    'completed'

    >>> subject_status
    Traceback (most recent call last):
        ...
    NameError: name 'subject_status' is not defined



    >>> rex.off()


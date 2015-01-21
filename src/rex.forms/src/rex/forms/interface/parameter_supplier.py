#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension


__all__ = (
    'ParameterSupplier',
)


class ParameterSupplier(Extension):
    """
    Provides a customizable way to retrieve/calculate initialization parameters
    for Forms.
    """

    priority = 1000

    @classmethod
    def enabled(cls):
        return cls is not ParameterSupplier

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'ParameterSupplier':
            assert cls.is_applicable != ParameterSupplier.is_applicable, \
                'abstract method %s.is_applicable()' % cls
            assert cls.get_parameters != ParameterSupplier.get_parameters, \
                'abstract method %s.get_parameters()' % cls

    @classmethod
    def get_task_parameters(cls, task):
        """
        Returns the parameters to use when initializing the Form associated
        with the specified task.

        :param task: the Task to retrieve parameters for
        :type task: Task
        :rtype: dict
        """

        parameters = {}

        for supplier in cls.ordered():
            supplier = supplier()
            if supplier.is_applicable(task):
                parameters.update(supplier.get_parameters(task))

        return parameters

    def is_applicable(self, task):
        """
        Indicates whether or not this ParameterSupplier is involved with the
        specified Task.

        Must be implemented by concrete classes.

        :param task: the Task to check for applicability
        :type task: Task
        :rtype: bool
        """

        raise NotImplementedError()

    def get_parameters(self, task):
        """
        Retrieves parameters that should be given to the Task's Form upon
        initialization.

        Must be implemented by concrete classes.

        :param task: the Task to retrieve parameters for
        :type task: Task
        :rtype: dict
        """

        raise NotImplementedError()


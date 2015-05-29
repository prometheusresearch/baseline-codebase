#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension


__all__ = (
    'TaskCompletionProcessor',
)


class TaskCompletionProcessor(Extension):
    """
    Provides a customizable way to implement post-Task-completion processing.
    """

    priority = 1000

    @classmethod
    def enabled(cls):
        return cls is not TaskCompletionProcessor

    @classmethod
    def sanitize(cls):
        if cls.__name__ != 'TaskCompletionProcessor':
            assert cls.is_applicable != TaskCompletionProcessor.is_applicable,\
                'abstract method %s.is_applicable()' % cls
            assert cls.execute != TaskCompletionProcessor.execute, \
                'abstract method %s.execute()' % cls

    @classmethod
    def execute_processors(cls, task, user):
        """
        Returns the parameters to use when initializing the Form associated
        with the specified task.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        :rtype: dict
        """

        for processor in cls.ordered():
            processor = processor()
            if processor.is_applicable(task, user):
                processor.execute(task, user)

    def is_applicable(self, task, user):
        """
        Indicates whether or not this TaskCompletionProcessor is involved with
        the specified Task.

        Must be implemented by concrete classes.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        :rtype: bool
        """

        raise NotImplementedError()

    def execute(self, task, user):
        """
        Performs the desired post-Task-completion logic.

        Must be implemented by concrete classes.

        :param task: the Task that was completed
        :type task: Task
        :param user: the User who completed the Task
        :type user: User
        """

        raise NotImplementedError()


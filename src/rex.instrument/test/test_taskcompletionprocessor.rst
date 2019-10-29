***********************
TaskCompletionProcessor
***********************


An implementation of TaskCompletionProcessor must implement both the
``is_applicable()`` and ``execute()`` methods::

    >>> from rex.instrument.interface import TaskCompletionProcessor
    >>> class BadProcessor(TaskCompletionProcessor):
    ...     pass
    ...
    Traceback (most recent call last):
      ...
    AssertionError: abstract method __main__.BadProcessor.is_applicable()
    >>> class BadProcessor(TaskCompletionProcessor):
    ...     def is_applicable(self, task):
    ...         return True
    ...
    Traceback (most recent call last):
      ...
    AssertionError: abstract method __main__.BadProcessor.execute()


Given a Task and User, the ``execute_processors()`` method on the base
TaskCompletionProcessor class will check all its implementations for those
whose ``is_applicable()`` method returns ``True``::

    >>> class MyProcessor(TaskCompletionProcessor):
    ...     def is_applicable(self, task, user):
    ...         return True
    ...     def execute(self, task, user):
    ...         print('MyProcessor touched %s' % task.uid)
    ... 
    >>> class UnusedProcessor(TaskCompletionProcessor):
    ...     priority = 25
    ...     def is_applicable(self, task, user):
    ...         return False
    ...     def execute(self, task, user):
    ...         print('This shouldn\'t happen.')
    ... 
    >>> class MyOtherProcessor(TaskCompletionProcessor):
    ...     priority = 50
    ...     def is_applicable(self, task, user):
    ...         return task.subject.uid == 'fake123'
    ...     def execute(self, task, user):
    ...         print('MyOtherProcessor touched %s' % task.uid)
    ... 

    >>> from rex.instrument.interface import Subject, Instrument, InstrumentVersion, User
    >>> from datetime import datetime
    >>> from rex.instrument.interface import Task
    >>> subject = Subject('fake123')
    >>> instrument = Instrument('fake123', 'fake123', 'My Instrument Title')
    >>> INSTRUMENT = {
    ...     'id': 'urn:test-instrument',
    ...     'version': '1.1',
    ...     'title': 'The InstrumentVersion Title',
    ...     'record': [
    ...         {
    ...             'id': 'q_fake',
    ...             'type': 'text'
    ...         }
    ...     ]
    ... }
    >>> iv = InstrumentVersion('notreal456', instrument, INSTRUMENT, 1, 'jay', datetime(2014, 5, 22))
    >>> task = Task('bar999', subject, instrument, 100)
    >>> user = User('userid', 'userlogin')

    >>> from rex.core import Rex
    >>> rex = Rex('__main__', 'rex.instrument', db='pgsql:demo.instrument')
    >>> rex.on()
    >>> TaskCompletionProcessor.execute_processors(task, user)
    MyOtherProcessor touched bar999
    MyProcessor touched bar999
    >>> subject2 = Subject('happy999')
    >>> task2 = Task('bar999', subject2, instrument, 100)
    >>> TaskCompletionProcessor.execute_processors(task2, user)
    MyProcessor touched bar999


TaskCompletionProcessor has a slightly modified ``all()`` method that returns
the classes sorted in order of their ``priority``::

    >>> TaskCompletionProcessor.all()
    [__main__.MyProcessor, __main__.UnusedProcessor, __main__.MyOtherProcessor]



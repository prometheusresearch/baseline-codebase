*****************
ParameterSupplier
*****************


An implementation of ParameterSupplier must implement both the
``is_applicable()`` and ``get_parameters()`` methods::

    >>> from rex.instrument.interface import ParameterSupplier
    >>> class BadSupplier(ParameterSupplier):
    ...     pass
    ...
    Traceback (most recent call last):
      ...
    AssertionError: abstract method __main__.BadSupplier.is_applicable()
    >>> class BadSupplier(ParameterSupplier):
    ...     def is_applicable(self, task):
    ...         return True
    ...
    Traceback (most recent call last):
      ...
    AssertionError: abstract method __main__.BadSupplier.get_parameters()


Given a Task, the ``get_task_parameters()`` method on the base
ParameterSupplier class will check all its implementations for those whose
``is_applicable()`` method returns ``True``, and aggregates the parameters
returned by their ``get_parameters()`` method::

    >>> class MySupplier(ParameterSupplier):
    ...     def is_applicable(self, task):
    ...         return True
    ...     def get_parameters(self, task):
    ...         return {'foo': 'bar'}
    ... 
    >>> class UnusedSupplier(ParameterSupplier):
    ...     priority = 25
    ...     def is_applicable(self, task):
    ...         return False
    ...     def get_parameters(self, task):
    ...         return {'baz': 42}
    ... 
    >>> class MyOtherSupplier(ParameterSupplier):
    ...     priority = 50
    ...     def is_applicable(self, task):
    ...         return task.subject.uid == 'fake123'
    ...     def get_parameters(self, task):
    ...         return {'something': 'or other'}
    ... 

    >>> from rex.instrument.interface import Subject, Instrument, InstrumentVersion, Task
    >>> from datetime import datetime
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

    >>> from rex.core import Rex
    >>> rex = Rex('__main__', 'rex.instrument', db='pgsql:demo.instrument')
    >>> rex.on()
    >>> ParameterSupplier.get_task_parameters(task)
    {'something': 'or other', 'foo': 'bar'}
    >>> subject2 = Subject('happy999')
    >>> task2 = Task('bar999', subject2, instrument, 100)
    >>> ParameterSupplier.get_task_parameters(task2)
    {'foo': 'bar'}


ParameterSupplier has a slightly modified ``all()`` method that returns the
classes sorted in order of their ``priority``::

    >>> ParameterSupplier.all()
    [__main__.MySupplier, __main__.UnusedSupplier, __main__.MyOtherSupplier]



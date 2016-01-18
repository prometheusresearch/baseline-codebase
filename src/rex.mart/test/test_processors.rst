**********
Processors
**********


Set up the environment::

    >>> from rex.core import Rex, StrVal
    >>> from rex.mart import Processor


Procesor options must be tuples containing the name, a validator, and
optionally a default value::

    >>> class MyProcessor(Processor):
    ...     options = (
    ...         'foo',
    ...     )
    Traceback (most recent call last):
        ...
    Error: Option must be a tuple/list
        foo

    >>> class MyProcessor(Processor):
    ...     options = (
    ...         ('foo',),
    ...     )
    Traceback (most recent call last):
        ...
    Error: Invalid Processor Option
        ('foo',)

    >>> class MyProcessor(Processor):
    ...     options = (
    ...         (123, StrVal()),
    ...     )
    Traceback (most recent call last):
        ...
    Error: Option name must be a string
        123

    >>> class MyProcessor(Processor):
    ...     options = (
    ...         ('foo', 123),
    ...     )
    Traceback (most recent call last):
        ...
    Error: Option validator must be callable
        123

    >>> class MyProcessor(Processor):
    ...     name = 'test'
    ...     options = (
    ...         ('foo', StrVal()),
    ...         ('bar', StrVal(), 'default'),
    ...     )
    >>> rex = Rex('__main__', 'rex.mart_demo')
    >>> rex.on()
    >>> sorted([repr(proc) for proc in Processor.all()])
    ['__main__.MyProcessor', 'rex.mart.processors.datadictionary.DataDictionaryProcessor', 'rex.mart_demo.MyProcessor', 'rex.mart_demo.OtherProcessor']
    >>> rex.off()


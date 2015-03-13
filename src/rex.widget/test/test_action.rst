Configurable application actions
================================

    >>> import rex.ctl

    >>> from rex.core import Rex
    >>> app = Rex('rex.widget_demo')
    >>> app.on()

    >>> from rex.widget.action import ActionVal

Parsing action calls
--------------------

Validator :class:`rex.widget.action.ActionVal` can be used to parse action calls
out of YAML::

    >>> parse = ActionVal().parse

A single action call::

    >>> parse("""
    ... action: set
    ... """)
    ActionCall(action=rex.widget.action.Set, params={})

A series of action calls::

    >>> parse("""
    ... - action: set
    ... - action: reset
    ... """) # doctest: +NORMALIZE_WHITESPACE
    ActionCallSeq(calls=[ActionCall(action=rex.widget.action.Set, params={}),
                         ActionCall(action=rex.widget.action.Reset, params={})])

If the action call refers to an action which doesn't exist::

    >>> parse("""
    ... action: xxx
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Invalid action:
        xxx
    While parsing:
        "<byte string>", line 2

::

    >>> app.off()

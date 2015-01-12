Widget inheritance
==================

First of all we need to initialize new Rex application::

    >>> from rex.core import Rex

    >>> demo = Rex('-')
    >>> demo.on()

We need to import ``Widget`` and ``Field``
classes from ``rex.widget`` package::

    >>> from rex.core import StrVal
    >>> from rex.widget import Widget, Field, parse

Inheritance
-----------

We define a super class::

    >>> class Super(Widget):
    ...   name = 'Super'
    ...   js_type = 'Super'
    ...
    ...   super_required = Field(StrVal())
    ...   super_optional = Field(StrVal(), default='OK')

We define a subclass::

    >>> class Sub(Super):
    ...   name = 'Sub'
    ...   js_type = 'Sub'
    ...
    ...   sub_required = Field(StrVal())
    ...   sub_optional = Field(StrVal(), default='NOPE')

Check if we actually defined ``Sub``::

    >>> Sub in Widget.all()
    True
    >>> 'Sub' in Widget.map_all()
    True

Check if we inherited fields::

    >>> 'super_required' in Sub.fields
    True
    >>> 'super_optional' in Sub.fields
    True

We can use ``Super``::

    >>> w = parse("""
    ... !<Super>
    ... super_required: ME
    ... """)

    >>> w.super_required
    'ME'
    >>> w.super_optional
    'OK'

We can use ``Sub``::

    >>> w = parse("""
    ... !<Sub>
    ... super_required: ME
    ... sub_required: MEOW
    ... """)

    >>> w.super_required
    'ME'
    >>> w.super_optional
    'OK'
    >>> w.sub_required
    'MEOW'
    >>> w.sub_optional
    'NOPE'

Inheritance with abstract base widget class
-------------------------------------------

We can omit ``name`` attribute of base widget class so it would be an absract
base class::

    >>> class Abstract(Widget):
    ...
    ...   field = Field(StrVal())

    >>> class Concrete(Abstract):
    ...   name = 'Concrete'
    ...   js_type = 'Concrete'
    ...
    ...   another_field = Field(StrVal())

Now we cannot use ``Abstract``::

    >>> Abstract not in Widget.all()
    True
    >>> 'Abstract' not in Widget.map_all()
    True

But ``Concrete`` is OK::

    >>> Concrete not in Widget.all()
    True
    >>> 'Concrete' not in Widget.map_all()
    True

Pick date action
================

::

  >>> from webob import Request

  >>> from rex.core import Rex
  >>> from rex.widget import render_widget
  >>> from rex.action import Action

Init
----

::

  >>> rex = Rex('-', 'rex.action_demo')
  >>> rex.on()

In case fields are not specified, they are generated from port::

  >>> pick_date = Action.parse("""
  ... type: pick-date 
  ... id: pick-date
  ... """)

  >>> pick_date # doctest: +NORMALIZE_WHITESPACE
  PickDate(icon=undefined,
           width=undefined,
           id='pick-date',
           title=undefined,
           annotate_month=None,
           annotate_year=None)

  >>> input, output = pick_date.context_types

  >>> input
  RecordType(rows={}, open=True)
  
  >>> output
  RecordType(rows={'date': RowType(name='date', type=ValueType(name='date'))}, open=True)

Cleanup
-------

::

  >>> rex.off()


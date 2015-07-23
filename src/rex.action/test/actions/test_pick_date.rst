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

  >>> pick_date.context()
  ({}, {'date': 'date'})

  >>> print render_widget(pick_date, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: 266
  <BLANKLINE>
  ["~#widget", ["rex-action/lib/Actions/PickDate",
                {"contextSpec": {"input": {}, "output": {"date": "date"}},
                 "title": ["~#undefined", []],
                 "width": ["^6", []],
                 "id": "pick-date",
                 "icon": ["^6", []],
                 "annotateYearQuery": ["^6", []],
                 "annotateMonthQuery": ["^6", []]}]]

Cleanup
-------

::

  >>> rex.off()


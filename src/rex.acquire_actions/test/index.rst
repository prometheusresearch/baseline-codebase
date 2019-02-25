**********************************
REX.ACQUIRE_ACTIONS Examples/Tests
**********************************

::

    >>> from rex.core import Rex

    >>> app = Rex(
    ...   '-', 'rex.acquire_actions',
    ...   db='pgsql:acquire_actions_demo',
    ...   attach_dir='/tmp')
    >>> app.on()

Define a custom widget for forms
--------------------------------

::

    >>> from rex.action import ActionVal
    >>> from rex.acquire_actions import FormQuestionWidget

    >>> class NaiveDateTime(FormQuestionWidget):
    ...     name = 'naive-datetime'
    ...     js_type = 'rex-acquire-actions', 'NaiveDateTime'

::

    >>> enter_data = ActionVal().parse("""
    ... type: task-enter-data
    ... title: Enter Data
    ... entity:
    ...   task: task
    ... channel: entry
    ... show_calculations: true
    ... """)

    >>> enter_data.widget_config
    {'naive-datetime': JSValue(package='@js-package::rex-acquire-actions', symbol='NaiveDateTime')}

::

    >>> app.off()
